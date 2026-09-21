"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Megaphone, MessageSquare, Plus, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  sendBroadcastAction,
  sendDirectMessageAction,
  getConversationMessagesAction,
} from "@/lib/actions/messages";
import { ConversationSummary, Message, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function MessagesView({
  meId,
  isAdmin,
  broadcasts,
  conversations,
  contacts,
}: {
  meId: string;
  isAdmin: boolean;
  broadcasts: Message[];
  conversations: ConversationSummary[];
  contacts: Profile[];
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"broadcast" | "direct">("broadcast");
  const [activeConvo, setActiveConvo] = React.useState<string | null>(conversations[0]?.profile_id ?? null);
  const [thread, setThread] = React.useState<Message[]>([]);
  const [threadFor, setThreadFor] = React.useState<string | null>(null);
  const [broadcastText, setBroadcastText] = React.useState("");
  const [directText, setDirectText] = React.useState("");
  const [newContactId, setNewContactId] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const loadingThread = tab === "direct" && !!activeConvo && threadFor !== activeConvo;

  React.useEffect(() => {
    if (tab !== "direct" || !activeConvo) return;
    let ignore = false;
    getConversationMessagesAction(activeConvo).then((messages) => {
      if (!ignore) {
        setThread(messages);
        setThreadFor(activeConvo);
      }
    });
    return () => {
      ignore = true;
    };
  }, [tab, activeConvo]);

  /** Répondre à une annonce : ouvre la conversation directe avec l'expéditeur. */
  function replyTo(senderId: string) {
    setTab("direct");
    setActiveConvo(senderId);
    setNewContactId("");
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setPending(true);
    await sendBroadcastAction(broadcastText);
    setPending(false);
    setBroadcastText("");
    router.refresh();
  }

  async function handleSendDirect(e: React.FormEvent) {
    e.preventDefault();
    const recipientId = activeConvo || newContactId;
    if (!recipientId || !directText.trim()) return;
    setPending(true);
    await sendDirectMessageAction(recipientId, directText);
    const messages = await getConversationMessagesAction(recipientId);
    setPending(false);
    setDirectText("");
    setActiveConvo(recipientId);
    setNewContactId("");
    setThread(messages);
    setThreadFor(recipientId);
    router.refresh();
  }

  const activeName =
    contacts.find((c) => c.id === activeConvo)?.full_name ??
    conversations.find((c) => c.profile_id === activeConvo)?.full_name ??
    null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant={tab === "broadcast" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("broadcast")}
        >
          <Megaphone className="h-3.5 w-3.5" /> Annonces
        </Button>
        <Button type="button" variant={tab === "direct" ? "default" : "outline"} size="sm" onClick={() => setTab("direct")}>
          <MessageSquare className="h-3.5 w-3.5" /> Messages directs
        </Button>
      </div>

      {tab === "broadcast" && (
        <div className="flex-1 flex flex-col min-h-0">
          {isAdmin && (
            <form onSubmit={handleBroadcast} className="flex gap-2 mb-4">
              <Textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Annoncer quelque chose à tous les employés..."
                rows={2}
                className="flex-1"
              />
              <Button type="submit" disabled={pending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
          <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            {broadcasts.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Aucune annonce.</p>}
            {broadcasts.map((m) => (
              <div key={m.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{m.sender_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{fmtTime(m.created_at)}</span>
                    {m.sender_id !== meId && (
                      <button
                        type="button"
                        onClick={() => replyTo(m.sender_id)}
                        title={`Répondre à ${m.sender_name}`}
                        className="inline-flex items-center gap-1 text-xs text-[#736d6c] hover:underline"
                      >
                        <Reply className="h-3.5 w-3.5" /> Répondre
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line mt-0.5">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "direct" && (
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="w-56 shrink-0 rounded-xl border border-slate-200 bg-white overflow-y-auto">
            <div className="p-2 border-b border-slate-100">
              <Select
                value=""
                onChange={(e) => {
                  setActiveConvo(e.target.value);
                  setNewContactId(e.target.value);
                }}
              >
                <option value="">
                  + Nouveau message
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </Select>
            </div>
            {conversations.map((c) => (
              <button
                key={c.profile_id}
                type="button"
                onClick={() => setActiveConvo(c.profile_id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors",
                  activeConvo === c.profile_id && "bg-slate-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.full_name}</p>
                  {c.unread > 0 && <Badge className="bg-red-100 text-red-700">{c.unread}</Badge>}
                </div>
                <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-slate-200 bg-white">
            {activeConvo ? (
              <>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{activeName ?? "Conversation"}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loadingThread && <p className="text-sm text-slate-400 text-center">Chargement...</p>}
                  {!loadingThread && thread.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-8">Aucun message. Démarrez la conversation.</p>
                  )}
                  {thread.map((m) => (
                    <div key={m.id} className={cn("max-w-[75%] rounded-lg px-3 py-2", m.sender_id === activeConvo ? "bg-slate-100" : "bg-[#f1eeed] ml-auto")}>
                      <p className="text-sm text-slate-800 whitespace-pre-line">{m.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{fmtTime(m.created_at)}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendDirect} className="flex items-center gap-2 p-3 border-t border-slate-100">
                  <Textarea
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    placeholder="Écrire un message..."
                    rows={1}
                    className="flex-1 min-h-0"
                  />
                  <Button type="submit" size="icon" disabled={pending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                <Plus className="h-4 w-4 mr-1.5" /> Sélectionnez ou démarrez une conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
