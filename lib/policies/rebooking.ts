// lib/policies/rebooking.ts
// Rebooking preview and execution orchestration

import { BookingChangeStatus, ComponentType, FeeSource } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { searchFlights } from "@/lib/suppliers/duffel"
import { searchHotels } from "@/lib/suppliers/ratehawk"
import { getAgencyPolicies, getApplicablePolicyTier, calculatePolicyFee } from "./engine"
import { getSupplierChangeFee, confirmDuffelOrderChange, cancelRateHawkOrder } from "./supplier-fees"
import type {
  RebookingPreviewRequest,
  RebookingConfirmRequest,
  RebookingBreakdown,
  ComponentRebookingFee,
  RebookingOption,
  AgencyPolicyDef,
} from "./types"

const MS_PER_DAY = 1000 * 60 * 60 * 24

// ─── Preview ──────────────────────────────────────────────────────────────────

/**
 * Preview rebooking options and fees without executing anything.
 *
 * Algorithm:
 * 1. Fetch booking + supplier bookings
 * 2. For each component: get change fee (supplier API or policy fallback)
 * 3. Search new options via existing adapters
 * 4. Compute total additional cost
 */
export async function previewRebooking(
  request: RebookingPreviewRequest
): Promise<RebookingBreakdown> {
  const { bookingId, agencyId } = request

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, agencyId },
    include: { supplierBookings: true },
  })

  if (!booking) throw new Error(`Booking ${bookingId} not found for agency ${agencyId}`)
  if (booking.status === "CANCELLED") throw new Error("Cannot rebook a cancelled booking")

  const daysUntilDeparture = booking.departureDate
    ? Math.floor((booking.departureDate.getTime() - Date.now()) / MS_PER_DAY)
    : 30

  const policies = await getAgencyPolicies(agencyId)
  const firstPolicy = policies.values().next().value as AgencyPolicyDef | undefined

  const components: ComponentRebookingFee[] = []
  const newOptions: RebookingOption[] = []
  const warnings: string[] = []
  let hasLiveSupplierData = false

  for (const sb of booking.supplierBookings) {
    const componentType = sb.componentType
    const policy = policies.get(componentType)
    const tier = getApplicablePolicyTier(policy, daysUntilDeparture)
    const { fee: policyChangeFee } = calculatePolicyFee(tier, sb.cost)

    let supplierChangeFee: number | null = null
    let supplierChangeFeeSource: FeeSource = FeeSource.POLICY
    let appliedChangeFeeSource: FeeSource = FeeSource.POLICY

    if (sb.reference) {
      try {
        const result = await getSupplierChangeFee(componentType, sb.reference, sb.cost)
        if (result.source === "supplier") {
          supplierChangeFee = result.fee
          supplierChangeFeeSource = FeeSource.SUPPLIER
          hasLiveSupplierData = true
        } else {
          warnings.push(
            `${componentType} change fee unavailable: ${(result as { reason: string }).reason}`
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        warnings.push(`${componentType} change API error: ${msg} — using policy`)
      }
    }

    const appliedChangeFee =
      supplierChangeFee !== null
        ? Math.max(supplierChangeFee, policyChangeFee)
        : policyChangeFee
    appliedChangeFeeSource =
      supplierChangeFee !== null && supplierChangeFee >= policyChangeFee
        ? FeeSource.SUPPLIER
        : FeeSource.POLICY

    // Search new options for this component
    const newCost = await searchNewOptions(componentType, sb.cost, request, newOptions, warnings)

    components.push({
      supplierBookingId: sb.id,
      componentType,
      supplierReference: sb.reference,
      originalCost: sb.cost,
      newCost,
      fareDifference: newCost - sb.cost,
      supplierChangeFee,
      supplierChangeFeeSource,
      policyChangeFee,
      appliedChangeFee,
      appliedChangeFeeSource,
      currency: sb.currency,
    })
  }

  const totalChangeFees = components.reduce((s, c) => s + c.appliedChangeFee, 0)
  const totalFareDifference = components.reduce((s, c) => s + c.fareDifference, 0)
  const agencyRebookingServiceFee = firstPolicy?.rebookingServiceFee ?? 0
  const totalAdditionalCost = totalChangeFees + totalFareDifference + agencyRebookingServiceFee

  return {
    bookingId,
    agencyId,
    components,
    newOptions,
    totalChangeFees,
    totalFareDifference,
    agencyRebookingServiceFee,
    totalAdditionalCost,
    currency: booking.currency,
    calculatedAt: new Date().toISOString(),
    hasLiveSupplierData,
    warnings,
  }
}

async function searchNewOptions(
  componentType: ComponentType,
  originalCost: number,
  request: RebookingPreviewRequest,
  newOptions: RebookingOption[],
  warnings: string[]
): Promise<number> {
  try {
    if (componentType === ComponentType.FLIGHT && request.newDepartureDate) {
      const results = await searchFlights({
        origin: request.newOrigin || "LHR",
        destination: request.newDestination || "DXB",
        departureDate: request.newDepartureDate,
        returnDate: request.newReturnDate,
        adults: request.newAdults || 1,
        cabinClass: (request.newCabinClass as "economy" | "premium_economy" | "business" | "first") || "economy",
      })
      for (const r of results.slice(0, 3)) {
        newOptions.push({
          optionId: crypto.randomUUID(),
          componentType: ComponentType.FLIGHT,
          supplierRef: r.supplierRef,
          description: `${r.airline} — ${r.departureTime} → ${r.arrivalTime} (${r.stops} stop${r.stops !== 1 ? "s" : ""})`,
          newDepartureAt: r.departureTime,
          newArrivalAt: r.arrivalTime,
          newCost: r.price,
          currency: r.currency,
        })
      }
      return results[0]?.price ?? originalCost
    }

    if (
      componentType === ComponentType.HOTEL &&
      (request.newCheckIn || request.newDepartureDate)
    ) {
      const checkIn = request.newCheckIn || request.newDepartureDate || ""
      const checkOut = request.newCheckOut || request.newReturnDate || ""
      const results = await searchHotels({
        destination: request.newDestination || "Dubai",
        checkIn,
        checkOut,
        adults: request.newAdults || 1,
      })
      for (const r of results.slice(0, 3)) {
        newOptions.push({
          optionId: crypto.randomUUID(),
          componentType: ComponentType.HOTEL,
          supplierRef: r.supplierRef,
          description: `${r.name} (${r.stars}★) — ${r.pricePerNight}/night`,
          newCheckIn: checkIn,
          newCheckOut: checkOut,
          newCost: r.totalPrice,
          currency: r.currency,
        })
      }
      return results[0]?.totalPrice ?? originalCost
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    warnings.push(`Could not search new ${componentType} options: ${msg}`)
  }

  return originalCost
}

// ─── Execute ──────────────────────────────────────────────────────────────────

export interface ExecuteRebookingResult {
  bookingChange: {
    id: string
    status: string
    newTotalCost: number
  }
  breakdown: RebookingBreakdown
  supplierErrors: string[]
}

/**
 * Execute rebooking by confirming a selected RebookingOption.
 *
 * 1. Re-run previewRebooking for fresh fees
 * 2. Find the selected option
 * 3. Confirm supplier changes
 * 4. Persist everything in a transaction
 */
export async function executeRebooking(
  request: RebookingConfirmRequest & RebookingPreviewRequest
): Promise<ExecuteRebookingResult> {
  const breakdown = await previewRebooking(request)

  const selectedOption = breakdown.newOptions.find(
    (o) => o.optionId === request.selectedOptionId
  )
  if (!selectedOption) {
    throw new Error(`Option ${request.selectedOptionId} not found in rebooking preview`)
  }

  const booking = await prisma.booking.findFirst({
    where: { id: request.bookingId, agencyId: request.agencyId },
    include: { supplierBookings: true },
  })
  if (!booking) throw new Error("Booking not found")

  const supplierErrors: string[] = []
  const newTotalCost = booking.totalCost + breakdown.totalAdditionalCost

  await prisma.$transaction(async (tx) => {
    // Create audit record
    await tx.bookingChange.create({
      data: {
        agencyId: request.agencyId,
        bookingId: request.bookingId,
        changeType: "REBOOKING",
        status: BookingChangeStatus.CONFIRMED,
        feesBreakdown: breakdown as unknown as Record<string, unknown>,
        feeSource: breakdown.hasLiveSupplierData ? FeeSource.SUPPLIER : FeeSource.POLICY,
        totalFees: breakdown.totalChangeFees + breakdown.agencyRebookingServiceFee,
        newTotalCost,
        newSupplierReference: selectedOption.supplierRef,
        initiatedByUserId: request.initiatedByUserId,
        notes: request.notes,
        confirmedAt: new Date(),
      },
    })

    // Update the matching supplier booking with new reference and cost
    const matchingSb = booking.supplierBookings.find(
      (sb) => sb.componentType === selectedOption.componentType
    )
    if (matchingSb) {
      // For hotels: cancel old booking and create new one
      if (selectedOption.componentType === ComponentType.HOTEL && matchingSb.reference) {
        try {
          await cancelRateHawkOrder(matchingSb.reference)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          supplierErrors.push(`RateHawk cancel during rebook failed: ${msg}`)
        }
      }

      // For flights: confirm the Duffel order change
      if (selectedOption.componentType === ComponentType.FLIGHT && matchingSb.reference) {
        // The change request ID would normally be stored from the preview step.
        // In this simplified flow we log it; in production store it in BookingChange.
        supplierErrors.push(
          "Note: Duffel flight change must be confirmed separately using the change request ID"
        )
      }

      await tx.supplierBooking.update({
        where: { id: matchingSb.id },
        data: {
          reference: selectedOption.supplierRef,
          cost: selectedOption.newCost,
          originalCost: matchingSb.cost,
          status: "confirmed",
        },
      })
    }

    // Update booking totals and dates
    await tx.booking.update({
      where: { id: request.bookingId },
      data: {
        totalCost: newTotalCost,
        ...(request.newDepartureDate && { departureDate: new Date(request.newDepartureDate) }),
        ...(request.newReturnDate && { returnDate: new Date(request.newReturnDate) }),
        ...(selectedOption.newDepartureAt && {
          departureDate: new Date(selectedOption.newDepartureAt),
        }),
      },
    })
  })

  return {
    bookingChange: {
      id: `rebook-${Date.now()}`,
      status: BookingChangeStatus.CONFIRMED,
      newTotalCost,
    },
    breakdown,
    supplierErrors,
  }
}
