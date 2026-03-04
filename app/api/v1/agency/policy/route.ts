import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { ComponentType } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"

const tierSchema = z.object({
  daysBeforeMin: z.number().int().min(0),
  daysBeforeMax: z.number().int().min(0).nullable().optional(),
  feeType: z.enum(["free", "percentage", "flat", "nights"]),
  feeValue: z.number().min(0),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

const policySchema = z.object({
  componentType: z.nativeEnum(ComponentType),
  name: z.string().min(1),
  isDefault: z.boolean().optional(),
  tiers: z.array(tierSchema),
  cancellationServiceFee: z.number().min(0).optional(),
  rebookingServiceFee: z.number().min(0).optional(),
  scheduleChangeServiceFee: z.number().min(0).optional(),
})

// GET — list all agency policies
export async function GET(_req: NextRequest) {
  const { sessionClaims } = await auth()
  const agencyId = (sessionClaims?.metadata as Record<string, unknown>)?.agencyId as
    | string
    | undefined
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const policies = await prisma.agencyPolicy.findMany({
    where: { agencyId },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { componentType: "asc" },
  })

  return NextResponse.json({ policies })
}

// PUT — upsert a policy with its tiers (OWNER only)
export async function PUT(req: NextRequest) {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.metadata as Record<string, unknown> | undefined
  const agencyId = meta?.agencyId as string | undefined
  const role = meta?.role as string | undefined

  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (role !== "OWNER") {
    return NextResponse.json({ error: "Only OWNER can manage policies" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = policySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const {
    componentType,
    name,
    isDefault = true,
    tiers,
    cancellationServiceFee = 0,
    rebookingServiceFee = 0,
    scheduleChangeServiceFee = 0,
  } = parsed.data

  // Find existing policy for this component type
  const existing = await prisma.agencyPolicy.findFirst({
    where: { agencyId, componentType, isDefault: true },
  })

  const policy = await prisma.$transaction(async (tx) => {
    let p
    if (existing) {
      // Delete existing tiers and recreate
      await tx.policyTier.deleteMany({ where: { agencyPolicyId: existing.id } })
      p = await tx.agencyPolicy.update({
        where: { id: existing.id },
        data: {
          name,
          isDefault,
          cancellationServiceFee,
          rebookingServiceFee,
          scheduleChangeServiceFee,
          tiers: {
            create: tiers.map((t, i) => ({
              daysBeforeMin: t.daysBeforeMin,
              daysBeforeMax: t.daysBeforeMax ?? null,
              feeType: t.feeType,
              feeValue: t.feeValue,
              description: t.description ?? null,
              sortOrder: t.sortOrder ?? i,
            })),
          },
        },
        include: { tiers: { orderBy: { sortOrder: "asc" } } },
      })
    } else {
      p = await tx.agencyPolicy.create({
        data: {
          agencyId,
          componentType,
          name,
          isDefault,
          cancellationServiceFee,
          rebookingServiceFee,
          scheduleChangeServiceFee,
          tiers: {
            create: tiers.map((t, i) => ({
              daysBeforeMin: t.daysBeforeMin,
              daysBeforeMax: t.daysBeforeMax ?? null,
              feeType: t.feeType,
              feeValue: t.feeValue,
              description: t.description ?? null,
              sortOrder: t.sortOrder ?? i,
            })),
          },
        },
        include: { tiers: { orderBy: { sortOrder: "asc" } } },
      })
    }
    return p
  })

  return NextResponse.json({ policy })
}
