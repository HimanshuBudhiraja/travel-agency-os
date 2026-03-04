import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { executeRebooking } from "@/lib/policies/rebooking"

const schema = z.object({
  selectedOptionId: z.string(),
  newDepartureDate: z.string().optional(),
  newReturnDate: z.string().optional(),
  newOrigin: z.string().optional(),
  newDestination: z.string().optional(),
  newCabinClass: z.string().optional(),
  newCheckIn: z.string().optional(),
  newCheckOut: z.string().optional(),
  newAdults: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  const agencyId = (sessionClaims?.metadata as Record<string, unknown>)?.agencyId as
    | string
    | undefined
  const userId = sessionClaims?.sub as string | undefined
  if (!agencyId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await executeRebooking({
      bookingId: id,
      agencyId,
      initiatedByUserId: userId,
      ...parsed.data,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rebooking failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
