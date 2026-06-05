import { useEffect, useMemo, useState } from "react";
import { Search, ArrowLeft, Send, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { api, MessageResponseData, SwapResponseData } from "../../services/endpoints";
import { WS_BASE_URL } from "../../services/api_client";
import { useApi } from "../../hooks/use_api";
import { useAuth } from "../../context/AuthContext";

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

function offeredLabel(swap: SwapResponseData) {
  if (!swap.offered_items.length) return "Aun no hay oferta seleccionada";
  if (swap.offered_items.length === 1) return swap.offered_items[0].title;
  return `${swap.offered_items.length} artículos ofrecidos`;
}

function statusLabel(status: SwapResponseData["status"]) {
  const labels: Record<SwapResponseData["status"], string> = {
    pending: "Pendiente",
    awaiting: "Esperando respuesta",
    accepted: "Aceptado",
    countered: "Contraoferta",
    completed: "Completado",
    declined: "Rechazado",
  };
  return labels[status] || status;
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    awaiting: "Esperando respuesta",
    accepted: "Aceptado",
    countered: "Contraoferta",
    completed: "Completado",
    declined: "Rechazado",
  };
  return labels[status] || status.replace("-", " ");
}

export default function MessagesScreen() {
  const [openSwap, setOpenSwap] = useState<SwapResponseData | null>(null);
  const [showSwapDetails, setShowSwapDetails] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const { execute, isLoading, data: swaps, error } = useApi<SwapResponseData[]>();
  const { execute: loadMessages, data: messages } = useApi<MessageResponseData[]>();
  const { execute: sendMessage, isLoading: isSending } = useApi<MessageResponseData>();

  const fetchSwaps = useMemo(() => {
    return () => {
      if (user?.id) execute(() => api.getSwaps(user.id));
    };
  }, [execute, user?.id]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = new WebSocket(`${WS_BASE_URL}/swaps/ws/${user.id}`);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      fetchSwaps();
      if (payload.swap_id && payload.swap_id === openSwap?.id) {
        loadMessages(() => api.getSwapMessages(payload.swap_id));
      }
    };
    return () => socket.close();
  }, [fetchSwaps, loadMessages, openSwap?.id, user?.id]);

  useEffect(() => {
    if (openSwap?.id) loadMessages(() => api.getSwapMessages(openSwap.id));
  }, [loadMessages, openSwap?.id]);

  const conversations = useMemo(() => {
    return (swaps || []).filter((swap) => {
      const target = `${swap.partner.username} ${swap.wanted_item.title} ${offeredLabel(swap)}`.toLowerCase();
      return target.includes(query.toLowerCase());
    });
  }, [query, swaps]);

  async function handleSend() {
    if (!openSwap || !user || !draft.trim() || isSending) return;
    const body = draft;
    setDraft("");
    await sendMessage(() => api.sendSwapMessage(openSwap.id, user.id, body));
    loadMessages(() => api.getSwapMessages(openSwap.id));
    fetchSwaps();
  }

  if (!user) return null;

  if (openSwap) {
    const itemImage = openSwap.wanted_item.image_url || openSwap.offered_items[0]?.image_url || "";
    const itemName = openSwap.wanted_item.title;
    const offeredTotal = openSwap.offered_items.reduce((sum, item) => sum + item.estimated_value, 0);
    const valueDiff = offeredTotal - openSwap.wanted_item.estimated_value;

    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
        <div className="shrink-0 flex items-center gap-3 px-4 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => { setOpenSwap(null); setShowSwapDetails(false); }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A2230" }}>
            <ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold" style={{ background: "#1A2230", color: "#00CDB8" }}>
            {openSwap.partner.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: "#EEF2F7" }}>{openSwap.partner.username}</p>
            <p className="text-xs" style={{ color: "#7A8A9A" }}>{statusLabel(openSwap.status)}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0" style={{ background: "#1A2230" }}>
            <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
              {itemImage && <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />}
            </div>
            <RefreshCw size={10} style={{ color: "#00CDB8" }} />
          </div>
        </div>

        <div className="mx-4 mt-3 p-3 rounded-2xl flex items-center gap-3 shrink-0" style={{ background: "rgba(0,205,184,0.06)", border: "1px solid rgba(0,205,184,0.12)" }}>
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            {itemImage && <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "#EEF2F7" }}>{itemName}</p>
            <p className="text-xs truncate" style={{ color: "#00CDB8" }}>{offeredLabel(openSwap)}</p>
          </div>
          <button
            onClick={() => setShowSwapDetails((value) => !value)}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,205,184,0.1)", color: "#00CDB8" }}
            aria-label={showSwapDetails ? "Ocultar detalles del trueque" : "Mostrar detalles del trueque"}
          >
            {showSwapDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showSwapDetails && (
          <div className="mx-4 mt-2 rounded-2xl overflow-hidden shrink-0" style={{ background: "#111820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>Estado del trueque</p>
                <p className="text-sm font-bold capitalize" style={{ color: "#EEF2F7" }}>{statusLabel(openSwap.status)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>Diferencia</p>
                <p className="text-sm font-bold" style={{ color: valueDiff >= 0 ? "#00CDB8" : "#FF3A5C" }}>
                  {valueDiff >= 0 ? "+" : "-"}{money(Math.abs(valueDiff))}
                </p>
              </div>
            </div>

            <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#7A8A9A" }}>Artículo solicitado</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
                  {openSwap.wanted_item.image_url && <img src={openSwap.wanted_item.image_url} alt={openSwap.wanted_item.title} className="w-full h-full object-cover" />}
                </div>
                <p className="text-sm font-semibold flex-1 truncate" style={{ color: "#EEF2F7" }}>{openSwap.wanted_item.title}</p>
                <span className="text-sm font-bold" style={{ color: "#00CDB8" }}>{money(openSwap.wanted_item.estimated_value)}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
                  Artículos ofrecidos ({openSwap.offered_items.length})
                </p>
                <span className="text-xs font-bold" style={{ color: "#EEF2F7" }}>{money(offeredTotal)}</span>
              </div>

              {openSwap.offered_items.length === 0 ? (
                <p className="text-sm" style={{ color: "#7A8A9A" }}>Aun no hay oferta seleccionada.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {openSwap.offered_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
                        {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-sm font-medium flex-1 truncate" style={{ color: "#EEF2F7" }}>{item.title}</p>
                      <span className="text-sm font-semibold" style={{ color: "#7A8A9A" }}>{money(item.estimated_value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {(messages || []).map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full mr-2 self-end shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: "#1A2230", color: "#00CDB8" }}>
                    {openSwap.partner.username.charAt(0).toUpperCase()}
                  </div>
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
                    {msg.body}
                  </div>
                  <p className="text-[10px] mt-1 px-1" style={{ color: "#7A8A9A", textAlign: isMe ? "right" : "left" }}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          {!messages?.length && (
            <p className="text-sm text-center py-10" style={{ color: "#7A8A9A" }}>Aun no hay mensajes</p>
          )}
        </div>

        <div className="shrink-0 px-4 pb-8 pt-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "#1A2230" }}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#EEF2F7" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{ background: draft.trim() ? "linear-gradient(135deg, #00CDB8, #00A896)" : "#1A2230" }}
          >
            <Send size={16} style={{ color: draft.trim() ? "#080C12" : "#7A8A9A" }} />
          </button>
        </div>
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
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "#111820" }}>
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

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2">
        {error && <p className="text-xs text-center" style={{ color: "#FF3A5C" }}>{error}</p>}
        {isLoading && !swaps && <p className="text-sm text-center py-12" style={{ color: "#7A8A9A" }}>Cargando mensajes...</p>}
        {!isLoading && conversations.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: "#7A8A9A" }}>Aun no hay conversaciones de trueques</p>
        )}

        {conversations.map((swap) => {
          const itemImage = swap.wanted_item.image_url || swap.offered_items[0]?.image_url || "";
          const lastMessage = swap.last_message?.body || offeredLabel(swap);
          return (
            <button
              key={swap.id}
              onClick={() => {
                setOpenSwap(swap);
                setShowSwapDetails(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{ background: "#111820" }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold" style={{ background: "#1A2230", color: "#00CDB8" }}>
                {swap.partner.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold truncate" style={{ color: "#EEF2F7" }}>{swap.partner.username}</span>
                  <span className="text-xs shrink-0 ml-2" style={{ color: "#7A8A9A" }}>{formatRelative(swap.updated_at)}</span>
                </div>
                <p className="text-sm truncate" style={{ color: "#7A8A9A" }}>{lastMessage}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                    {itemImage && <img src={itemImage} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="text-[10px] truncate" style={{ color: "#7A8A9A" }}>{swap.wanted_item.title}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
