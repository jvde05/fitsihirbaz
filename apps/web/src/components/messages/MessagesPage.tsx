"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Counterpart {
  id: string;
  firstName: string;
  lastName: string;
}

const POLL_INTERVAL_MS = 5000;

export function MessagesPage({ counterparts }: { counterparts: Counterpart[] }) {
  const utils = trpc.useUtils();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const conversationsQuery = trpc.messages.listConversations.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
  });
  const messagesQuery = trpc.messages.listMessages.useQuery(
    { conversationId: conversationId ?? "" },
    { enabled: !!conversationId, refetchInterval: POLL_INTERVAL_MS },
  );

  const startConversationMutation = trpc.messages.getOrCreateConversation.useMutation({
    onSuccess: (conversation) => {
      setConversationId(conversation.id);
      utils.messages.listConversations.invalidate();
    },
  });

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setDraft("");
      if (conversationId) {
        utils.messages.listMessages.invalidate({ conversationId });
      }
      utils.messages.listConversations.invalidate();
    },
  });

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!conversationId || !draft.trim()) return;
    sendMutation.mutate({ conversationId, content: draft.trim() });
  }

  const conversations = conversationsQuery.data ?? [];

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1 space-y-4">
        {counterparts.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Sohbet Başlat</p>
            <ul className="space-y-1">
              {counterparts.map((counterpart) => (
                <li key={counterpart.id}>
                  <button
                    type="button"
                    onClick={() => startConversationMutation.mutate({ counterpartId: counterpart.id })}
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                  >
                    {counterpart.firstName} {counterpart.lastName}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Sohbetler</p>
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setConversationId(conversation.id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    conversationId === conversation.id ? "bg-brand-50" : ""
                  }`}
                >
                  <span>
                    {conversation.counterpartFirstName} {conversation.counterpartLastName}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="col-span-2 flex h-[28rem] flex-col rounded-md border border-gray-200">
        {!conversationId ? (
          <p className="m-auto text-gray-400">Bir sohbet seçin veya yeni bir sohbet başlatın.</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messagesQuery.data?.map((message) => (
                <div key={message.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                  {message.content}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-3">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Mesaj yazın..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <button
                type="submit"
                disabled={sendMutation.isLoading}
                className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Gönder
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
