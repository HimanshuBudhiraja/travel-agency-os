// lib/policies/engine.ts
// Core cancellation fee calculation engine

import { ComponentType, FeeSource } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { getSupplierCancellationFee } from "./supplier-fees"
import type {
  AgencyPolicyDef,
  PolicyTierDef,
  ComponentCancellationFee,
  CancellationBreakdown,
} from "./types"

const MS_PER_DAY = 1000 * 60 * 60 * 24

// ─── Policy Loading ───────────────────────────────────────────────────────────

/**
 * Fetch all default agency policies for an agency and return them as a Map
 * keyed by ComponentType. If no policy exists for a component type, that key
 * will be absent from the map.
 */
export async function getAgencyPolicies(
  agencyId: string
): Promise<Map<ComponentType, AgencyPolicyDef>> {
  const policies = await prisma.agencyPolicy.findMany({
    where: { agencyId, isDefault: true },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  })

  const map = new Map<ComponentType, AgencyPolicyDef>()
  for (const p of policies) {
    map.set(p.componentType, {
      id: p.id,
      agencyId: p.agencyId,
      componentType: p.componentType,
      name: p.name,
      isDefault: p.isDefault,
      tiers: p.tiers.map((t) => ({
        id: t.id,
        daysBeforeMin: t.daysBeforeMin,
        daysBeforeMax: t.daysBeforeMax,
        feeType: t.feeType,
        feeValue: t.feeValue,
        description: t.description,
        sortOrder: t.sortOrder,
      })),
      cancellationServiceFee: p.cancellationServiceFee,
      rebookingServiceFee: p.rebookingServiceFee,
      scheduleChangeServiceFee: p.scheduleChangeServiceFee,
    })
  }
  return map
}

// ─── Tier Selection ───────────────────────────────────────────────────────────

/**
 * Find the single applicable PolicyTier for a given number of days before departure.
 *
 * Matching rule: a tier matches when:
 *   daysBeforeDeparture >= tier.daysBeforeMin
 *   AND (tier.daysBeforeMax is null OR daysBeforeDeparture <= tier.daysBeforeMax)
 *
 * When multiple tiers match (shouldn't happen with well-configured policies),
 * the one with the highest daysBeforeMin wins (most specific / tightest window).
 */
export function getApplicablePolicyTier(
  policy: AgencyPolicyDef | undefined,
  daysBeforeDeparture: number
): PolicyTierDef | null {
  if (!policy || policy.tiers.length === 0) return null

  // Sort descending by daysBeforeMin so the first match is the most specific
  const sorted = [...policy.tiers].sort((a, b) => b.daysBeforeMin - a.daysBeforeMin)

  for (const tier of sorted) {
    const aboveMin = daysBeforeDeparture >= tier.daysBeforeMin
    const belowMax = tier.daysBeforeMax === null || daysBeforeDeparture <= tier.daysBeforeMax
    if (aboveMin && belowMax) return tier
  }

  return null
}

// ─── Fee Calculation ──────────────────────────────────────────────────────────

/**
 * Calculate the policy-based fee for a single component.
 *
 * feeType variants:
 *   "free"       → 0
 *   "percentage" → round(componentCost × feeValue / 100, 2)
 *   "flat"       → feeValue
 *   "nights"     → round((componentCost / nightsCount) × feeValue, 2)  — hotels only
 */
export function calculatePolicyFee(
  tier: PolicyTierDef | null,
  componentCost: number,
  nightsCount = 1
): { fee: number; description: string } {
  if (!tier) {
    return { fee: 0, description: "No policy tier — fully refundable" }
  }

  let fee: number
  switch (tier.feeType) {
    case "free":
      fee = 0
      break
    case "percentage":
      fee = Math.round(((componentCost * tier.feeValue) / 100) * 100) / 100
      break
    case "flat":
      fee = tier.feeValue
      break
    case "nights":
      fee =
        Math.round(((componentCost / Math.max(nightsCount, 1)) * tier.feeValue) * 100) / 100
      break
    default:
      fee = 0
  }

  return {
    fee: Math.min(fee, componentCost), // fee cannot exceed total cost
    description: tier.description ?? `${tier.feeType} fee (${tier.feeValue})`,
  }
}

// ─── Master Calculation ───────────────────────────────────────────────────────

/**
 * Calculate cancellation fees for all supplier bookings in a booking.
 *
 * This is a read-only preview — it does NOT cancel anything or write to the DB.
 * For each component:
 *   1. Get policy tier for current days-until-departure
 *   2. Calculate policy fee
 *   3. Try live supplier API for actual fee
 *   4. Apply max(supplierFee, policyFee) as the final fee
 *
 * Returns a fully resolved CancellationBreakdown.
 */
export async function calculateCancellationFees(
  bookingId: string,
  agencyId: string
): Promise<CancellationBreakdown> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, agencyId },
    include: {
      supplierBookings: true,
    },
  })

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found for agency ${agencyId}`)
  }

  if (booking.status === "CANCELLED") {
    throw new Error("Booking is already cancelled")
  }

  // Days until departure (0 = today, negative = already departed)
  const departureMs = booking.departureDate
    ? booking.departureDate.getTime()
    : Date.now() + 1 // treat "no date" as tomorrow
  const daysUntilDeparture = Math.floor((departureMs - Date.now()) / MS_PER_DAY)

  const policies = await getAgencyPolicies(agencyId)

  const components: ComponentCancellationFee[] = []
  const warnings: string[] = []
  let hasLiveSupplierData = false

  for (const sb of booking.supplierBookings) {
    const componentType = sb.componentType
    const policy = policies.get(componentType)
    const tier = getApplicablePolicyTier(policy, daysUntilDeparture)
    const { fee: policyFee, description: tierDesc } = calculatePolicyFee(tier, sb.cost)

    let supplierFee: number | null = null
    let supplierFeeSource: FeeSource = FeeSource.POLICY
    let appliedFeeSource: FeeSource = FeeSource.POLICY

    if (sb.reference) {
      try {
        const result = await getSupplierCancellationFee(componentType, sb.reference, sb.cost)
        if (result.source === "supplier") {
          supplierFee = result.fee
          supplierFeeSource = FeeSource.SUPPLIER
          hasLiveSupplierData = true
        } else {
          warnings.push(
            `${componentType} supplier fee unavailable: ${(result as { reason: string }).reason}`
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        warnings.push(`${componentType} supplier API error: ${msg} — using policy`)
      }
    } else {
      warnings.push(`No supplier reference for ${componentType} (id: ${sb.id}) — using policy`)
    }

    const appliedFee =
      supplierFee !== null ? Math.max(supplierFee, policyFee) : policyFee
    appliedFeeSource =
      supplierFee !== null && supplierFee >= policyFee ? FeeSource.SUPPLIER : FeeSource.POLICY

    components.push({
      supplierBookingId: sb.id,
      componentType,
      supplierReference: sb.reference,
      componentCost: sb.cost,
      currency: sb.currency,
      supplierFee,
      supplierFeeSource,
      policyFee,
      policyTierDescription: tierDesc,
      appliedFee,
      appliedFeeSource,
      isRefundable: appliedFee < sb.cost,
    })
  }

  const totalComponentFees = components.reduce((sum, c) => sum + c.appliedFee, 0)

  // Use the first available policy's service fee (most agencies have one per-booking)
  const firstPolicy = policies.values().next().value as AgencyPolicyDef | undefined
  const agencyServiceFee = firstPolicy?.cancellationServiceFee ?? 0

  const totalFees = totalComponentFees + agencyServiceFee
  const estimatedRefund = Math.max(0, booking.paidAmount - totalFees)

  return {
    bookingId,
    agencyId,
    daysUntilDeparture,
    components,
    totalComponentFees,
    agencyServiceFee,
    totalFees,
    totalPaid: booking.paidAmount,
    estimatedRefund,
    currency: booking.currency,
    calculatedAt: new Date().toISOString(),
    hasLiveSupplierData,
    warnings,
  }
}
