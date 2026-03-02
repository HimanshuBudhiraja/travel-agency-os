import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

const channelIcon: Record<string, string> = {
  WHATSAPP: "💬",
  EMAIL: "📧",
  WEB_CHAT: "🌐",
  SMS: "📱",
};

const sentimentColor: Record<string, string> = {
  positive: "text-green-600",
  neutral: "text-gray-400",
  negative: "text-red-500",
  urgent: "text-orange-500",
};

export default async function InboxPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const conversations = agencyId
    ? await prisma.conversation.findMany({
        where: { agencyId, isOpen: true },
        include: {
          client: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="w-80 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Inbox</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              {conversations.length} open
            </span>
          </div>
          <input
            placeholder="Search conversations..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm font-medium text-gray-900 mb-1">Inbox is empty</p>
              <p className="text-xs text-gray-400">
                Conversations from WhatsApp, email, and web chat will appear here
              </p>
            </div>
          ) : (
            conversations.map((conv: any) => {
              const lastMsg = conv.messages[0];
              return (
                <div
                  key={conv.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      {conv.client?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {conv.client?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {channelIcon[conv.channel]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {lastMsg?.content || "No messages"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.intentSentiment && (
                          <span className={`text-xs ${sentimentColor[conv.intentSentiment] || ""}`}>
                            ● {conv.intentSentiment}
                          </span>
                        )}
                        {conv.isAiManaged && (
                          <span className="text-xs text-blue-500">AI</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Empty state for conversation detail */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-5xl mb-4">💬</p>
          <p className="text-lg font-medium text-gray-900 mb-2">Select a conversation</p>
          <p className="text-sm text-gray-500">
            AI is actively monitoring and responding to open threads
          </p>
        </div>
      </div>
    </div>
  );
}
