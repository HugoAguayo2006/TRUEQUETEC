import { useState } from "react";
import { ArrowLeft, Check, Plus, Minus } from "lucide-react";

const YOUR_ITEMS = [
  {
    id: 1,
    name: "Cámara analógica vintage",
    value: 180,
    condition: "Buen estado",
    image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=300&h=300&fit=crop",
  },
  {
    id: 2,
    name: "Reloj analógico",
    value: 120,
    condition: "Muy buen estado",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
  },
  {
    id: 3,
    name: "Cinturón de piel",
    value: 45,
    condition: "Como nuevo",
    image: "https://images.unsplash.com/photo-1624222247345-e387671bc836?w=300&h=300&fit=crop",
  },
  {
    id: 4,
    name: "Fleece Patagonia",
    value: 90,
    condition: "Buen estado",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=300&fit=crop",
  },
];

interface Props {
  theirItem: { name: string; value: number; image: string };
  proposerName: string;
  onSend: () => void;
  onBack: () => void;
}

export default function CounterOfferScreen({ theirItem, proposerName, onSend, onBack }: Props) {
  const [selected, setSelected] = useState<number[]>([1]);
  const [cashAdjust, setCashAdjust] = useState(0);
  const [note, setNote] = useState("");

  function toggle(id: number) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const selectedItems = YOUR_ITEMS.filter((i) => selected.includes(i.id));
  const itemsTotal = selectedItems.reduce((acc, i) => acc + i.value, 0);
  const counterTotal = itemsTotal + cashAdjust;
  const diff = counterTotal - theirItem.value;

  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <span className="text-[10px] text-primary font-semibold tracking-widest uppercase">Contraoferta</span>
        <h1 className="text-foreground text-2xl font-bold mt-1">Arma tu <span className="text-primary italic">contraoferta</span></h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selecciona artículos de tu colección para ofrecerle a {proposerName.split(" ")[0]} en su lugar
        </p>
      </div>

      {/* Their item reference */}
      <div className="mx-5 mb-4 p-3 rounded-2xl bg-secondary border border-border flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
          <img src={theirItem.image} alt={theirItem.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Quiere tu</span>
          <p className="text-foreground font-semibold text-sm">{theirItem.name}</p>
          <span className="text-primary text-xs font-semibold">${theirItem.value}</span>
        </div>
      </div>

      {/* Your items */}
      <div className="px-5 mb-2 shrink-0">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Tus artículos para ofrecer</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-2 mb-4">
          {YOUR_ITEMS.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98] text-left"
                style={{
                  background: isSelected ? "rgba(0,205,184,0.06)" : "#111820",
                  borderColor: isSelected ? "rgba(0,205,184,0.4)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">{item.name}</p>
                  <span className="text-muted-foreground text-xs">{item.condition}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">${item.value}</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: isSelected ? "#00CDB8" : "rgba(255,255,255,0.2)",
                      background: isSelected ? "#00CDB8" : "transparent",
                    }}
                  >
                    {isSelected && <Check size={12} className="text-primary-foreground" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cash adjustment */}
        <div className="p-4 rounded-2xl bg-card border border-border mb-4">
          <p className="text-foreground font-semibold text-sm mb-3">Agrega efectivo para equilibrar</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCashAdjust((v) => Math.max(v - 10, -100))}
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus size={16} className="text-foreground" />
            </button>
            <div className="text-center">
              <span className={`text-2xl font-bold ${cashAdjust >= 0 ? "text-primary" : "text-destructive"}`}>
                {cashAdjust >= 0 ? "+" : ""}${cashAdjust}
              </span>
              <p className="text-muted-foreground text-xs">ajuste en efectivo</p>
            </div>
            <button
              onClick={() => setCashAdjust((v) => Math.min(v + 10, 100))}
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus size={16} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-foreground font-semibold text-sm mb-2">Agrega una nota (opcional)</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explica tu contraoferta..."
            rows={3}
            className="w-full bg-secondary rounded-xl p-3 text-sm text-foreground placeholder-muted-foreground resize-none outline-none border border-border focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Bottom */}
      <div className="shrink-0 px-5 pb-8 pt-3 border-t border-border bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-muted-foreground text-xs">Tu contraoferta</span>
            <p className="text-foreground font-bold text-lg">${counterTotal}</p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-xs">vs. su oferta</span>
            <p className={`font-bold text-lg ${diff >= 0 ? "text-primary" : "text-destructive"}`}>
              {diff >= 0 ? "+" : ""}${diff}
            </p>
          </div>
        </div>
        <button
          onClick={() => selected.length > 0 && onSend()}
          disabled={selected.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
          style={{
            background: selected.length > 0
              ? "linear-gradient(135deg, #00CDB8, #00A896)"
              : "#1A2230",
            color: selected.length > 0 ? "#080C12" : "#7A8A9A",
          }}
        >
          Enviar contraoferta
        </button>
      </div>
    </div>
  );
}
