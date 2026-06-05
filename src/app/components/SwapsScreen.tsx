import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Clock, CheckCircle, XCircle, ChevronRight, Star, ArrowLeft, Check } from "lucide-react";
import React from "react";
import { api, ItemResponseData, SwapResponseData } from "../../services/endpoints";
import { WS_BASE_URL } from "../../services/api_client";
import { useApi } from "../../hooks/use_api";
import { useAuth } from "../../context/AuthContext";

type SwapStatus = "pending" | "offer-received" | "awaiting" | "accepted" | "countered" | "completed" | "declined";
type DisplayItem = {
	name: string;
	image: string;
	value: number;
};

const STATUS_META: Record<SwapStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
	"offer-received": {
		label: "Offer received",
		color: "#00CDB8",
		bg: "rgba(0,205,184,0.1)",
		icon: <RefreshCw size={11} />,
	},
	awaiting: {
		label: "Awaiting reply",
		color: "#FFD166",
		bg: "rgba(255,209,102,0.1)",
		icon: <Clock size={11} />,
	},
	pending: {
		label: "Pending",
		color: "#7A8A9A",
		bg: "rgba(122,138,154,0.1)",
		icon: <Clock size={11} />,
	},
	countered: {
		label: "Counter offer",
		color: "#A78BFA",
		bg: "rgba(167,139,250,0.1)",
		icon: <RefreshCw size={11} />,
	},
	accepted: {
		label: "Awaiting receipt",
		color: "#38BDF8",
		bg: "rgba(56,189,248,0.1)",
		icon: <Clock size={11} />,
	},
	completed: {
		label: "Completed",
		color: "#06D6A0",
		bg: "rgba(6,214,160,0.1)",
		icon: <CheckCircle size={11} />,
	},
	declined: {
		label: "Declined",
		color: "#FF3A5C",
		bg: "rgba(255,58,92,0.1)",
		icon: <XCircle size={11} />,
	},
};

interface Props {
	onRate?: (swap: SwapResponseData) => void;
}

function formatSwapTime(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const diffMs = Date.now() - date.getTime();
	const mins = Math.floor(diffMs / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function displayStatus(swap: SwapResponseData, userId: string): SwapStatus {
	if (swap.status === "awaiting") {
		return swap.requester_id === userId ? "offer-received" : "awaiting";
	}
	return swap.status;
}

function toDisplayItem(item: SwapResponseData["wanted_item"]): DisplayItem {
	return {
		name: item.title,
		image: item.image_url,
		value: item.estimated_value,
	};
}

function summarizeItems(items: SwapResponseData["offered_items"], fallback = "No items yet"): DisplayItem {
	if (!items.length) return { name: fallback, image: "", value: 0 };
	return {
		name: items.map((item) => item.title).join(" + "),
		image: items[0].image_url,
		value: items.reduce((sum, item) => sum + item.estimated_value, 0),
	};
}

function money(value: number) {
	return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function SwapsScreen({ onRate }: Props) {
	const [filter, setFilter] = useState<"active" | "history">("active");
	const [rated, setRated] = useState<string[]>([]);
	const [pickingSwap, setPickingSwap] = useState<SwapResponseData | null>(null);
	const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
	const { user } = useAuth();
	const { execute, isLoading, data: swaps, error } = useApi<SwapResponseData[]>();
	const { execute: updateStatus } = useApi<SwapResponseData>();
	const { execute: loadPartnerItems, isLoading: isLoadingPartnerItems, data: partnerItems, error: partnerItemsError } = useApi<ItemResponseData[]>();
	const { execute: sendOffer, isLoading: isSendingOffer, error: sendOfferError } = useApi<SwapResponseData>();

	const fetchSwaps = React.useCallback(() => {
		if (user?.id) execute(() => api.getSwaps(user.id));
	}, [execute, user?.id]);

	useEffect(() => {
		fetchSwaps();
	}, [fetchSwaps]);

	useEffect(() => {
		if (!user?.id) return;
		const socket = new WebSocket(`${WS_BASE_URL}/swaps/ws/${user.id}`);
		socket.onmessage = () => fetchSwaps();
		return () => socket.close();
	}, [fetchSwaps, user?.id]);

	useEffect(() => {
		if (!pickingSwap) return;
		setSelectedOfferIds([]);
		loadPartnerItems(() => api.getUserItems(pickingSwap.requester_id, true));
	}, [loadPartnerItems, pickingSwap]);

	const shown = useMemo(() => {
		const all = swaps || [];
		return all.filter((swap) => {
			const status = displayStatus(swap, user?.id || "");
			const isHistory = status === "completed" || status === "declined";
			return filter === "history" ? isHistory : !isHistory;
		});
	}, [filter, swaps, user?.id]);

	async function setSwapStatus(swapId: string, status: "accepted" | "completed" | "declined") {
		await updateStatus(() => api.updateSwapStatus(swapId, status));
		fetchSwaps();
	}

	function toggleOfferItem(itemId: string) {
		setSelectedOfferIds((prev) =>
			prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
		);
	}

	async function handleSendOffer() {
		if (!pickingSwap || selectedOfferIds.length === 0) return;
		await sendOffer(() => api.updateSwapOffer(pickingSwap.id, selectedOfferIds));
		setPickingSwap(null);
		setSelectedOfferIds([]);
		fetchSwaps();
	}

	if (!user) return null;

	if (pickingSwap) {
		const selectedItems = (partnerItems || []).filter((item) => selectedOfferIds.includes(item.id));
		const selectedValue = selectedItems.reduce((sum, item) => sum + item.estimated_value, 0);
		const diff = selectedValue - pickingSwap.wanted_item.estimated_value;

		return (
			<div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
				<div className="px-5 pt-12 pb-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
					<button
						onClick={() => setPickingSwap(null)}
						className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
						style={{ background: "#111820" }}
					>
						<ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
					</button>
					<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Swap request</p>
					<h1 className="text-xl font-extrabold leading-tight" style={{ color: "#EEF2F7" }}>
						Pick what you want from {pickingSwap.partner.username}
					</h1>
				</div>

				<div className="mx-5 mt-4 rounded-2xl overflow-hidden shrink-0 relative" style={{ height: 128 }}>
					<img src={pickingSwap.wanted_item.image_url} alt={pickingSwap.wanted_item.title} className="w-full h-full object-cover" />
					<div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.82), rgba(0,0,0,0.2))" }} />
					<div className="absolute inset-0 flex flex-col justify-end p-4">
						<span className="text-white/60 text-xs font-medium uppercase tracking-wider">They want</span>
						<span className="text-white font-bold text-base leading-tight">{pickingSwap.wanted_item.title}</span>
						<span className="text-sm font-semibold" style={{ color: "#00CDB8" }}>${pickingSwap.wanted_item.estimated_value}</span>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-4">
					{partnerItemsError && <p className="text-xs text-center mb-3" style={{ color: "#FF3A5C" }}>{partnerItemsError}</p>}
					{isLoadingPartnerItems && !partnerItems && <p className="text-sm text-center py-10" style={{ color: "#7A8A9A" }}>Loading their items...</p>}
					{partnerItems?.length === 0 && (
						<p className="text-sm text-center py-10" style={{ color: "#7A8A9A" }}>
							{pickingSwap.partner.username} has no items available to offer.
						</p>
					)}

					<div className="grid grid-cols-2 gap-3">
						{(partnerItems || []).map((item) => {
							const selected = selectedOfferIds.includes(item.id);
							return (
								<button
									key={item.id}
									onClick={() => toggleOfferItem(item.id)}
									className="relative rounded-2xl overflow-hidden text-left transition-all active:scale-95"
									style={{
										background: "#111820",
										border: selected ? "2px solid #00CDB8" : "2px solid rgba(255,255,255,0.06)",
									}}
								>
									<div className="relative" style={{ height: 120 }}>
										<img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
										{selected && (
											<div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,205,184,0.2)" }}>
												<div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#00CDB8" }}>
													<Check size={16} style={{ color: "#080C12" }} />
												</div>
											</div>
										)}
									</div>
									<div className="p-3">
										<p className="text-sm font-semibold leading-tight truncate" style={{ color: "#EEF2F7" }}>{item.title}</p>
										<p className="text-xs font-bold mt-1" style={{ color: selected ? "#00CDB8" : "#7A8A9A" }}>${item.estimated_value}</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				<div className="shrink-0 px-5 pb-8 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#080C12" }}>
					{selectedOfferIds.length > 0 && (
						<div className="flex items-center justify-between mb-3">
							<span className="text-sm" style={{ color: "#7A8A9A" }}>
								{selectedOfferIds.length} selected · ${selectedValue}
							</span>
							<span className="text-sm font-semibold" style={{ color: diff >= 0 ? "#00CDB8" : "#FF3A5C" }}>
								{diff >= 0 ? "+" : "-"}${Math.abs(diff)}
							</span>
						</div>
					)}
					{sendOfferError && <p className="text-xs text-center mb-3" style={{ color: "#FF3A5C" }}>{sendOfferError}</p>}
					<button
						onClick={handleSendOffer}
						disabled={selectedOfferIds.length === 0 || isSendingOffer}
						className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-70"
						style={{
							background: selectedOfferIds.length > 0 ? "linear-gradient(135deg, #00CDB8, #009988)" : "#111820",
							color: selectedOfferIds.length > 0 ? "#080C12" : "#4A5A6A",
						}}
					>
						{isSendingOffer ? "Sending..." : "Send offer"}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
			<div className="px-5 pt-12 pb-5 shrink-0">
				<div className="flex items-end justify-between mb-5">
					<h1 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Swaps</h1>
					<div className="flex rounded-2xl p-1" style={{ background: "#111820" }}>
						{(["active", "history"] as const).map((id) => (
							<button
								key={id}
								onClick={() => setFilter(id)}
								className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
								style={{ background: filter === id ? "#00CDB8" : "transparent", color: filter === id ? "#080C12" : "#7A8A9A" }}
							>
								{id === "active" ? "Active" : "History"}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
				{error && <p className="text-xs text-center" style={{ color: "#FF3A5C" }}>{error}</p>}
				{isLoading && !swaps && <p className="text-sm text-center py-12" style={{ color: "#7A8A9A" }}>Loading swaps...</p>}

				{shown.length === 0 && !isLoading && (
					<div className="flex flex-col items-center justify-center flex-1 gap-3 py-20" style={{ color: "#7A8A9A" }}>
						<RefreshCw size={32} style={{ color: "#1A2230" }} />
						<p className="text-sm">No {filter === "active" ? "active swaps" : "history"} yet</p>
					</div>
				)}

				{shown.map((swap) => {
					const status = displayStatus(swap, user.id);
					const meta = STATUS_META[status];
					const isOwner = swap.owner_id === user.id;
					const needsOwnerOffer = swap.status === "pending" && isOwner;
					const isActionable = status === "offer-received";
					const canConfirmReceived = swap.status === "accepted" && swap.requester_id === user.id;
					const isCompleted = status === "completed";
					const alreadyRated = rated.includes(swap.id);
					const offeredSummary = summarizeItems(swap.offered_items, "Waiting for offer");
					const offeredTotal = swap.offered_items.reduce((sum, item) => sum + item.estimated_value, 0);
					const valueDiff = offeredTotal - swap.wanted_item.estimated_value;
					const wantedItem = toDisplayItem(swap.wanted_item);
					const yourItem = isOwner ? wantedItem : offeredSummary;
					const theirItem = isOwner ? offeredSummary : wantedItem;
					const showOfferDetails = swap.offered_items.length > 0 && (isActionable || swap.status === "accepted" || isCompleted);

					return (
						<div
							key={swap.id}
							className="rounded-2xl p-4"
							style={{
								background: "#111820",
								border: isActionable
									? "1.5px solid rgba(0,205,184,0.25)"
									: "1.5px solid rgba(255,255,255,0.06)",
							}}
						>
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2 min-w-0">
									<div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A2230", color: "#00CDB8" }}>
										{swap.partner.username.charAt(0).toUpperCase()}
									</div>
									<span className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{swap.partner.username}</span>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<span className="text-xs" style={{ color: "#7A8A9A" }}>{formatSwapTime(swap.updated_at)}</span>
									<div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
										{meta.icon}
										<span className="text-[10px] font-semibold">{meta.label}</span>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 flex-1 min-w-0">
									<div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
										{yourItem.image ? (
											<img src={yourItem.image} alt={yourItem.name} className="w-full h-full object-cover" />
										) : null}
									</div>
									<div className="min-w-0">
										<p className="text-xs truncate font-medium" style={{ color: "#7A8A9A" }}>You give</p>
										<p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{yourItem.name}</p>
										<p className="text-xs font-semibold" style={{ color: "#00CDB8" }}>${yourItem.value}</p>
									</div>
								</div>

								<div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A2230" }}>
									<RefreshCw size={13} style={{ color: "#7A8A9A" }} />
								</div>

								<div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
									<div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
										{theirItem.image ? (
											<img src={theirItem.image} alt={theirItem.name} className="w-full h-full object-cover" />
										) : null}
									</div>
									<div className="min-w-0 text-right">
										<p className="text-xs font-medium" style={{ color: "#7A8A9A" }}>You get</p>
										<p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{theirItem.name}</p>
										<p className="text-xs font-semibold" style={{ color: "#00CDB8" }}>${theirItem.value}</p>
									</div>
								</div>
							</div>

							{showOfferDetails && (
								<div
									className="mt-3 pt-3"
									style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
											Offer details
										</span>
										<span className="text-xs font-bold" style={{ color: valueDiff >= 0 ? "#00CDB8" : "#FF3A5C" }}>
											{valueDiff >= 0 ? "+" : "-"}{money(Math.abs(valueDiff))}
										</span>
									</div>

									<div className="rounded-2xl overflow-hidden" style={{ background: "#0B1118", border: "1px solid rgba(255,255,255,0.05)" }}>
										<div className="flex items-center gap-3 p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
											<div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
												{swap.wanted_item.image_url && (
													<img src={swap.wanted_item.image_url} alt={swap.wanted_item.title} className="w-full h-full object-cover" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
													Requested item
												</p>
												<p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{swap.wanted_item.title}</p>
											</div>
											<span className="text-sm font-bold shrink-0" style={{ color: "#00CDB8" }}>
												{money(swap.wanted_item.estimated_value)}
											</span>
										</div>

										<div className="p-3 flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
													Selected items ({swap.offered_items.length})
												</p>
												<span className="text-xs font-bold" style={{ color: "#EEF2F7" }}>{money(offeredTotal)}</span>
											</div>

											{swap.offered_items.map((item) => (
												<div key={item.id} className="flex items-center gap-3">
													<div className="w-9 h-9 rounded-lg overflow-hidden shrink-0" style={{ background: "#1A2230" }}>
														{item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
													</div>
													<p className="text-sm font-medium truncate flex-1" style={{ color: "#EEF2F7" }}>{item.title}</p>
													<span className="text-sm font-semibold shrink-0" style={{ color: "#7A8A9A" }}>{money(item.estimated_value)}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{isActionable && (
								<div className="grid grid-cols-2 gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,205,184,0.15)" }}>
									<button
										onClick={() => setSwapStatus(swap.id, "declined")}
										className="py-2 rounded-xl font-semibold text-sm"
										style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C" }}
									>
										Decline
									</button>
									<button
										onClick={() => setSwapStatus(swap.id, "accepted")}
										className="flex items-center justify-center gap-1 py-2 rounded-xl font-semibold text-sm"
										style={{ background: "rgba(0,205,184,0.15)", color: "#00CDB8" }}
									>
										Accept <ChevronRight size={15} />
									</button>
								</div>
							)}

							{canConfirmReceived && (
								<button
									onClick={() => setSwapStatus(swap.id, "completed")}
									className="flex w-full items-center justify-center gap-1.5 mt-3 pt-3 font-semibold text-sm"
									style={{ borderTop: "1px solid rgba(56,189,248,0.18)", color: "#38BDF8" }}
								>
									Confirm received <CheckCircle size={15} />
								</button>
							)}

							{needsOwnerOffer && (
								<button
									onClick={() => setPickingSwap(swap)}
									className="flex w-full items-center justify-center gap-1.5 mt-3 pt-3 font-semibold text-sm"
									style={{ borderTop: "1px solid rgba(0,205,184,0.15)", color: "#00CDB8" }}
								>
									Pick items to request <ChevronRight size={15} />
								</button>
							)}

							{isCompleted && !alreadyRated && (
								<button
									onClick={() => {
										setRated((prev) => [...prev, swap.id]);
										onRate?.(swap);
									}}
									className="flex w-full items-center justify-center gap-2 mt-3 pt-3 font-semibold text-sm transition-all active:scale-95"
									style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#FFD166" }}
								>
									<Star size={14} className="fill-current" />
									Rate this swap
								</button>
							)}

							{isCompleted && alreadyRated && (
								<div className="flex w-full items-center justify-center gap-2 mt-3 pt-3 text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#4A5A6A" }}>
									<CheckCircle size={13} />
									Rated
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
