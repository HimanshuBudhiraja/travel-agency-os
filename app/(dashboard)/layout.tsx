export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const ownerNav = [
  { href: "/owner", label: "Overview", icon: "📊" },
  { href: "/owner/team", label: "Team", icon: "👥" },
  { href: "/owner/settings", label: "Settings", icon: "⚙️" },
  { href: "/owner/billing", label: "Billing", icon: "💳" },
];

const agentNav = [
  { href: "/agent", label: "My Leads", icon: "🎯" },
  { href: "/agent/inbox", label: "Inbox", icon: "💬" },
  { href: "/agent/quotes", label: "Quotes", icon: "✈️" },
  { href: "/agent/clients", label: "Clients", icon: "👤" },
];

const opsNav = [
  { href: "/ops", label: "Overview", icon: "📋" },
  { href: "/ops/bookings", label: "Bookings", icon: "🏨" },
  { href: "/ops/suppliers", label: "Suppliers", icon: "🤝" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = await auth();
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const role = (sessionClaims?.metadata as any)?.role as string | undefined;

  let navItems = agentNav;
  let roleLabel = "Agent";
  let roleBg = "bg-green-100 text-green-700";

  if (role === "OWNER") {
    navItems = [...ownerNav, ...agentNav, ...opsNav];
    roleLabel = "Owner";
    roleBg = "bg-blue-100 text-blue-700";
  } else if (role === "OPS") {
    navItems = [...opsNav, ...agentNav];
    roleLabel = "Operations";
    roleBg = "bg-purple-100 text-purple-700";
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="font-bold text-gray-900">TravelOS</span>
          </div>
          <div className={`mt-3 inline-flex text-xs px-2 py-1 rounded-full font-medium ${roleBg}`}>
            {roleLabel}
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {role === "OWNER" && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-3">
                Developer
              </p>
              <Link
                href="/owner/settings#api"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span>🔑</span>
                <span>API Keys</span>
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span>📖</span>
                <span>API Docs</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
