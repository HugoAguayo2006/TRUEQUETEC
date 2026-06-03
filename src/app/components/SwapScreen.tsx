import { useState } from "react";
import { RefreshCw, Clock, CheckCircle, XCircle, ChevronRight, Plus, Star } from "lucide-react";
import React from "react";

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
		updatedAt: "Just now",
		yourItem: {
			name: "Leica M6 Camera",
			image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=200&h=200&fit=crop",
			value: 180,
		},
		theirItem: {
			name: "Polaroid Now + Turntable",
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
		updatedAt: "2h ago",
		yourItem: {
			name: "HHKB Keyboard",
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
		updatedAt: "3 days ago",
		yourItem: {
			name: "Arc'teryx Jacket",
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
		updatedAt: "1 week ago",
		yourItem: {
			name: "DJI Mini 2 Drone",
			image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=200&h=200&fit=crop",
			value: 280,
		},
		theirItem: {
			name: "Analog Wristwatch",
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
	onRate?: (swap: Swap) => void;
}

export default function SwapsScreen({ onRate }: Props) {
	const [filter, setFilter] = useState<"active" | "history">("active");
	const [rated, setRated] = useState<number[]>([]);

	const active = SWAPS.filter((s) => s.status === "offer-received" || s.status === "awaiting" || s.status === "pending");
	const history = SWAPS.filter((s) => s.status === "completed" || s.status === "declined");
	const shown = filter === "active" ? active : history;

	return (
		<div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
			{/* Header */}
			<div className="px-5 pt-12 pb-5 shrink-0">
				<div className="flex items-end justify-between mb-5">
					<div>
						<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Your trades</p>
						<h1 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Swaps</h1>
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
							{f === "active" ? `Active (${active.length})` : "History"}
						</button>
					))}
				</div>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
				{shown.length === 0 && (
					<div className="flex flex-col items-center justify-center flex-1 gap-3 py-20" style={{ color: "#7A8A9A" }}>
						<RefreshCw size={32} style={{ color: "#1A2230" }} />
						<p className="text-sm">No {filter === "active" ? "active swaps" : "history"} yet</p>
					</div>
				)}

				{shown.map((swap) => {
					const meta = STATUS_META[swap.status];
					const isActionable = swap.status === "offer-received";
					const isCompleted = swap.status === "completed";
					const alreadyRated = rated.includes(swap.id);

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
										<p className="text-xs truncate font-medium" style={{ color: "#7A8A9A" }}>You gave</p>
										<p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{swap.yourItem.name}</p>
										<p className="text-xs font-semibold" style={{ color: "#00CDB8" }}>${swap.yourItem.value}</p>
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
										<p className="text-xs font-medium" style={{ color: "#7A8A9A" }}>You got</p>
										<p className="text-sm font-semibold truncate" style={{ color: "#EEF2F7" }}>{swap.theirItem.name}</p>
										<p className="text-xs font-semibold" style={{ color: "#00CDB8" }}>${swap.theirItem.value}</p>
									</div>
								</div>
							</div>

							{/* CTA row */}
							{isActionable && (
								<button
									className="flex w-full items-center justify-center gap-1.5 mt-3 pt-3 font-semibold text-sm"
									style={{ borderTop: "1px solid rgba(0,205,184,0.15)", color: "#00CDB8" }}
								>
									Review offer <ChevronRight size={15} />
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
								<div
									className="flex w-full items-center justify-center gap-2 mt-3 pt-3 text-sm"
									style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#4A5A6A" }}
								>
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
