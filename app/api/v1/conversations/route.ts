import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/v1/conversations — list conversations for the agency
export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

  if (!agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isOpen = searchParams.get("isOpen");
  const channel = searchParams.get("channel");

  const conversations = await prisma.conversation.findMany({
    where: {
      agencyId,
      ...(isOpen !== null ? { isOpen: isOpen === "true" } : {}),
      ...(channel ? { channel: channel as any } : {}),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          whatsapp: true,
          avatarUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          direction: true,
          isAiGenerated: true,
          createdAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ conversations });
}
