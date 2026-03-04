import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { previewRebooking } from "@/lib/policies/rebooking"

const schema = z.object({
  newDepartureDate: z.string().optional(),
  newReturnDate: z.string().optional(),
  newOrigin: z.string().optional(),
  newDestination: z.string().optional(),
  newCabinClass: z.string().optional(),
  newCheckIn: z.string().optional(),
  newCheckOut: z.string().optional(),
  newAdults: z.number().int().positive().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  const agencyId = (sessionClaims?.metadata as Record<string, unknown>)?.agencyId as
    | string
    | undefined
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const breakdown = await previewRebooking({ bookingId: id, agencyId, ...parsed.data })
    return NextResponse.json({ breakdown })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rebooking preview failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
