import { CheckCircle, MapPin, MessageCircle, Share2 } from "lucide-react";

interface Props {
  yourItem: { name: string; image: string };
  theirItems: { name: string; image: string }[];
  partnerName: string;
  partnerAvatar: string;
  onDone: () => void;
}

export default function SwapConfirmedScreen({ yourItem, theirItems, partnerName, partnerAvatar, onDone }: Props) {
  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <div
        className="shrink-0 flex flex-col items-center justify-center pt-16 pb-10 px-5 relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,205,184,0.15) 0%, transparent 70%)" }}
      >
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary opacity-40"
            style={{
              top: `${15 + (i * 12)}%`,
              left: `${10 + (i * 15)}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}

        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-2xl" style={{ background: "linear-gradient(135deg, #00CDB8, #00A896)" }}>
          <CheckCircle size={40} className="text-white" />
        </div>

        <h1 className="text-foreground text-3xl font-extrabold text-center mb-2">
          ¡Trueque confirmado! 🎉
        </h1>
        <p className="text-muted-foreground text-base text-center max-w-xs">
          {partnerName.split(" ")[0]} y tú acordaron el trueque. ¡Hora de coordinar el intercambio!
        </p>
      </div>

      {/* The swap summary */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Items */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden mb-4">
          <div className="p-4 flex items-center gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl overflow-hidden">
                <img src={yourItem.image} alt={yourItem.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-foreground font-semibold text-xs text-center">{yourItem.name}</span>
              <span className="text-muted-foreground text-xs">Das</span>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(0,205,184,0.1)" }}>
              <span className="text-primary text-sm">⇄</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              {theirItems.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  {i === 0 && (
                    <span className="text-foreground font-semibold text-xs">{item.name}</span>
                  )}
                </div>
              ))}
              {theirItems.length > 1 && (
                <span className="text-muted-foreground text-xs">{theirItems.length} artículos · Recibes</span>
              )}
            </div>
          </div>
        </div>

        {/* Partner card */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4 flex items-center gap-4">
          <img src={partnerAvatar} alt={partnerName} className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" />
          <div className="flex-1">
            <p className="text-foreground font-bold">{partnerName}</p>
            <p className="text-muted-foreground text-sm">Esperando tu mensaje para coordinar la entrega</p>
          </div>
        </div>

        {/* Next steps */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-4">
          <h3 className="text-foreground font-bold text-sm mb-3">Siguientes pasos</h3>
          {[
            { icon: <MessageCircle size={15} className="text-primary" />, text: "Envíense mensajes para coordinar la entrega" },
            { icon: <MapPin size={15} className="text-primary" />, text: "Acuerden un punto de encuentro público" },
            { icon: <CheckCircle size={15} className="text-primary" />, text: "Confirmen la recepción cuando termine el trueque" },
          ].map((step, i) => (
            <div key={i} className={`flex items-start gap-3 ${i < 2 ? "mb-3" : ""}`}>
              <div className="mt-0.5 shrink-0">{step.icon}</div>
              <span className="text-muted-foreground text-sm">{step.text}</span>
            </div>
          ))}
        </div>

        {/* Safety tip */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "rgba(0,205,184,0.06)", border: "1px solid rgba(0,205,184,0.15)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-1">Consejo de seguridad</p>
              <p className="text-muted-foreground text-sm">Reúnete siempre en un lugar público y revisa los artículos antes de completar el trueque.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 px-5 pb-8 pt-3 border-t border-border bg-background flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            className="flex-1 py-3.5 rounded-2xl bg-secondary flex items-center justify-center gap-2 font-semibold text-sm text-muted-foreground active:scale-95 transition-all"
          >
            <Share2 size={16} />
            Compartir
          </button>
          <button
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm active:scale-95 transition-all"
            style={{ border: "2px solid #00CDB8", color: "#00CDB8" }}
          >
            <MessageCircle size={16} />
            Mensaje
          </button>
        </div>
        <button
          onClick={onDone}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
          style={{ background: "linear-gradient(135deg, #00CDB8, #00A896)", color: "#080C12" }}
        >
          Volver a descubrir
        </button>
      </div>
    </div>
  );
}
