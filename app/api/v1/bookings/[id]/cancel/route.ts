import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { executeCancellation } from "@/lib/policies/cancellation"

const schema = z.object({
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
    const result = await executeCancellation(id, agencyId, userId, parsed.data.notes)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancellation failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
