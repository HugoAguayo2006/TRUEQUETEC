import { useState } from "react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";

const REQUESTER_ITEMS = [
  {
    id: 1,
    name: "Cámara Polaroid Now",
    value: 110,
    condition: "Buen estado",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop",
    category: "Fotografía",
  },
  {
    id: 2,
    name: "Tornamesa vintage",
    value: 135,
    condition: "Muy buen estado",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
    category: "Audio",
  },
  {
    id: 3,
    name: "Chamarra Arc'teryx",
    value: 200,
    condition: "Como nuevo",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop",
    category: "Moda",
  },
  {
    id: 4,
    name: "Ray-Ban Wayfarer",
    value: 80,
    condition: "Muy buen estado",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
    category: "Moda",
  },
  {
    id: 5,
    name: "Nike Air Max 90",
    value: 95,
    condition: "Buen estado",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
    category: "Calzado",
  },
  {
    id: 6,
    name: "Drone DJI Mini 2",
    value: 280,
    condition: "Como nuevo",
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=300&h=300&fit=crop",
    category: "Tecnología",
  },
];

interface Props {
  wantedItem: { name: string; value: number; image: string };
  requester: { name: string; avatar: string };
  onSendOffer: (selected: typeof REQUESTER_ITEMS) => void;
  onBack: () => void;
}

export default function OwnerPickScreen({ wantedItem, requester, onSendOffer, onBack }: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  function toggle(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const selectedItems = REQUESTER_ITEMS.filter((i) => selected.includes(i.id));
  const totalValue = selectedItems.reduce((acc, i) => acc + i.value, 0);
  const diff = totalValue - wantedItem.value;

  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mb-5">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <img src={requester.avatar} alt={requester.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" />
          <div>
            <span className="text-[10px] text-primary font-semibold tracking-widest uppercase">Nueva solicitud</span>
            <h1 className="text-foreground text-lg font-bold leading-tight">
              {requester.name} quiere tu artículo
            </h1>
          </div>
        </div>
      </div>

      {/* Their wanted item */}
      <div className="mx-5 mb-4 rounded-2xl overflow-hidden shrink-0 relative" style={{ height: 140 }}>
        <img src={wantedItem.image} alt={wantedItem.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Quiere</span>
          <span className="text-white font-bold text-lg leading-tight">{wantedItem.name}</span>
          <span className="text-primary font-semibold text-sm">Valor estimado: ${wantedItem.value}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-5 mb-4 shrink-0">
        <p className="text-muted-foreground text-sm">
          Elige uno o más artículos de la colección de <span className="text-foreground font-semibold">{requester.name}</span> para proponer a cambio:
        </p>
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {REQUESTER_ITEMS.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="relative rounded-2xl overflow-hidden text-left transition-all active:scale-95"
                style={{
                  border: isSelected ? "2px solid #00CDB8" : "2px solid transparent",
                  background: "#111820",
                }}
              >
                <div className="relative" style={{ height: 120 }}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Check size={16} className="text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-foreground text-sm font-semibold leading-tight">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-muted-foreground text-xs">{item.condition}</span>
                    <span className={`text-xs font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                      ${item.value}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-5 pb-8 pt-3 border-t border-border bg-background">
        {selected.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground text-sm">
              {selected.length} {selected.length > 1 ? "artículos" : "artículo"} · ${totalValue}
            </span>
            <span className={`text-sm font-semibold ${diff >= 0 ? "text-primary" : "text-destructive"}`}>
              {diff >= 0 ? `+$${diff} para esa persona` : `-$${Math.abs(diff)} para ti`}
            </span>
          </div>
        )}
        <button
          onClick={() => selected.length > 0 && onSendOffer(selectedItems)}
          disabled={selected.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: selected.length > 0
              ? "linear-gradient(135deg, #00CDB8, #00A896)"
              : "#1A2230",
            color: selected.length > 0 ? "#080C12" : "#7A8A9A",
          }}
        >
          Enviar oferta
          {selected.length > 0 && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
