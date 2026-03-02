import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  country: z.string().optional(),
  travelStyle: z.enum(["luxury", "adventure", "family", "budget", "business"]).optional(),
  budgetRange: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const clients = await prisma.client.findMany({
    where: {
      agencyId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { lifetimeValue: "desc" },
    take: 100,
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Deduplicate by email or phone
  if (parsed.data.email) {
    const existing = await prisma.client.findFirst({ where: { agencyId, email: parsed.data.email } });
    if (existing) return NextResponse.json({ client: existing, duplicate: true });
  }

  const client = await prisma.client.create({ data: { agencyId, ...parsed.data } });
  return NextResponse.json({ client }, { status: 201 });
}
