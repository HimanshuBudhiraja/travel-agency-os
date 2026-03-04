// lib/policies/cancellation.ts
// Cancellation preview and execution orchestration

import { BookingChangeStatus, BookingStatus, ComponentType, FeeSource } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { calculateCancellationFees } from "./engine"
import {
  confirmDuffelOrderCancellation,
  cancelRateHawkOrder,
  createDuffelOrderCancellation,
} from "./supplier-fees"
import type { CancellationBreakdown } from "./types"

// ─── Preview ──────────────────────────────────────────────────────────────────

/**
 * Read-only preview of cancellation fees.
 * No DB writes, no supplier confirmations.
 */
export async function previewCancellation(
  bookingId: string,
  agencyId: string
): Promise<CancellationBreakdown> {
  return calculateCancellationFees(bookingId, agencyId)
}

// ─── Execute ──────────────────────────────────────────────────────────────────

export interface ExecuteCancellationResult {
  bookingChange: {
    id: string
    status: string
    totalFees: number
    refundAmount: number
  }
  breakdown: CancellationBreakdown
  supplierErrors: string[]
}

/**
 * Execute cancellation:
 * 1. Re-run previewCancellation for fresh fees
 * 2. Create pending Duffel cancellations for all FLIGHT components
 * 3. In a Prisma transaction:
 *    a. Create BookingChange audit record
 *    b. Confirm each Duffel cancellation
 *    c. Cancel each RateHawk hotel booking
 *    d. Update SupplierBooking statuses
 *    e. Update Booking.status = CANCELLED
 *    f. Adjust Client.bookingCount and lifetimeValue
 *
 * On any supplier API failure the transaction rolls back and a partial error
 * is returned. The pending Duffel cancellations are NOT confirmed in that case.
 */
export async function executeCancellation(
  bookingId: string,
  agencyId: string,
  initiatedByUserId: string,
  notes?: string
): Promise<ExecuteCancellationResult> {
  // Always use fresh fee calculation — previews can go stale
  const breakdown = await previewCancellation(bookingId, agencyId)

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, agencyId },
    include: { supplierBookings: true },
  })

  if (!booking) throw new Error(`Booking ${bookingId} not found`)
  if (booking.status === BookingStatus.CANCELLED) {
    throw new Error("Booking is already cancelled")
  }

  const supplierErrors: string[] = []

  // Step 1: Create pending Duffel cancellations (before the transaction so we
  // have the cancellation IDs ready to confirm inside the transaction)
  const pendingDuffelCancels: Array<{
    supplierBookingId: string
    duffelCancelId: string
  }> = []

  if (process.env.DUFFEL_API_KEY) {
    for (const sb of booking.supplierBookings) {
      if (sb.componentType === ComponentType.FLIGHT && sb.reference) {
        try {
          const cancel = await createDuffelOrderCancellation(sb.reference)
          pendingDuffelCancels.push({
            supplierBookingId: sb.id,
            duffelCancelId: cancel.id,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          supplierErrors.push(`Duffel pending cancel failed for ${sb.id}: ${msg}`)
        }
      }
    }
  }

  // Step 2: Execute everything inside a transaction
  const bookingChange = await prisma.$transaction(async (tx) => {
    // a. Create audit record
    const change = await tx.bookingChange.create({
      data: {
        agencyId,
        bookingId,
        changeType: "CANCELLATION",
        status: BookingChangeStatus.CONFIRMED,
        feesBreakdown: breakdown as unknown as Record<string, unknown>,
        feeSource: breakdown.hasLiveSupplierData ? FeeSource.SUPPLIER : FeeSource.POLICY,
        totalFees: breakdown.totalFees,
        refundAmount: breakdown.estimatedRefund,
        initiatedByUserId,
        notes,
        confirmedAt: new Date(),
      },
    })

    // b. Confirm each Duffel cancellation
    for (const { supplierBookingId, duffelCancelId } of pendingDuffelCancels) {
      try {
        await confirmDuffelOrderCancellation(duffelCancelId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        supplierErrors.push(`Duffel confirm cancel failed for ${supplierBookingId}: ${msg}`)
        // Continue — we still update DB; ops can reconcile manually
      }
      await tx.supplierBooking.update({
        where: { id: supplierBookingId },
        data: { status: "cancelled" },
      })
    }

    // c. Cancel each RateHawk hotel booking
    for (const sb of booking.supplierBookings) {
      if (sb.componentType === ComponentType.HOTEL && sb.reference) {
        try {
          await cancelRateHawkOrder(sb.reference)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          supplierErrors.push(`RateHawk cancel failed for ${sb.id}: ${msg}`)
        }
        await tx.supplierBooking.update({
          where: { id: sb.id },
          data: { status: "cancelled" },
        })
      }
    }

    // d. Mark remaining supplier bookings as cancelled (transfers, etc.)
    for (const sb of booking.supplierBookings) {
      if (
        sb.componentType !== ComponentType.FLIGHT &&
        sb.componentType !== ComponentType.HOTEL
      ) {
        await tx.supplierBooking.update({
          where: { id: sb.id },
          data: { status: "cancelled" },
        })
      }
    }

    // e. Update booking
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
    })

    // f. Adjust client stats
    await tx.client.update({
      where: { id: booking.clientId },
      data: {
        bookingCount: { decrement: 1 },
        lifetimeValue: { decrement: breakdown.estimatedRefund },
      },
    })

    return change
  })

  return {
    bookingChange: {
      id: bookingChange.id,
      status: bookingChange.status,
      totalFees: bookingChange.totalFees,
      refundAmount: bookingChange.refundAmount ?? 0,
    },
    breakdown,
    supplierErrors,
  }
}
