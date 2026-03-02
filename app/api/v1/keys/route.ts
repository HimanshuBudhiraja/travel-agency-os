import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { createHash, randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  const role = (sessionClaims?.metadata as any)?.role as string | undefined;

  if (!agencyId || role !== "OWNER") {
    return NextResponse.json({ error: "Only agency owners can create API keys" }, { status: 403 });
  }

  const { name, isSandbox = false } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const rawKey = `tos_${isSandbox ? "test" : "live"}_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  await prisma.apiKey.create({
    data: {
      agencyId,
      name,
      keyHash,
      keyPreview: rawKey.slice(-4),
      isSandbox,
    },
  });

  return NextResponse.json({ key: rawKey, preview: rawKey.slice(-4) }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { agencyId },
    select: { id: true, name: true, keyPreview: true, isSandbox: true, isActive: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function DELETE(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  const role = (sessionClaims?.metadata as any)?.role as string | undefined;

  if (!agencyId || role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.apiKey.updateMany({ where: { id, agencyId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
