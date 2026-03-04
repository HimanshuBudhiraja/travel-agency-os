// lib/policies/types.ts
// All TypeScript interfaces for the policy engine

import type { ComponentType, FeeSource, ScheduleChangeClassification } from "@prisma/client"

// ─── Policy Definition Types ──────────────────────────────────────────────────

export interface PolicyTierDef {
  id: string
  daysBeforeMin: number
  daysBeforeMax: number | null
  /** "percentage" | "flat" | "nights" | "free" */
  feeType: string
  /** % of cost, flat amount, or # nights */
  feeValue: number
  description: string | null
  sortOrder: number
}

export interface AgencyPolicyDef {
  id: string
  agencyId: string
  componentType: ComponentType
  name: string
  isDefault: boolean
  tiers: PolicyTierDef[]
  cancellationServiceFee: number
  rebookingServiceFee: number
  scheduleChangeServiceFee: number
}

// ─── Cancellation Types ───────────────────────────────────────────────────────

export interface ComponentCancellationFee {
  supplierBookingId: string
  componentType: ComponentType
  supplierReference: string | null
  componentCost: number
  currency: string
  /** Fee returned by the supplier live API, null if unavailable */
  supplierFee: number | null
  supplierFeeSource: FeeSource
  /** Fee calculated from the agency policy tiers */
  policyFee: number
  policyTierDescription: string
  /** max(supplierFee ?? 0, policyFee) */
  appliedFee: number
  appliedFeeSource: FeeSource
  isRefundable: boolean
}

export interface CancellationBreakdown {
  bookingId: string
  agencyId: string
  daysUntilDeparture: number
  components: ComponentCancellationFee[]
  totalComponentFees: number
  agencyServiceFee: number
  totalFees: number
  totalPaid: number
  estimatedRefund: number
  currency: string
  calculatedAt: string
  hasLiveSupplierData: boolean
  warnings: string[]
}

// ─── Rebooking Types ──────────────────────────────────────────────────────────

export interface ComponentRebookingFee {
  supplierBookingId: string
  componentType: ComponentType
  supplierReference: string | null
  originalCost: number
  newCost: number
  /** newCost - originalCost; negative means credit */
  fareDifference: number
  supplierChangeFee: number | null
  supplierChangeFeeSource: FeeSource
  policyChangeFee: number
  appliedChangeFee: number
  appliedChangeFeeSource: FeeSource
  currency: string
}

export interface RebookingOption {
  optionId: string
  componentType: ComponentType
  supplierRef: string
  description: string
  newDepartureAt?: string
  newArrivalAt?: string
  newCheckIn?: string
  newCheckOut?: string
  newCost: number
  currency: string
}

export interface RebookingBreakdown {
  bookingId: string
  agencyId: string
  components: ComponentRebookingFee[]
  newOptions: RebookingOption[]
  totalChangeFees: number
  totalFareDifference: number
  agencyRebookingServiceFee: number
  /** changeFees + fareDifference + agencyFee (can be negative = refund) */
  totalAdditionalCost: number
  currency: string
  calculatedAt: string
  hasLiveSupplierData: boolean
  warnings: string[]
}

export interface RebookingPreviewRequest {
  bookingId: string
  agencyId: string
  newDepartureDate?: string
  newReturnDate?: string
  newOrigin?: string
  newDestination?: string
  newCabinClass?: string
  newCheckIn?: string
  newCheckOut?: string
  newAdults?: number
}

export interface RebookingConfirmRequest {
  bookingId: string
  agencyId: string
  selectedOptionId: string
  initiatedByUserId: string
  notes?: string
}

// ─── Schedule Change Types ────────────────────────────────────────────────────

export interface ScheduleChangeOption {
  optionType: "accept" | "rebook" | "cancel"
  label: string
  description: string
  estimatedCost: number
  currency: string
}

export interface ScheduleChangeClassificationResult {
  shiftMinutes: number
  classification: ScheduleChangeClassification
  isDateChange: boolean
  optionsToOffer: ScheduleChangeOption[]
}

export interface ScheduleChangeWebhookPayload {
  supplierReference: string
  componentType: ComponentType
  originalDepartureAt: string
  newDepartureAt: string
  originalArrivalAt?: string
  newArrivalAt?: string
  originalSegmentData?: unknown
  newSegmentData?: unknown
  rawWebhook?: unknown
}

// ─── Supplier API Response Types ──────────────────────────────────────────────

export type SupplierFeeResult =
  | { source: "supplier"; fee: number; currency: string; rawResponse: unknown }
  | { source: "policy"; fee: number; currency: string; reason: string }

export interface DuffelOrderCancellation {
  id: string
  live_mode: boolean
  refund_amount: string
  refund_currency: string
  refund_to: string
  created_at: string
  confirmed_at: string | null
  expires_at: string
}

export interface DuffelOrderChangeQuote {
  id: string
  live_mode: boolean
  penalty_total_amount: string
  penalty_total_currency: string
  new_total_amount: string
  new_total_currency: string
  slices: {
    add: unknown[]
    remove: unknown[]
  }
  created_at: string
  expires_at: string
  updated_at: string
}

export interface RateHawkOrderInfoResponse {
  status: string
  data?: {
    order_id: string
    room_data_trans?: unknown
    policies?: {
      free_cancellation_before: string | null
      penalties: Array<{
        start_at: string | null
        end_at: string | null
        amount_charge: string
        amount_show: string
        currency_code: string
      }>
    }
  }
  error?: string
}
