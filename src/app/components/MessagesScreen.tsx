import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, RefreshCw, Send } from "lucide-react";

interface ChatPartner {
  id: string;
  username: string;
  rating: number;
}

interface ChatItem {
  id: string;
  title: string;
  estimated_value: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  partner: ChatPartner;
  item: ChatItem;
  last_message: ChatMessage | null;
  unread: number;
  online: boolean;
  updated_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

// Usuario temporal mientras no existe login real en la app.
const CURRENT_USER = { id: "demo-user", name: "Tu" };

const AVATARS: Record<string, string> = {
  "marcus-user": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
};

const ITEM_IMAGES: Record<string, string> = {
  "demo-leica-m6": "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=100&h=100&fit=crop",
};

function getAvatar(partner: ChatPartner) {
  return AVATARS[partner.id] ?? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face";
}

function getItemImage(item: ChatItem) {
  return ITEM_IMAGES[item.id] ?? "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&h=100&fit=crop";
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Si openConv es null mostramos la bandeja; si tiene valor mostramos ese chat abierto.
  const [openConv, setOpenConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      try {
        setError("");
        setIsLoading(true);

        // Carga desde FastAPI la lista de conversaciones del usuario actual.
        const response = await fetch(`${API_BASE}/chat/conversations/?user_id=${CURRENT_USER.id}`);
        if (!response.ok) throw new Error("No se pudieron cargar las conversaciones.");
        const data = (await response.json()) as Conversation[];
        if (active) setConversations(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadConversations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!openConv) return;

    let active = true;

    async function loadMessages() {
      try {
        setError("");

        // Carga el historial guardado en SQLite para la conversacion abierta.
        const response = await fetch(`${API_BASE}/chat/conversations/${openConv.id}/messages`);
        if (!response.ok) throw new Error("No se pudo cargar el historial.");
        const data = (await response.json()) as ChatMessage[];
        if (active) setMessages(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el historial.");
      }
    }

    loadMessages();

    // Abre la conexion en vivo; queda escuchando mensajes nuevos sin recargar la pagina.
    const socket = new WebSocket(`${WS_BASE}/ws/chat/${openConv.id}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== "message") return;

      const nextMessage = payload.message as ChatMessage;

      // Cuando FastAPI retransmite un mensaje, lo agregamos al estado para pintarlo.
      setMessages((current) => {
        if (current.some((message) => message.id === nextMessage.id)) return current;
        return [...current, nextMessage];
      });

      // Tambien actualizamos el preview de la bandeja con el ultimo mensaje.
      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === nextMessage.conversation_id
              ? { ...conversation, last_message: nextMessage, updated_at: nextMessage.created_at }
              : conversation
          )
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    };

    socket.onerror = () => {
      setError("El chat en vivo no esta disponible. Revisa que FastAPI este corriendo.");
    };

    return () => {
      active = false;
      socket.close();
      socketRef.current = null;
    };
  }, [openConv]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !openConv) return;

    const payload = {
      sender_id: CURRENT_USER.id,
      sender_name: CURRENT_USER.name,
      content,
    };

    setDraft("");

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      // Camino principal: enviar el mensaje por WebSocket para que llegue en vivo.
      socketRef.current.send(JSON.stringify(payload));
      return;
    }

    // Respaldo: si el WebSocket no esta abierto, se guarda por HTTP normal.
    const response = await fetch(`${API_BASE}/chat/conversations/${openConv.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const savedMessage = (await response.json()) as ChatMessage;
      setMessages((current) => [...current, savedMessage]);
    }
  }

  if (openConv) {
    const avatar = getAvatar(openConv.partner);
    const itemImage = getItemImage(openConv.item);

    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
        <div
          className="shrink-0 flex items-center gap-3 px-4 pt-12 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setOpenConv(null)}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#1A2230" }}
          >
            <ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
          </button>
          <div className="relative shrink-0">
            <img src={avatar} alt={openConv.partner.username} className="w-10 h-10 rounded-full object-cover" />
            {openConv.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background" style={{ background: "#06D6A0" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "#EEF2F7" }}>{openConv.partner.username}</p>
            <p className="text-xs" style={{ color: "#7A8A9A" }}>{openConv.online ? "En linea ahora" : "Chat del trueque"}</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0"
            style={{ background: "#1A2230" }}
          >
            <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
              <img src={itemImage} alt={openConv.item.title} className="w-full h-full object-cover" />
            </div>
            <RefreshCw size={10} style={{ color: "#00CDB8" }} />
          </div>
        </div>

        <div
          className="mx-4 mt-3 p-3 rounded-2xl flex items-center gap-3 shrink-0"
          style={{ background: "rgba(0,205,184,0.06)", border: "1px solid rgba(0,205,184,0.12)" }}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src={itemImage} alt={openConv.item.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#EEF2F7" }}>{openConv.item.title}</p>
            <p className="text-xs" style={{ color: "#00CDB8" }}>Trueque en progreso</p>
          </div>
          <span className="text-xs font-semibold shrink-0" style={{ color: "#00CDB8" }}>${openConv.item.estimated_value}</span>
        </div>

        {error && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(255,107,107,0.12)", color: "#FFB4B4" }}>
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.map((message) => {
            const isMe = message.sender_id === CURRENT_USER.id;
            return (
              <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover mr-2 self-end shrink-0" />
                )}
                <div className="max-w-[72%]">
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: isMe ? "linear-gradient(135deg, #00CDB8, #00A896)" : "#1A2230",
                      color: isMe ? "#080C12" : "#EEF2F7",
                      borderBottomRightRadius: isMe ? 4 : undefined,
                      borderBottomLeftRadius: !isMe ? 4 : undefined,
                    }}
                  >
                    {message.content}
                  </div>
                  <p className="text-[10px] mt-1 px-1" style={{ color: "#7A8A9A", textAlign: isMe ? "right" : "left" }}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="shrink-0 px-4 pb-8 pt-3 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "#1A2230" }}
          >
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#EEF2F7" }}
            />
          </div>
          <button
            type="submit"
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{
              background: draft ? "linear-gradient(135deg, #00CDB8, #00A896)" : "#1A2230",
            }}
          >
            <Send size={16} style={{ color: draft ? "#080C12" : "#7A8A9A" }} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
      <div className="px-5 pt-12 pb-5 shrink-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Bandeja</p>
            <h1 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Mensajes</h1>
          </div>
          {conversations.some((conversation) => conversation.unread > 0) && (
            <div
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(0,205,184,0.15)", color: "#00CDB8" }}
            >
              {conversations.reduce((total, conversation) => total + conversation.unread, 0)} nuevos
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: "#7A8A9A" }}>
            <MessageCircle size={28} />
            <p className="text-sm">Cargando mensajes...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(255,107,107,0.12)", color: "#FFB4B4" }}>
            {error}
          </div>
        )}

        {!isLoading && !error && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: "#7A8A9A" }}>
            <MessageCircle size={28} />
            <p className="text-sm">No hay conversaciones.</p>
          </div>
        )}

        {conversations.map((conversation) => {
          const avatar = getAvatar(conversation.partner);
          const itemImage = getItemImage(conversation.item);

          return (
            <button
              key={conversation.id}
              onClick={() => setOpenConv(conversation)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{ background: "#111820" }}
            >
              <div className="relative shrink-0">
                <img src={avatar} alt={conversation.partner.username} className="w-12 h-12 rounded-full object-cover" />
                {conversation.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card" style={{ background: "#06D6A0" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold" style={{ color: "#EEF2F7" }}>{conversation.partner.username}</span>
                  <span className="text-xs shrink-0 ml-2" style={{ color: "#7A8A9A" }}>{formatConversationTime(conversation.updated_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm truncate" style={{ color: conversation.unread > 0 ? "#EEF2F7" : "#7A8A9A", fontWeight: conversation.unread > 0 ? 500 : 400 }}>
                    {conversation.last_message?.content ?? "Inicia la conversacion"}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#00CDB8", color: "#080C12" }}>
                      {conversation.unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                    <img src={itemImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] truncate" style={{ color: "#7A8A9A" }}>{conversation.item.title}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
