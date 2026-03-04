import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { previewCancellation } from "@/lib/policies/cancellation"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  const agencyId = (sessionClaims?.metadata as Record<string, unknown>)?.agencyId as
    | string
    | undefined
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const breakdown = await previewCancellation(id, agencyId)
    return NextResponse.json({ breakdown })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to calculate cancellation fees"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
