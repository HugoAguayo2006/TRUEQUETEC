import { useState } from "react";
import { Compass, RefreshCw, MessageCircle, User } from "lucide-react";
import DiscoverScreen from "./components/DiscoverScreen";
import RequestSentScreen from "./components/RequestSentScreen";
import OwnerPickScreen from "./components/OwnerPickScreen";
import ExchangeProposalScreen from "./components/ExchangeProposalScreen";
import CounterOfferScreen from "./components/CounterOfferScreen";
import SwapConfirmedScreen from "./components/SwapConfirmedScreen";
import SwapsScreen from "./components/SwapsScreen";
import MessagesScreen from "./components/MessagesScreen";
import ProfileScreen from "./components/ProfileScreen";

type FlowScreen =
  | "request-sent"
  | "owner-pick"
  | "exchange-proposal"
  | "counter-offer"
  | "swap-confirmed";

type NavTab = "discover" | "swaps" | "messages" | "profile";

const WANTED_ITEM = {
  name: "Cámara analógica Leica M6",
  value: 180,
  image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=600&h=800&fit=crop",
  owner: "Alex M.",
  ownerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
};

const PROPOSER = {
  name: "Marcus J.",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
  rating: 4.8,
  swaps: 23,
};

const DEFAULT_OFFERED = [
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
];

const NAV = [
  { id: "discover" as NavTab, icon: Compass, label: "Descubrir" },
  { id: "swaps" as NavTab, icon: RefreshCw, label: "Trueques" },
  { id: "messages" as NavTab, icon: MessageCircle, label: "Mensajes" },
  { id: "profile" as NavTab, icon: User, label: "Perfil" },
];

export default function App() {
  const [tab, setTab] = useState<NavTab>("discover");
  const [flow, setFlow] = useState<FlowScreen | null>(null);
  const [swipedItem, setSwipedItem] = useState<typeof WANTED_ITEM | null>(null);
  const [offeredItems, setOfferedItems] = useState(DEFAULT_OFFERED);
  const wantedItem = swipedItem || WANTED_ITEM;

  function handleSwipeRight(item: typeof WANTED_ITEM) {
    setSwipedItem(item);
    setFlow("request-sent");
  }

  function exitFlow() {
    setFlow(null);
    setSwipedItem(null);
    setOfferedItems(DEFAULT_OFFERED);
  }

  const inFlow = flow !== null;

  return (
    <div
      className="size-full flex flex-col overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Flow screens take over the full viewport */}
        {inFlow && flow === "request-sent" && swipedItem && (
          <RequestSentScreen
            item={swipedItem}
            onContinue={() => setFlow("owner-pick")}
          />
        )}
        {inFlow && flow === "owner-pick" && (
          <OwnerPickScreen
            wantedItem={wantedItem}
            requester={{ name: "Marcus J.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" }}
            onSendOffer={(items) => {
              setOfferedItems(items as typeof DEFAULT_OFFERED);
              setFlow("exchange-proposal");
            }}
            onBack={() => setFlow("request-sent")}
          />
        )}
        {inFlow && flow === "exchange-proposal" && (
          <ExchangeProposalScreen
            yourItem={wantedItem}
            offeredItems={offeredItems}
            proposer={PROPOSER}
            onAccept={() => setFlow("swap-confirmed")}
            onReject={exitFlow}
            onCounter={() => setFlow("counter-offer")}
            onBack={() => setFlow("owner-pick")}
          />
        )}
        {inFlow && flow === "counter-offer" && (
          <CounterOfferScreen
            theirItem={wantedItem}
            proposerName={PROPOSER.name}
            onSend={() => setFlow("swap-confirmed")}
            onBack={() => setFlow("exchange-proposal")}
          />
        )}
        {inFlow && flow === "swap-confirmed" && (
          <SwapConfirmedScreen
            yourItem={wantedItem}
            theirItems={offeredItems}
            partnerName={PROPOSER.name}
            partnerAvatar={PROPOSER.avatar}
            onDone={exitFlow}
          />
        )}

        {/* Tab views */}
        {!inFlow && (
          <>
            <div className={`h-full ${tab === "discover" ? "block" : "hidden"}`}>
              <DiscoverScreen onSwipeRight={handleSwipeRight} />
            </div>
            <div className={`h-full overflow-y-auto ${tab === "swaps" ? "block" : "hidden"}`}>
              <SwapsScreen />
            </div>
            <div className={`h-full overflow-y-auto ${tab === "messages" ? "block" : "hidden"}`}>
              <MessagesScreen />
            </div>
            <div className={`h-full overflow-y-auto ${tab === "profile" ? "block" : "hidden"}`}>
              <ProfileScreen />
            </div>
          </>
        )}
      </div>

      {/* Bottom nav — hidden during flow screens */}
      {!inFlow && (
        <div
          className="shrink-0 flex"
          style={{
            background: "rgba(8,12,18,0.95)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all active:scale-90"
              >
                <Icon
                  size={22}
                  style={{ color: active ? "#00CDB8" : "#4A5A6A" }}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? "#00CDB8" : "#4A5A6A" }}
                >
                  {label}
                </span>
                {id === "swaps" && !active && (
                  <div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: "#00CDB8", marginTop: -18, marginLeft: 12 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
