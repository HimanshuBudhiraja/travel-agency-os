import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { ComponentType } from "@prisma/client"
import { handleScheduleChangeWebhook, processClientDecision } from "@/lib/policies/schedule-change"

const notifySchema = z.object({
  action: z.literal("notify"),
  componentType: z.nativeEnum(ComponentType),
  supplierReference: z.string(),
  originalDepartureAt: z.string(),
  newDepartureAt: z.string(),
  originalArrivalAt: z.string().optional(),
  newArrivalAt: z.string().optional(),
  originalSegmentData: z.unknown().optional(),
  newSegmentData: z.unknown().optional(),
  rawWebhook: z.unknown().optional(),
})

const decisionSchema = z.object({
  action: z.literal("decision"),
  scheduleChangeId: z.string(),
  decision: z.enum(["accept", "rebook", "cancel"]),
})

const schema = z.discriminatedUnion("action", [notifySchema, decisionSchema])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  const agencyId = (sessionClaims?.metadata as Record<string, unknown>)?.agencyId as
    | string
    | undefined
  const userId = sessionClaims?.sub as string | undefined
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: bookingId } = await params
  void bookingId // used implicitly via supplierReference lookup

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    if (parsed.data.action === "notify") {
      const scheduleChange = await handleScheduleChangeWebhook(
        {
          supplierReference: parsed.data.supplierReference,
          componentType: parsed.data.componentType,
          originalDepartureAt: parsed.data.originalDepartureAt,
          newDepartureAt: parsed.data.newDepartureAt,
          originalArrivalAt: parsed.data.originalArrivalAt,
          newArrivalAt: parsed.data.newArrivalAt,
          originalSegmentData: parsed.data.originalSegmentData,
          newSegmentData: parsed.data.newSegmentData,
          rawWebhook: parsed.data.rawWebhook,
        },
        agencyId
      )
      return NextResponse.json({ scheduleChange })
    }

    // action === "decision"
    const result = await processClientDecision(
      parsed.data.scheduleChangeId,
      agencyId,
      parsed.data.decision,
      userId ?? "system"
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Schedule change handling failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
