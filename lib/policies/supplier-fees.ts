// lib/policies/supplier-fees.ts
// Live supplier API adapters for cancellation and change fees

import type {
  SupplierFeeResult,
  DuffelOrderCancellation,
  DuffelOrderChangeQuote,
  RateHawkOrderInfoResponse,
} from "./types"
import { ComponentType } from "@prisma/client"

const DUFFEL_BASE = "https://api.duffel.com"
const RATEHAWK_BASE = "https://api.worldota.net/api/b2b/v3"

// ─── Duffel ───────────────────────────────────────────────────────────────────

/**
 * Create a pending Duffel order cancellation to obtain the refund amount.
 * Does NOT confirm — call confirmDuffelOrderCancellation() separately.
 * POST /air/order_cancellations  { data: { order_id } }
 */
export async function createDuffelOrderCancellation(
  orderId: string
): Promise<DuffelOrderCancellation> {
  const res = await fetch(`${DUFFEL_BASE}/air/order_cancellations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
    },
    body: JSON.stringify({ data: { order_id: orderId } }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Duffel create cancellation failed (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as DuffelOrderCancellation
}

/**
 * Confirm a pending Duffel order cancellation. This actually cancels the booking.
 * POST /air/order_cancellations/{id}/actions/confirm
 */
export async function confirmDuffelOrderCancellation(
  cancellationId: string
): Promise<DuffelOrderCancellation> {
  const res = await fetch(
    `${DUFFEL_BASE}/air/order_cancellations/${cancellationId}/actions/confirm`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
      },
      body: JSON.stringify({}),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Duffel confirm cancellation failed (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as DuffelOrderCancellation
}

/**
 * Create a Duffel order change request to obtain a change fee quote.
 * POST /air/order_change_requests
 */
export async function createDuffelOrderChangeRequest(
  orderId: string,
  slices: {
    add: Array<{
      origin: string
      destination: string
      departure_date: string
      cabin_class: string
    }>
    remove: Array<{ slice_id: string }>
  }
): Promise<DuffelOrderChangeQuote> {
  const res = await fetch(`${DUFFEL_BASE}/air/order_change_requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
    },
    body: JSON.stringify({
      data: {
        order_id: orderId,
        slices,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Duffel order change request failed (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as DuffelOrderChangeQuote
}

/**
 * Confirm a Duffel order change after the client accepts the quote.
 * POST /air/order_change_requests/{id}/actions/confirm
 */
export async function confirmDuffelOrderChange(
  changeRequestId: string
): Promise<{ id: string; order_id: string }> {
  const res = await fetch(
    `${DUFFEL_BASE}/air/order_change_requests/${changeRequestId}/actions/confirm`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
      },
      body: JSON.stringify({}),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Duffel confirm order change failed (${res.status}): ${text}`)
  }

  const json = await res.json()
  return { id: json.data.id, order_id: json.data.order_id }
}

// ─── RateHawk ─────────────────────────────────────────────────────────────────

function getRateHawkAuth(): string {
  return Buffer.from(
    `${process.env.RATEHAWK_KEY_ID}:${process.env.RATEHAWK_API_KEY}`
  ).toString("base64")
}

/**
 * Fetch live cancellation policy for a RateHawk hotel order.
 * Returns the penalty that applies right now, or 0 if free cancellation.
 * POST /api/b2b/v3/hotel/order/info/  { id: orderId }
 */
export async function getRateHawkCancellationFee(
  orderId: string,
  orderCost: number
): Promise<SupplierFeeResult> {
  if (!process.env.RATEHAWK_KEY_ID || !process.env.RATEHAWK_API_KEY) {
    return {
      source: "policy",
      fee: 0,
      currency: "USD",
      reason: "RateHawk credentials not configured",
    }
  }

  const res = await fetch(`${RATEHAWK_BASE}/hotel/order/info/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getRateHawkAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: orderId }),
  })

  if (!res.ok) {
    throw new Error(`RateHawk order info failed (${res.status}): ${await res.text()}`)
  }

  const json: RateHawkOrderInfoResponse = await res.json()

  if (json.status !== "ok" || !json.data) {
    throw new Error(`RateHawk order info error: ${json.error || "unknown"}`)
  }

  const policies = json.data.policies
  if (!policies) {
    // No cancellation policy data — fall back to policy
    return {
      source: "policy",
      fee: 0,
      currency: "USD",
      reason: "No cancellation policy returned by RateHawk",
    }
  }

  // Check if still within free cancellation window
  if (policies.free_cancellation_before) {
    const freeUntil = new Date(policies.free_cancellation_before)
    if (freeUntil > new Date()) {
      return { source: "supplier", fee: 0, currency: "USD", rawResponse: json }
    }
  }

  // Find the penalty bracket that applies now
  const now = new Date()
  const activePenalty = policies.penalties.find((p) => {
    const start = p.start_at ? new Date(p.start_at) : null
    const end = p.end_at ? new Date(p.end_at) : null
    const afterStart = start === null || now >= start
    const beforeEnd = end === null || now < end
    return afterStart && beforeEnd
  })

  if (!activePenalty) {
    return { source: "supplier", fee: 0, currency: "USD", rawResponse: json }
  }

  const fee = parseFloat(activePenalty.amount_charge)
  const currency = activePenalty.currency_code || "USD"

  return { source: "supplier", fee, currency, rawResponse: json }
}

/**
 * Cancel a hotel booking on RateHawk.
 * POST /api/b2b/v3/hotel/order/booking/cancel/  { order_id: orderId }
 */
export async function cancelRateHawkOrder(
  orderId: string
): Promise<{ success: boolean; rawResponse: unknown }> {
  if (!process.env.RATEHAWK_KEY_ID || !process.env.RATEHAWK_API_KEY) {
    throw new Error("RateHawk credentials not configured")
  }

  const res = await fetch(`${RATEHAWK_BASE}/hotel/order/booking/cancel/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getRateHawkAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order_id: orderId }),
  })

  const rawResponse = await res.json()

  if (!res.ok || rawResponse.status !== "ok") {
    throw new Error(
      `RateHawk cancel failed (${res.status}): ${rawResponse.error || JSON.stringify(rawResponse)}`
    )
  }

  return { success: true, rawResponse }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

/**
 * Route to the correct supplier adapter for cancellation fee.
 * For FLIGHT: creates a pending Duffel cancellation (stores id for later confirm).
 * For HOTEL: fetches RateHawk cancellation policy.
 * For TRANSFER/PACKAGE: always returns policy fallback.
 *
 * Returns { source, fee, currency } — the fee is what the supplier will charge.
 * The cancellationId (for Duffel) is embedded in rawResponse.id.
 */
export async function getSupplierCancellationFee(
  componentType: ComponentType,
  supplierReference: string,
  componentCost: number
): Promise<SupplierFeeResult> {
  if (!supplierReference) {
    return {
      source: "policy",
      fee: 0,
      currency: "USD",
      reason: "No supplier reference — using policy",
    }
  }

  switch (componentType) {
    case ComponentType.FLIGHT: {
      if (!process.env.DUFFEL_API_KEY) {
        return {
          source: "policy",
          fee: 0,
          currency: "USD",
          reason: "Duffel API key not configured",
        }
      }
      const cancellation = await createDuffelOrderCancellation(supplierReference)
      // Fee = original cost - refund amount
      const refund = parseFloat(cancellation.refund_amount)
      const fee = Math.max(0, componentCost - refund)
      return {
        source: "supplier",
        fee,
        currency: cancellation.refund_currency,
        rawResponse: cancellation,
      }
    }

    case ComponentType.HOTEL:
      return getRateHawkCancellationFee(supplierReference, componentCost)

    default:
      return {
        source: "policy",
        fee: 0,
        currency: "USD",
        reason: `No live cancellation API for ${componentType}`,
      }
  }
}

/**
 * Route to the correct supplier adapter for change/rebooking fee.
 * For FLIGHT: uses Duffel order change request (slices must be provided separately).
 * For HOTEL: fetches current cancellation fee (hotel rebooking = cancel + rebook).
 * For TRANSFER/PACKAGE: always returns policy fallback.
 */
export async function getSupplierChangeFee(
  componentType: ComponentType,
  supplierReference: string,
  componentCost: number
): Promise<SupplierFeeResult> {
  if (!supplierReference) {
    return {
      source: "policy",
      fee: 0,
      currency: "USD",
      reason: "No supplier reference — using policy",
    }
  }

  switch (componentType) {
    case ComponentType.FLIGHT: {
      // For a generic change fee preview, we create a placeholder change request.
      // The actual slices are determined during executeRebooking.
      // Return 0 as a signal that Duffel fee will be calculated at execute time.
      if (!process.env.DUFFEL_API_KEY) {
        return {
          source: "policy",
          fee: 0,
          currency: "USD",
          reason: "Duffel API key not configured",
        }
      }
      // We cannot call createDuffelOrderChangeRequest without knowing the new slices yet.
      // Return a policy-based estimate during preview; actual fee confirmed at execute time.
      return {
        source: "policy",
        fee: 0,
        currency: "USD",
        reason: "Flight change fee calculated at confirmation — using policy for preview",
      }
    }

    case ComponentType.HOTEL:
      // Hotels require cancel + rebook; the change fee = current cancellation fee
      return getRateHawkCancellationFee(supplierReference, componentCost)

    default:
      return {
        source: "policy",
        fee: 0,
        currency: "USD",
        reason: `No live change API for ${componentType}`,
      }
  }
}
