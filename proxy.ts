import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/docs",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/proposal/(.*)",
  "/api/webhooks/(.*)",
  "/api/v1/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const role = (sessionClaims?.metadata as any)?.role as string | undefined;
  const path = req.nextUrl.pathname;

  // Role-based routing: redirect /dashboard to the correct role path
  if (path === "/dashboard" || path === "/dashboard/") {
    if (role === "OWNER") return NextResponse.redirect(new URL("/owner", req.url));
    if (role === "AGENT") return NextResponse.redirect(new URL("/agent", req.url));
    if (role === "OPS") return NextResponse.redirect(new URL("/ops", req.url));
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Protect role routes
  if (path.startsWith("/owner") && role !== "OWNER") {
    return NextResponse.redirect(new URL("/agent", req.url));
  }
  if (path.startsWith("/ops") && role !== "OPS" && role !== "OWNER") {
    return NextResponse.redirect(new URL("/agent", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
