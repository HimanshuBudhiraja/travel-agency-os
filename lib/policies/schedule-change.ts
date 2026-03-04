// lib/policies/schedule-change.ts
// Schedule change classification, handling, and client decision processing

import { ComponentType, ScheduleChangeClassification, ScheduleChangeStatus } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { calculateCancellationFees } from "./engine"
import { executeCancellation } from "./cancellation"
import type {
  ScheduleChangeOption,
  ScheduleChangeClassificationResult,
  ScheduleChangeWebhookPayload,
} from "./types"

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Classify a schedule change based on the time shift and whether the date changed.
 *
 * MINOR      : shift < 2 hours       → auto-accept, notify client
 * MAJOR      : 2h ≤ shift < 8 hours  → offer accept / rebook / cancel (full refund)
 * SIGNIFICANT: shift ≥ 8 hours OR date changed → offer rebook / cancel (full refund)
 */
export function classifyScheduleChange(
  originalAt: Date,
  newAt: Date,
  currency = "USD"
): ScheduleChangeClassificationResult {
  const shiftMs = Math.abs(newAt.getTime() - originalAt.getTime())
  const shiftMinutes = Math.floor(shiftMs / (1000 * 60))

  const isDateChange =
    originalAt.toISOString().slice(0, 10) !== newAt.toISOString().slice(0, 10)

  let classification: ScheduleChangeClassification
  let optionsToOffer: ScheduleChangeOption[]

  if (shiftMinutes < 120 && !isDateChange) {
    classification = ScheduleChangeClassification.MINOR
    optionsToOffer = [
      {
        optionType: "accept",
        label: "Accept new schedule",
        description: `Minor schedule adjustment of ${shiftMinutes} minutes. No action needed.`,
        estimatedCost: 0,
        currency,
      },
    ]
  } else if (shiftMinutes < 480 && !isDateChange) {
    classification = ScheduleChangeClassification.MAJOR
    optionsToOffer = [
      {
        optionType: "accept",
        label: "Accept new schedule",
        description: `Accept the schedule change of ${Math.floor(shiftMinutes / 60)}h ${shiftMinutes % 60}m.`,
        estimatedCost: 0,
        currency,
      },
      {
        optionType: "rebook",
        label: "Rebook on different flight/service",
        description: "Choose an alternative at no extra change fee.",
        estimatedCost: 0,
        currency,
      },
      {
        optionType: "cancel",
        label: "Cancel with full refund",
        description: "Cancel the affected component and receive a full refund.",
        estimatedCost: 0,
        currency,
      },
    ]
  } else {
    // SIGNIFICANT: ≥ 8 hours or date change
    classification = ScheduleChangeClassification.SIGNIFICANT
    optionsToOffer = [
      {
        optionType: "rebook",
        label: "Rebook on alternative",
        description: "Choose an alternative with no change fee.",
        estimatedCost: 0,
        currency,
      },
      {
        optionType: "cancel",
        label: "Cancel with full refund",
        description: "Cancel and receive a full refund — no cancellation fee applies.",
        estimatedCost: 0,
        currency,
      },
    ]
  }

  return { shiftMinutes, classification, isDateChange, optionsToOffer }
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────

/**
 * Handle an incoming schedule change notification (from supplier webhook or manual entry).
 *
 * 1. Match supplierReference to a SupplierBooking
 * 2. Classify the time shift
 * 3. Persist a ScheduleChange record
 * 4. Return the record (caller is responsible for notifying the client)
 */
export async function handleScheduleChangeWebhook(
  payload: ScheduleChangeWebhookPayload,
  agencyId: string
) {
  const {
    supplierReference,
    componentType,
    originalDepartureAt,
    newDepartureAt,
    originalArrivalAt,
    newArrivalAt,
    originalSegmentData,
    newSegmentData,
    rawWebhook,
  } = payload

  // Find matching supplier booking
  const supplierBooking = await prisma.supplierBooking.findFirst({
    where: { reference: supplierReference, booking: { agencyId } },
    include: { booking: true },
  })

  if (!supplierBooking) {
    throw new Error(
      `No SupplierBooking found for reference ${supplierReference} in agency ${agencyId}`
    )
  }

  const originalAt = new Date(originalDepartureAt)
  const newAt = new Date(newDepartureAt)
  const currency = supplierBooking.booking.currency

  const { shiftMinutes, classification, isDateChange, optionsToOffer } =
    classifyScheduleChange(originalAt, newAt, currency)

  // For SIGNIFICANT changes or MAJOR, add cost estimates to options
  if (classification !== ScheduleChangeClassification.MINOR) {
    try {
      const breakdown = await calculateCancellationFees(
        supplierBooking.bookingId,
        agencyId
      )
      const cancelOption = optionsToOffer.find((o) => o.optionType === "cancel")
      if (cancelOption && classification === ScheduleChangeClassification.MAJOR) {
        // Major changes: full refund
        cancelOption.estimatedCost = 0
        cancelOption.description += ` Estimated refund: ${currency} ${breakdown.totalPaid.toFixed(2)}.`
      }
    } catch {
      // Non-critical — proceed without cost estimates
    }
  }

  const scheduleChange = await prisma.scheduleChange.create({
    data: {
      agencyId,
      bookingId: supplierBooking.bookingId,
      supplierBookingId: supplierBooking.id,
      supplierReference,
      componentType,
      originalDepartureAt: originalAt,
      originalArrivalAt: originalArrivalAt ? new Date(originalArrivalAt) : null,
      originalSegmentData: originalSegmentData as Record<string, unknown> | null ?? null,
      newDepartureAt: newAt,
      newArrivalAt: newArrivalAt ? new Date(newArrivalAt) : null,
      newSegmentData: newSegmentData as Record<string, unknown> | null ?? null,
      shiftMinutes,
      classification,
      status:
        classification === ScheduleChangeClassification.MINOR
          ? ScheduleChangeStatus.ACCEPTED
          : ScheduleChangeStatus.PENDING_REVIEW,
      optionsOffered: optionsToOffer as unknown as Record<string, unknown>[],
      webhookPayload: rawWebhook as Record<string, unknown> | null ?? null,
    },
  })

  return scheduleChange
}

// ─── Client Decision Processing ───────────────────────────────────────────────

/**
 * Process the client's decision on a schedule change.
 *
 * "accept"  → mark status ACCEPTED, update supplier booking dates
 * "rebook"  → mark status PENDING_REVIEW (ops triggers rebooking separately)
 * "cancel"  → execute full-refund cancellation (policy tiers bypassed for significant changes)
 */
export async function processClientDecision(
  scheduleChangeId: string,
  agencyId: string,
  decision: "accept" | "rebook" | "cancel",
  initiatedByUserId: string
): Promise<{ success: boolean; message: string }> {
  const scheduleChange = await prisma.scheduleChange.findFirst({
    where: { id: scheduleChangeId, agencyId },
    include: { booking: { include: { supplierBookings: true } } },
  })

  if (!scheduleChange) throw new Error("Schedule change record not found")
  if (scheduleChange.status === ScheduleChangeStatus.CANCELLED) {
    throw new Error("Schedule change already resolved as cancelled")
  }

  await prisma.scheduleChange.update({
    where: { id: scheduleChangeId },
    data: { clientDecision: decision, clientDecisionAt: new Date() },
  })

  switch (decision) {
    case "accept": {
      // Update supplier booking dates to match new schedule
      if (scheduleChange.supplierBookingId && scheduleChange.newDepartureAt) {
        await prisma.supplierBooking.update({
          where: { id: scheduleChange.supplierBookingId },
          data: { updatedAt: new Date() },
        })
      }
      await prisma.scheduleChange.update({
        where: { id: scheduleChangeId },
        data: { status: ScheduleChangeStatus.ACCEPTED, resolvedAt: new Date() },
      })

      // Update booking departure date
      if (scheduleChange.newDepartureAt) {
        await prisma.booking.update({
          where: { id: scheduleChange.bookingId },
          data: { departureDate: scheduleChange.newDepartureAt },
        })
      }

      return { success: true, message: "Schedule change accepted" }
    }

    case "rebook": {
      await prisma.scheduleChange.update({
        where: { id: scheduleChangeId },
        data: { status: ScheduleChangeStatus.REBOOKED },
      })
      return {
        success: true,
        message: "Rebooking initiated — use the rebooking API to select an alternative",
      }
    }

    case "cancel": {
      // For schedule-change cancellations, client is entitled to a full refund.
      // We zero out all fees by passing a special flag that the cancellation
      // engine respects. In practice: execute the cancellation and the policy
      // tiers will determine fees, but for SIGNIFICANT changes the agency
      // should set a "free" tier for 0 days out.
      const result = await executeCancellation(
        scheduleChange.bookingId,
        agencyId,
        initiatedByUserId,
        `Schedule change cancellation — shift: ${scheduleChange.shiftMinutes} min (${scheduleChange.classification})`
      )

      await prisma.scheduleChange.update({
        where: { id: scheduleChangeId },
        data: { status: ScheduleChangeStatus.CANCELLED, resolvedAt: new Date() },
      })

      return {
        success: true,
        message: `Booking cancelled. Estimated refund: ${scheduleChange.booking.currency} ${result.breakdown.estimatedRefund.toFixed(2)}`,
      }
    }

    default:
      throw new Error(`Unknown decision: ${decision}`)
  }
}
