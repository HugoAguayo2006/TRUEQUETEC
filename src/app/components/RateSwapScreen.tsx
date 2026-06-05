import { useState } from "react";
import { Star, ArrowLeft, Send } from "lucide-react";
import React from "react";

const QUICK_TAGS = [
	"Accurate description",
	"Great communicator",
	"Fast response",
	"Item as expected",
	"Would swap again",
	"Easy meetup",
];

interface Props {
	partner: { name: string; avatar: string };
	yourItem: { name: string; image: string };
	theirItems: { name: string; image: string }[];
	onSubmit: (rating: number, note: string) => void;
	onSkip: () => void;
}

export default function RateSwapScreen({ partner, yourItem, theirItems, onSubmit, onSkip }: Props) {
	const [hovered, setHovered] = useState(0);
	const [selected, setSelected] = useState(0);
	const [tags, setTags] = useState<string[]>([]);
	const [note, setNote] = useState("");
	const [submitted, setSubmitted] = useState(false);

	function toggleTag(tag: string) {
		setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
	}

	function handleSubmit() {
		if (selected === 0) return;
		setSubmitted(true);
		const reviewNote = [note.trim(), tags.length ? `Tags: ${tags.join(", ")}` : ""].filter(Boolean).join("\n");
		setTimeout(() => onSubmit(selected, reviewNote), 1200);
	}

	const display = hovered || selected;

	const LABELS: Record<number, { text: string; color: string }> = {
		1: { text: "Poor", color: "#FF3A5C" },
		2: { text: "Fair", color: "#FF8C42" },
		3: { text: "Good", color: "#FFD166" },
		4: { text: "Great", color: "#7EC8A4" },
		5: { text: "Excellent", color: "#00CDB8" },
	};

	if (submitted) {
		return (
			<div
				className="flex flex-col items-center justify-center h-full gap-4 px-8"
				style={{ background: "#080C12", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
			>
				<div
					className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
					style={{ background: "linear-gradient(135deg, #00CDB8, #009988)", boxShadow: "0 12px 32px rgba(0,205,184,0.3)" }}
				>
					<Star size={36} className="fill-white text-white" />
				</div>
				<h2 className="text-2xl font-extrabold text-center" style={{ color: "#EEF2F7" }}>Thanks for rating!</h2>
				<p className="text-sm text-center" style={{ color: "#7A8A9A" }}>
					Your review helps build trust in the Swaply community.
				</p>
			</div>
		);
	}

	return (
		<div
			className="flex flex-col h-full"
			style={{ background: "#080C12", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
		>
			<div className="px-5 pt-12 pb-5 shrink-0">
				<button
					onClick={onSkip}
					className="w-9 h-9 rounded-full flex items-center justify-center mb-5"
					style={{ background: "#111820" }}
				>
					<ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
				</button>
				<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>
					Swap complete
				</p>
				<h1 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>
					Rate your experience
				</h1>
			</div>

			<div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
				<div
					className="rounded-2xl p-4 flex items-center gap-4"
					style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
				>
					{partner.avatar ? (
						<img
							src={partner.avatar}
							alt={partner.name}
							className="w-12 h-12 rounded-full object-cover shrink-0"
							style={{ border: "2px solid rgba(0,205,184,0.25)" }}
						/>
					) : (
						<div
							className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold"
							style={{ background: "#1A2230", color: "#00CDB8", border: "2px solid rgba(0,205,184,0.25)" }}
						>
							{partner.name.charAt(0).toUpperCase()}
						</div>
					)}
					<div className="flex-1 min-w-0">
						<p className="font-bold text-sm" style={{ color: "#EEF2F7" }}>{partner.name}</p>
						<div className="flex items-center gap-2 mt-1">
							<div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
								{yourItem.image ? (
									<img src={yourItem.image} alt={yourItem.name} className="w-full h-full object-cover" />
								) : null}
							</div>
							<span style={{ color: "#7A8A9A", fontSize: 13 }}>⇄</span>
							{theirItems.slice(0, 2).map((item, i) => (
								<div key={i} className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
									{item.image ? (
										<img src={item.image} alt={item.name} className="w-full h-full object-cover" />
									) : null}
								</div>
							))}
							{theirItems.length > 2 && (
								<span className="text-xs" style={{ color: "#7A8A9A" }}>+{theirItems.length - 2}</span>
							)}
						</div>
					</div>
				</div>

				{/* Stars */}
				<div
					className="rounded-2xl p-5 flex flex-col items-center gap-4"
					style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
				>
					<p className="text-sm font-semibold" style={{ color: "#7A8A9A" }}>
						How was your swap with {partner.name.split(" ")[0]}?
					</p>

					<div className="flex gap-3">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								onMouseEnter={() => setHovered(star)}
								onMouseLeave={() => setHovered(0)}
								onClick={() => setSelected(star)}
								className="transition-all active:scale-90"
								style={{ transform: display >= star ? "scale(1.15)" : "scale(1)" }}
							>
								<Star
									size={38}
									style={{
										color: display >= star ? "#FFD166" : "#1A2230",
										fill: display >= star ? "#FFD166" : "#1A2230",
										filter: display >= star ? "drop-shadow(0 2px 8px rgba(255,209,102,0.4))" : "none",
										transition: "all 0.15s ease",
									}}
								/>
							</button>
						))}
					</div>

					{display > 0 && (
						<div
							className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
							style={{
								background: `${LABELS[display].color}18`,
								color: LABELS[display].color,
							}}
						>
							{LABELS[display].text}
						</div>
					)}
				</div>

				{/* Quick tags */}
				{selected > 0 && (
					<div
						className="rounded-2xl p-4"
						style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
					>
						<p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#7A8A9A" }}>
							What stood out? (optional)
						</p>
						<div className="flex flex-wrap gap-2">
							{QUICK_TAGS.map((tag) => {
								const active = tags.includes(tag);
								return (
									<button
										key={tag}
										onClick={() => toggleTag(tag)}
										className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
										style={{
											background: active ? "rgba(0,205,184,0.12)" : "#1A2230",
											color: active ? "#00CDB8" : "#7A8A9A",
											border: active ? "1.5px solid rgba(0,205,184,0.35)" : "1.5px solid transparent",
										}}
									>
										{active ? "✓ " : ""}{tag}
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Written review */}
				{selected > 0 && (
					<div
						className="rounded-2xl p-4"
						style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
					>
						<p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#7A8A9A" }}>
							Leave a note (optional)
						</p>
						<textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder={`Tell others about swapping with ${partner.name.split(" ")[0]}…`}
							rows={3}
							className="w-full text-sm rounded-xl px-4 py-3 resize-none outline-none transition-colors"
							style={{
								background: "#1A2230",
								color: "#EEF2F7",
								border: "1.5px solid rgba(255,255,255,0.06)",
								fontFamily: "inherit",
							}}
						/>
						<p className="text-right text-xs mt-1.5" style={{ color: "#4A5A6A" }}>{note.length}/200</p>
					</div>
				)}
			</div>

			{/* Footer */}
			<div
				className="shrink-0 px-5 pb-8 pt-3 flex flex-col gap-2"
				style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
			>
				<button
					onClick={handleSubmit}
					disabled={selected === 0}
					className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
					style={{
						background: selected > 0
							? "linear-gradient(135deg, #00CDB8, #009988)"
							: "#111820",
						color: selected > 0 ? "#080C12" : "#4A5A6A",
						boxShadow: selected > 0 ? "0 8px 24px rgba(0,205,184,0.2)" : "none",
					}}
				>
					<Send size={16} />
					Submit Rating
				</button>
				<button
					onClick={onSkip}
					className="w-full py-3 text-sm font-medium"
					style={{ color: "#4A5A6A" }}
				>
					Skip for now
				</button>
			</div>
		</div>
	);
}
