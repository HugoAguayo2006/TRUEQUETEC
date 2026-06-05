import { useState } from "react";
import { Compass, RefreshCw, MessageCircle, User } from "lucide-react";
import OnboardingScreen from "./components/OnboardingScreen";
import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";
import DiscoverScreen from "./components/DiscoverScreen";
import SwapsScreen from "./components/SwapsScreen";
import MessagesScreen from "./components/MessagesScreen";
import ProfileScreen from "./components/ProfileScreen";
import RateSwapScreen from "./components/RateSwapScreen";
import React from "react";
import { api, ItemResponseData, SwapResponseData } from "../services/endpoints";
import { useAuth } from "../context/AuthContext";

type AuthScreen = "onboarding" | "login" | "signup";
type FlowScreen = "rate-swap";

type NavTab = "discover" | "swaps" | "messages" | "profile";

const NAV = [
	{ id: "discover" as NavTab, icon: Compass, label: "Discover" },
	{ id: "swaps" as NavTab, icon: RefreshCw, label: "Swaps" },
	{ id: "messages" as NavTab, icon: MessageCircle, label: "Messages" },
	{ id: "profile" as NavTab, icon: User, label: "Profile" },
];

function toRateItem(item: ItemResponseData) {
	return {
		name: item.title,
		image: item.image_url,
	};
}

function summarizeRateItems(items: ItemResponseData[]) {
	if (items.length === 0) return [];
	return items.map(toRateItem);
}

export default function App() {
	const { user, isAuthenticated } = useAuth();
	const [auth, setAuth] = useState<AuthScreen>("onboarding");
	const [tab, setTab] = useState<NavTab>("discover");
	const [flow, setFlow] = useState<FlowScreen | null>(null);
	const [ratingSwap, setRatingSwap] = useState<SwapResponseData | null>(null);

	function handleSwapRequested() {
		setTab("swaps");
	}

	function exitFlow() {
		setFlow(null);
		setRatingSwap(null);
	}

	function handleRateSwap(swap: SwapResponseData) {
		setRatingSwap(swap);
		setFlow("rate-swap");
	}

	function getRatingPayload() {
		if (ratingSwap && user) {
			const isOwner = ratingSwap.owner_id === user.id;
			const yourItems = isOwner ? [ratingSwap.wanted_item] : ratingSwap.offered_items;
			const theirItems = isOwner ? ratingSwap.offered_items : [ratingSwap.wanted_item];

			return {
				partner: {
					name: ratingSwap.partner.username,
					avatar: "",
				},
				yourItem: toRateItem(yourItems[0] || ratingSwap.wanted_item),
				theirItems: summarizeRateItems(theirItems),
			};
		}

		return null;
	}

	async function handleSubmitRating(rating: number, note: string) {
		if (ratingSwap && user) {
			await api.rateSwap(ratingSwap.id, user.id, rating, note);
		}
		exitFlow();
	}

	if (!isAuthenticated) {
		if (auth === "onboarding") {
			return (<OnboardingScreen onLogin={() => setAuth("login")}
				onSignup={() => setAuth("signup")}
			/>
			);
		}
		if (auth === "login") {
			return (
				<LoginScreen onLogin={() => setTab("discover")}
					onGoSignup={() => setAuth("signup")}
				/>
			);
		}
		return (
			<SignupScreen onSignup={() => setTab("discover")}
				onGoLogin={() => setAuth("login")}
			/>
		);
	}

	const inFlow = flow !== null;
	const ratingPayload = flow === "rate-swap" ? getRatingPayload() : null;

	return (
		<div
			className="size-full flex flex-col overflow-hidden"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			<div className="flex-1 min-h-0 overflow-hidden">
				{inFlow && flow === "rate-swap" && ratingPayload && (
					<RateSwapScreen
						partner={ratingPayload.partner}
						yourItem={ratingPayload.yourItem}
						theirItems={ratingPayload.theirItems}
						onSubmit={handleSubmitRating}
						onSkip={exitFlow}
					/>
				)}

				{!inFlow && (
					<>
						<div className={`h-full ${tab === "discover" ? "block" : "hidden"}`}>
							<DiscoverScreen onSwapRequested={handleSwapRequested} />
						</div>
						<div className={`h-full overflow-y-auto ${tab === "swaps" ? "block" : "hidden"}`}>
							<SwapsScreen onRate={handleRateSwap} />
						</div>
						<div className={`h-full overflow-y-auto ${tab === "messages" ? "block" : "hidden"}`}>
							<MessagesScreen />
						</div>
						<div className={`h-full overflow-y-auto ${tab === "profile" ? "block" : "hidden"}`}>
							<ProfileScreen isActive={tab === "profile"} />
						</div>
					</>
				)}
			</div>

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
								className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all active:scale-90 relative"
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
									<div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: "#00CDB8", top: "12px", right: "35%" }} />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
