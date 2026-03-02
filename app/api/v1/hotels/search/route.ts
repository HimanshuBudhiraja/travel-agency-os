import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/suppliers/ratehawk";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({
  destination: z.string(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(20),
  children: z.array(z.number()).optional(),
  currency: z.string().length(3).optional(),
});

export async function POST(req: NextRequest) {
  // Support both internal (Clerk session) and external (API key) auth
  const apiKey = req.headers.get("x-api-key");

  if (apiKey) {
    const { createHash } = await import("crypto");
    const keyHash = createHash("sha256").update(apiKey).digest("hex");
    const storedKey = await prisma.apiKey.findFirst({ where: { keyHash, isActive: true } });
    if (!storedKey) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    await prisma.apiKey.update({ where: { id: storedKey.id }, data: { lastUsedAt: new Date() } });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hotels = await searchHotels(parsed.data);

  return NextResponse.json({
    results: hotels,
    count: hotels.length,
    source: process.env.RATEHAWK_API_KEY ? "live" : "mock",
  });
}
