import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({
  agencyName: z.string().min(1),
  agencyWebsite: z.string().optional(),
  role: z.enum(["OWNER", "AGENT", "OPS"]),
  plan: z.string().default("agency"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { agencyName, agencyWebsite, role, plan } = parsed.data;

  // Create slug from agency name
  const slug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

  // Create agency
  const agency = await prisma.agency.create({
    data: {
      name: agencyName,
      slug,
      website: agencyWebsite || null,
      plan,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Get Clerk user email/name
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress || "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;

  // Create user record in DB
  const dbUser = await prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name,
      role,
      agencyId: agency.id,
    },
  });

  // Set Clerk metadata so middleware can read role + agencyId
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      role,
      agencyId: agency.id,
      dbUserId: dbUser.id,
    },
  });

  return NextResponse.json({ ok: true, agencyId: agency.id, role });
}
