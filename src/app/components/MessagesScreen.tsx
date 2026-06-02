import { useState } from "react";
import { Search, ArrowLeft, Send, RefreshCw } from "lucide-react";

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  itemImage: string;
  itemName: string;
  online: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Marcus J.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    lastMessage: "¡Hola! Llevo tiempo buscando esta cámara 📷",
    time: "Hace 2 min",
    unread: 2,
    itemImage: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=100&h=100&fit=crop",
    itemName: "Cámara Leica M6",
    online: true,
  },
  {
    id: 2,
    name: "Sara K.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    lastMessage: "Claro, puedo verte en la cafetería de Main St",
    time: "Hace 1 h",
    unread: 0,
    itemImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop",
    itemName: "Bose QC45",
    online: true,
  },
  {
    id: 3,
    name: "Tom R.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    lastMessage: "¡Trueque confirmado! ¿Cuándo te queda bien vernos?",
    time: "Hace 3 días",
    unread: 0,
    itemImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    itemName: "Bolso de piel",
    online: false,
  },
  {
    id: 4,
    name: "Ji-Ho L.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    lastMessage: "Paso esta vez, gracias de todos modos",
    time: "Hace 1 semana",
    unread: 0,
    itemImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100&h=100&fit=crop",
    itemName: "Teclado HHKB",
    online: false,
  },
];

const MESSAGES = [
  { id: 1, from: "them", text: "¡Hola! Llevo tiempo buscando esta cámara 📷", time: "2:14 p. m." },
  { id: 2, from: "them", text: "Mis dos artículos están en gran estado. ¡Creo que es un trueque justo!", time: "2:14 p. m." },
  { id: 3, from: "me", text: "Suena interesante. ¿Puedes compartir más fotos de la tornamesa?", time: "2:16 p. m." },
  { id: 4, from: "them", text: "¡Claro! Las acabo de subir a mi publicación. La tornamesa es de 1978 y recibió servicio completo el año pasado.", time: "2:18 p. m." },
  { id: 5, from: "me", text: "Está preciosa. ¿En qué estado está la aguja?", time: "2:20 p. m." },
  { id: 6, from: "them", text: "La cambié hace 6 meses, casi sin uso. Suena increíble.", time: "2:21 p. m." },
];

export default function MessagesScreen() {
  const [openConv, setOpenConv] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  const filtered = CONVERSATIONS.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.itemName.toLowerCase().includes(query.toLowerCase())
  );

  if (openConv) {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
        {/* Chat header */}
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
            <img src={openConv.avatar} alt={openConv.name} className="w-10 h-10 rounded-full object-cover" />
            {openConv.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background" style={{ background: "#06D6A0" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "#EEF2F7" }}>{openConv.name}</p>
            <p className="text-xs" style={{ color: "#7A8A9A" }}>{openConv.online ? "En línea ahora" : "Sin conexión"}</p>
          </div>
          {/* Swap reference pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0"
            style={{ background: "#1A2230" }}
          >
            <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
              <img src={openConv.itemImage} alt={openConv.itemName} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1">
              <RefreshCw size={10} style={{ color: "#00CDB8" }} />
            </div>
          </div>
        </div>

        {/* Swap context banner */}
        <div
          className="mx-4 mt-3 p-3 rounded-2xl flex items-center gap-3 shrink-0"
          style={{ background: "rgba(0,205,184,0.06)", border: "1px solid rgba(0,205,184,0.12)" }}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src={openConv.itemImage} alt={openConv.itemName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#EEF2F7" }}>{openConv.itemName}</p>
            <p className="text-xs" style={{ color: "#00CDB8" }}>Trueque en progreso · 2 artículos ofrecidos</p>
          </div>
          <button className="text-xs font-semibold shrink-0" style={{ color: "#00CDB8" }}>Ver</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {MESSAGES.map((msg) => {
            const isMe = msg.from === "me";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <img src={openConv.avatar} alt="" className="w-7 h-7 rounded-full object-cover mr-2 self-end shrink-0" />
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
                    {msg.text}
                  </div>
                  <p className="text-[10px] mt-1 px-1" style={{ color: "#7A8A9A", textAlign: isMe ? "right" : "left" }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div
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
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#EEF2F7" }}
            />
          </div>
          <button
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{
              background: draft ? "linear-gradient(135deg, #00CDB8, #00A896)" : "#1A2230",
            }}
          >
            <Send size={16} style={{ color: draft ? "#080C12" : "#7A8A9A" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5 shrink-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Bandeja</p>
            <h1 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Mensajes</h1>
          </div>
          {CONVERSATIONS.some((c) => c.unread > 0) && (
            <div
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(0,205,184,0.15)", color: "#00CDB8" }}
            >
              {CONVERSATIONS.reduce((a, c) => a + c.unread, 0)} nuevos
            </div>
          )}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "#111820" }}
        >
          <Search size={16} style={{ color: "#7A8A9A" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mensajes..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#EEF2F7" }}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setOpenConv(conv)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{ background: "#111820" }}
          >
            <div className="relative shrink-0">
              <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
              {conv.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card" style={{ background: "#06D6A0" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-bold" style={{ color: "#EEF2F7" }}>{conv.name}</span>
                <span className="text-xs shrink-0 ml-2" style={{ color: "#7A8A9A" }}>{conv.time}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm truncate" style={{ color: conv.unread > 0 ? "#EEF2F7" : "#7A8A9A", fontWeight: conv.unread > 0 ? 500 : 400 }}>
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#00CDB8", color: "#080C12" }}>
                    {conv.unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                  <img src={conv.itemImage} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] truncate" style={{ color: "#7A8A9A" }}>{conv.itemName}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
