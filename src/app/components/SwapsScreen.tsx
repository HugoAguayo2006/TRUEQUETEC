import { useEffect, useState } from "react";
import { RefreshCw, Clock, CheckCircle, XCircle, ChevronRight, Plus } from "lucide-react";
import { estimateProductPrice, type PriceEstimate } from "../../services/endpoints";

type SwapStatus = "pending" | "offer-received" | "awaiting" | "completed" | "declined";

interface Swap {
  id: number;
  status: SwapStatus;
  updatedAt: string;
  yourItem: { name: string; image: string; value: number };
  theirItem: { name: string; image: string; value: number };
  partner: { name: string; avatar: string };
}

const SWAPS: Swap[] = [
  {
    id: 1,
    status: "offer-received",
    updatedAt: "Ahora",
    yourItem: {
      name: "Cámara analógica Leica M6",
      image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=200&h=200&fit=crop",
      value: 180,
    },
    theirItem: {
      name: "Polaroid Now + tornamesa",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&h=200&fit=crop",
      value: 245,
    },
    partner: {
      name: "Marcus J.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    },
  },
  {
    id: 2,
    status: "awaiting",
    updatedAt: "Hace 2 h",
    yourItem: {
      name: "HHKB Pro Hybrid",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&h=200&fit=crop",
      value: 210,
    },
    theirItem: {
      name: "Sony WH-1000XM5",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      value: 190,
    },
    partner: {
      name: "Sara K.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    },
  },
  {
    id: 3,
    status: "completed",
    updatedAt: "Hace 3 días",
    yourItem: {
      name: "Chamarra Arc'teryx",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop",
      value: 200,
    },
    theirItem: {
      name: "Nike Air Max 90",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
      value: 95,
    },
    partner: {
      name: "Tom R.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    },
  },
  {
    id: 4,
    status: "declined",
    updatedAt: "Hace 1 semana",
    yourItem: {
      name: "Drone DJI Mini 2",
      image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=200&h=200&fit=crop",
      value: 280,
    },
    theirItem: {
      name: "Reloj analógico",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
      value: 120,
    },
    partner: {
      name: "Ji-Ho L.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    },
  },
];

const STATUS_META: Record<SwapStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "offer-received": {
    label: "Oferta recibida",
    color: "#00CDB8",
    bg: "rgba(0,205,184,0.1)",
    icon: <RefreshCw size={11} />,
  },
  awaiting: {
    label: "Esperando respuesta",
    color: "#FFD166",
    bg: "rgba(255,209,102,0.1)",
    icon: <Clock size={11} />,
  },
  pending: {
    label: "Pendiente",
    color: "#7A8A9A",
    bg: "rgba(122,138,154,0.1)",
    icon: <Clock size={11} />,
  },
  completed: {
    label: "Completado",
    color: "#06D6A0",
    bg: "rgba(6,214,160,0.1)",
    icon: <CheckCircle size={11} />,
  },
  declined: {
    label: "Rechazado",
    color: "#FF3A5C",
    bg: "rgba(255,58,92,0.1)",
    icon: <XCircle size={11} />,
  },
};

export default function SwapsScreen() {
  const [filter, setFilter] = useState<"active" | "history">("active");
  const [priceEstimates, setPriceEstimates] = useState<Record<string, PriceEstimate>>({});
  const [priceLoading, setPriceLoading] = useState<Record<string, boolean>>({});
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});

  const active = SWAPS.filter((s) => s.status === "offer-received" || s.status === "awaiting" || s.status === "pending");
  const history = SWAPS.filter((s) => s.status === "completed" || s.status === "declined");
  const shown = filter === "active" ? active : history;
  const itemNames = Array.from(
    new Set(SWAPS.flatMap((swap) => [swap.yourItem.name, swap.theirItem.name]))
  );

  useEffect(() => {
    let isActive = true;

    itemNames.forEach((name) => {
      setPriceLoading((current) => ({ ...current, [name]: true }));

      estimateProductPrice(name)
        .then((estimate) => {
          if (!isActive) return;
          setPriceEstimates((current) => ({ ...current, [name]: estimate }));
          setPriceErrors((current) => {
            const next = { ...current };
            delete next[name];
            return next;
          });
        })
        .catch((error: unknown) => {
          if (!isActive) return;
          setPriceErrors((current) => ({
            ...current,
            [name]: error instanceof Error ? error.message : "No se pudo calcular el precio",
          }));
        })
        .finally(() => {
          if (!isActive) return;
          setPriceLoading((current) => ({ ...current, [name]: false }));
        });
    });

    return () => {
      isActive = false;
    };
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  const valueLabel = (item: Swap["yourItem"]) => {
    const estimate = priceEstimates[item.name];
    if (estimate) return formatPrice(estimate.average);
    if (priceLoading[item.name]) return "...";
    return formatPrice(item.value);
  };

  const valueSource = (item: Swap["yourItem"]) => {
    const estimate = priceEstimates[item.name];
    if (estimate) return "promedio web";
    if (priceErrors[item.name]) return "valor local";
    return "calculando";
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5 shrink-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Tus trueques</p>
            <h1 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Trueques</h1>
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#1A2230" }}
          >
            <Plus size={18} style={{ color: "#EEF2F7" }} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex p-1 rounded-2xl" style={{ background: "#111820" }}>
          {(["active", "history"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{
                background: filter === f ? "#1A2230" : "transparent",
                color: filter === f ? "#EEF2F7" : "#7A8A9A",
              }}
            >
              {f === "active" ? `Activos (${active.length})` : "Historial"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
        {shown.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20" style={{ color: "#7A8A9A" }}>
            <RefreshCw size={32} style={{ color: "#1A2230" }} />
            <p className="text-sm">{filter === "active" ? "Aún no hay trueques activos" : "Aún no hay historial"}</p>
          </div>
        )}

        {shown.map((swap) => {
          const meta = STATUS_META[swap.status];
          const isActionable = swap.status === "offer-received";
          return (
            <button
              key={swap.id}
              className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{
                background: "#111820",
                border: isActionable ? "1.5px solid rgba(0,205,184,0.25)" : "1.5px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Top row: partner + status + time */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img src={swap.partner.avatar} alt={swap.partner.name} className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-sm font-semibold" style={{ color: "#EEF2F7" }}>{swap.partner.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#7A8A9A" }}>{swap.updatedAt}</span>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.icon}
                    <span className="text-[10px] font-semibold">{meta.label}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
                    <img src={swap.yourItem.image} alt={swap.yourItem.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate font-medium" style={{ color: "#7A8A9A" }}>Das</p>
                    <p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{swap.yourItem.name}</p>
                    <p className="text-xs font-semibold" style={{ color: "#00CDB8" }}>{valueLabel(swap.yourItem)}</p>
                    <p className="text-[9px]" style={{ color: "#7A8A9A" }}>{valueSource(swap.yourItem)}</p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A2230" }}>
                  <RefreshCw size={13} style={{ color: "#7A8A9A" }} />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
                    <img src={swap.theirItem.image} alt={swap.theirItem.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-xs font-medium" style={{ color: "#7A8A9A" }}>Recibes</p>
                    <p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{swap.theirItem.name}</p>
                    <p className="text-xs font-semibold" style={{ color: "#00CDB8" }}>{valueLabel(swap.theirItem)}</p>
                    <p className="text-[9px]" style={{ color: "#7A8A9A" }}>{valueSource(swap.theirItem)}</p>
                  </div>
                </div>
              </div>

              {/* CTA for actionable */}
              {isActionable && (
                <div
                  className="flex items-center justify-center gap-1.5 mt-3 pt-3 font-semibold text-sm"
                  style={{ borderTop: "1px solid rgba(0,205,184,0.15)", color: "#00CDB8" }}
                >
                  Revisar oferta <ChevronRight size={15} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
