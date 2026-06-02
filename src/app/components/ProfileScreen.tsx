import { useState } from "react";
import { Star, Shield, Settings, ChevronRight, Plus, Edit3, LogOut, Bell, Lock, HelpCircle } from "lucide-react";

const MY_LISTINGS = [
  {
    id: 1,
    name: "Cámara analógica vintage",
    value: 180,
    condition: "Buen estado",
    image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=300&h=300&fit=crop",
    offers: 3,
  },
  {
    id: 2,
    name: "Teclado HHKB",
    value: 210,
    condition: "Como nuevo",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop",
    offers: 1,
  },
  {
    id: 3,
    name: "Drone DJI Mini 2",
    value: 280,
    condition: "Como nuevo",
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=300&h=300&fit=crop",
    offers: 0,
  },
  {
    id: 4,
    name: "Chamarra Arc'teryx",
    value: 200,
    condition: "Como nuevo",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop",
    offers: 2,
  },
];

const REVIEWS = [
  {
    id: 1,
    from: "Sara K.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    rating: 5,
    text: "Muy fácil coordinar con esta persona, el artículo era exactamente como se describía. ¡La recomiendo mucho!",
    time: "Hace 2 semanas",
  },
  {
    id: 2,
    from: "Tom R.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    rating: 5,
    text: "Respuestas rápidas, trueque justo y nos vimos en un lugar público. Todo muy fluido.",
    time: "Hace 1 mes",
  },
];

const SETTINGS_ROWS = [
  { icon: <Bell size={16} />, label: "Notificaciones", value: "Todas activas" },
  { icon: <Lock size={16} />, label: "Privacidad", value: "Perfil público" },
  { icon: <HelpCircle size={16} />, label: "Ayuda y soporte", value: "" },
  { icon: <LogOut size={16} />, label: "Cerrar sesión", value: "", destructive: true },
];

export default function ProfileScreen() {
  const [tab, setTab] = useState<"listings" | "reviews" | "settings">("listings");

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
      {/* Profile hero */}
      <div className="shrink-0 px-5 pt-12 pb-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(0,205,184,0.3)" }}>
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
                  alt="Tú"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#00CDB8" }}
              >
                <Edit3 size={11} style={{ color: "#080C12" }} />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-extrabold" style={{ color: "#EEF2F7" }}>Jordan Lee</h2>
                <Shield size={14} style={{ color: "#00CDB8" }} />
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold" style={{ color: "#EEF2F7" }}>4.9</span>
                <span className="text-sm" style={{ color: "#7A8A9A" }}>· 18 reseñas</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#7A8A9A" }}>Miembro desde ene 2024</p>
            </div>
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#1A2230" }}
          >
            <Settings size={17} style={{ color: "#7A8A9A" }} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Trueques", value: "18" },
            { label: "Publicados", value: "4" },
            { label: "Respuesta", value: "< 1 h" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-3 rounded-2xl" style={{ background: "#111820" }}>
              <span className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{s.value}</span>
              <span className="text-xs" style={{ color: "#7A8A9A" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bio */}
        <p className="text-sm leading-relaxed mb-5" style={{ color: "#7A8A9A" }}>
          Me gusta la fotografía analógica, el audio hi-fi y los accesorios minimalistas. Vivo en San Francisco y siempre puedo coordinar entregas locales.
        </p>

        {/* Tabs */}
        <div className="flex p-1 rounded-2xl" style={{ background: "#111820" }}>
          {(["listings", "reviews", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: tab === t ? "#1A2230" : "transparent",
                color: tab === t ? "#EEF2F7" : "#7A8A9A",
              }}
            >
              {t === "listings" ? `Publicaciones (${MY_LISTINGS.length})` : t === "reviews" ? "Reseñas" : "Ajustes"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Listings */}
        {tab === "listings" && (
          <div className="flex flex-col gap-3">
            {/* Add new listing */}
            <button
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-dashed text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ border: "1.5px dashed rgba(0,205,184,0.3)", color: "#00CDB8" }}
            >
              <Plus size={16} />
              Agregar publicación
            </button>

            {MY_LISTINGS.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#EEF2F7" }}>{item.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#7A8A9A" }}>{item.condition}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-bold text-sm" style={{ color: "#00CDB8" }}>${item.value}</span>
                    {item.offers > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: "rgba(0,205,184,0.12)", color: "#00CDB8" }}
                      >
                        {item.offers} {item.offers > 1 ? "ofertas" : "oferta"}
                      </span>
                    )}
                  </div>
                </div>
                <button style={{ color: "#7A8A9A" }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {tab === "reviews" && (
          <div className="flex flex-col gap-3">
            {/* Rating summary */}
            <div
              className="p-4 rounded-2xl mb-1 flex items-center gap-5"
              style={{ background: "#111820" }}
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl font-extrabold" style={{ color: "#EEF2F7" }}>4.9</span>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={12} className={s <= 5 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                  ))}
                </div>
                <span className="text-xs mt-1" style={{ color: "#7A8A9A" }}>18 reseñas</span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {[5,4,3,2,1].map((star) => {
                  const pct = star === 5 ? 88 : star === 4 ? 10 : 2;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs w-2" style={{ color: "#7A8A9A" }}>{star}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1A2230" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#FFD166" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {REVIEWS.map((review) => (
              <div key={review.id} className="p-4 rounded-2xl" style={{ background: "#111820" }}>
                <div className="flex items-center gap-3 mb-3">
                  <img src={review.avatar} alt={review.from} className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: "#EEF2F7" }}>{review.from}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={10} className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: "#7A8A9A" }}>{review.time}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#B0BFCC" }}>"{review.text}"</p>
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}>
              {SETTINGS_ROWS.map((row, i) => (
                <button
                  key={row.label}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all active:bg-secondary"
                  style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                >
                  <span style={{ color: row.destructive ? "#FF3A5C" : "#7A8A9A" }}>{row.icon}</span>
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: row.destructive ? "#FF3A5C" : "#EEF2F7" }}
                  >
                    {row.label}
                  </span>
                  {row.value && (
                    <span className="text-xs" style={{ color: "#7A8A9A" }}>{row.value}</span>
                  )}
                  {!row.destructive && <ChevronRight size={16} style={{ color: "#7A8A9A" }} />}
                </button>
              ))}
            </div>

            <p className="text-center text-xs pt-4" style={{ color: "#3A4A5A" }}>
              Swaply v1.0.0 · Términos · Privacidad
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
