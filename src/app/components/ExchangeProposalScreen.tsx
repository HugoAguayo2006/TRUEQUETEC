import { useState } from "react";
import { ArrowLeft, Check, X, RefreshCw, Star, Shield, TrendingUp } from "lucide-react";
import React from "react";

interface Item {
	id: number;
	title: string;
	estimated_value: number;
	image_url: string;
}

interface Props {
	yourItem: { name: string; value: number; image: string };
	offeredItems: Item[];
	proposer: { name: string; avatar: string; rating: number; swaps: number };
	onAccept: () => void;
	onReject: () => void;
	onCounter: () => void;
	onBack: () => void;
}

export default function ExchangeProposalScreen({
	yourItem,
	offeredItems,
	proposer,
	onAccept,
	onReject,
	onCounter,
	onBack,
}: Props) {
	const [tab, setTab] = useState<"offer" | "profile">("offer");

	const totalOffered = offeredItems.reduce((acc, i) => acc + i.estimated_value, 0);
	const diff = totalOffered - yourItem.value;
	const isFavorable = diff >= -10;

	return (
		<div className="flex flex-col h-full bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
			{/* Header */}
			<div className="px-5 pt-12 pb-4 shrink-0">
				<button onClick={onBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mb-4">
					<ArrowLeft size={18} className="text-foreground" />
				</button>

				{/* Status badge */}
				<div className="flex items-center gap-2 mb-2">
					<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
					<span className="text-primary text-xs font-semibold tracking-widest uppercase">Nueva oferta de trueque</span>
				</div>
				<h1 className="text-foreground text-2xl font-bold leading-tight">
					Revisa la <span className="text-primary italic">propuesta</span>
				</h1>

				{/* Proposer */}
				<div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-secondary">
					<img src={proposer.avatar} alt={proposer.name} className="w-10 h-10 rounded-full object-cover" />
					<div className="flex-1">
						<div className="flex items-center gap-1.5">
							<span className="text-foreground font-semibold text-sm">{proposer.name}</span>
							<Shield size={12} className="text-primary" />
						</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1">
								<Star size={11} className="text-yellow-400 fill-yellow-400" />
								<span className="text-muted-foreground text-xs">{proposer.rating}</span>
							</div>
							<span className="text-muted-foreground text-xs">{proposer.swaps} trueques</span>
						</div>
					</div>
					<span className="text-muted-foreground text-xs">Hace 15 min</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 mx-5 mb-4 p-1 rounded-xl bg-secondary shrink-0">
				{(["offer", "profile"] as const).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-card text-foreground shadow" : "text-muted-foreground"
							}`}
					>
						{t === "offer" ? "La oferta" : "Su perfil"}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto px-5 pb-4">
				{tab === "offer" ? (
					<div className="flex flex-col gap-4">
						{/* The swap visualization */}
						<div className="rounded-2xl overflow-hidden bg-card border border-border">
							{/* Your item */}
							<div className="flex items-center gap-3 p-4">
								<div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
									<img src={yourItem.image} alt={yourItem.name} className="w-full h-full object-cover" />
								</div>
								<div className="flex-1">
									<span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Das</span>
									<p className="text-foreground font-semibold text-sm">{yourItem.name}</p>
									<span className="text-primary text-xs font-semibold">${yourItem.value}</span>
								</div>
							</div>

							{/* Divider with swap icon */}
							<div className="flex items-center gap-3 px-4 py-2 border-t border-b border-border bg-secondary/50">
								<div className="flex-1 h-px bg-border" />
								<div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
									<RefreshCw size={13} className="text-primary" />
								</div>
								<div className="flex-1 h-px bg-border" />
							</div>

							{/* Offered items */}
							<div className="p-4 flex flex-col gap-3">
								<span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
									{proposer.name.split(" ")[0]} ofrece ({offeredItems.length} {offeredItems.length > 1 ? "artículos" : "artículo"})
								</span>
								{offeredItems.map((item) => (
									<div key={item.id} className="flex items-center gap-3">
										<div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
											<img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
										</div>
										<div className="flex-1">
											<p className="text-foreground font-semibold text-sm">{item.title}</p>
											<span className="text-muted-foreground text-xs">{item.condition}</span>
										</div>
										<span className="text-primary text-sm font-bold">${item.estimated_value}</span>
									</div>
								))}
							</div>
						</div>

						{/* Value analysis */}
						<div
							className="rounded-2xl p-4 border"
							style={{
								background: isFavorable ? "rgba(0, 205, 184, 0.06)" : "rgba(255, 60, 92, 0.06)",
								borderColor: isFavorable ? "rgba(0, 205, 184, 0.2)" : "rgba(255, 60, 92, 0.2)",
							}}
						>
							<div className="flex items-center gap-2 mb-3">
								<TrendingUp size={16} className={isFavorable ? "text-primary" : "text-destructive"} />
								<span className="text-xs font-semibold uppercase tracking-wider" style={{ color: isFavorable ? "#00CDB8" : "#FF3A5C" }}>
									Análisis de valor
								</span>
							</div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-muted-foreground text-sm">Tu artículo</span>
								<span className="text-foreground font-semibold">${yourItem.value}</span>
							</div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-muted-foreground text-sm">Su oferta</span>
								<span className="text-foreground font-semibold">${totalOffered}</span>
							</div>
							<div className="h-px bg-border mb-3" />
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold" style={{ color: isFavorable ? "#00CDB8" : "#FF3A5C" }}>
									{isFavorable ? "Ganas" : "Pierdes"}
								</span>
								<span className="font-bold text-lg" style={{ color: isFavorable ? "#00CDB8" : "#FF3A5C" }}>
									{diff >= 0 ? "+" : ""}${diff}
								</span>
							</div>
							{isFavorable && (
								<p className="text-muted-foreground text-xs mt-2">
									Este trueque te favorece: sales ganando ${diff}.
								</p>
							)}
						</div>

						{/* Message */}
						<div className="rounded-2xl p-4 bg-card border border-border">
							<div className="flex items-center gap-2 mb-2">
								<img src={proposer.avatar} alt={proposer.name} className="w-5 h-5 rounded-full object-cover" />
								<span className="text-muted-foreground text-xs">Nota de {proposer.name}</span>
							</div>
							<p className="text-foreground/80 text-sm italic leading-relaxed">
								"¡Hola! Llevo tiempo buscando esto. Ambos artículos están en gran estado y creo que es un trueque justo. ¡Me dices!"
							</p>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						<div className="rounded-2xl p-5 bg-card border border-border flex flex-col items-center text-center">
							<img src={proposer.avatar} alt={proposer.name} className="w-20 h-20 rounded-full object-cover border-4 border-primary/30 mb-3" />
							<h3 className="text-foreground font-bold text-lg">{proposer.name}</h3>
							<p className="text-muted-foreground text-sm">Miembro desde 2023</p>
							<div className="flex items-center gap-1 mt-1">
								{[1, 2, 3, 4, 5].map((s) => (
									<Star key={s} size={14} className={s <= Math.floor(proposer.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"} />
								))}
								<span className="text-muted-foreground text-xs ml-1">({proposer.rating})</span>
							</div>
							<div className="grid grid-cols-3 gap-4 mt-5 w-full">
								{[
									{ label: "Trueques", value: proposer.swaps },
									{ label: "Calificación", value: proposer.rating },
									{ label: "Respuesta", value: "< 1 h" },
								].map((stat) => (
									<div key={stat.label} className="flex flex-col items-center p-3 rounded-xl bg-secondary">
										<span className="text-foreground font-bold text-lg">{stat.value}</span>
										<span className="text-muted-foreground text-xs">{stat.label}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Action buttons */}
			<div className="shrink-0 px-5 pb-8 pt-3 border-t border-border bg-background flex flex-col gap-3">
				<div className="flex gap-3">
					<button
						onClick={onReject}
						className="flex-1 py-3.5 rounded-2xl border-2 border-border flex items-center justify-center gap-2 font-semibold text-sm text-muted-foreground active:scale-95 transition-all"
					>
						<X size={16} className="text-destructive" />
						Rechazar
					</button>
					<button
						onClick={onCounter}
						className="flex-1 py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-semibold text-sm active:scale-95 transition-all"
						style={{ borderColor: "#00CDB8", color: "#00CDB8" }}
					>
						<RefreshCw size={16} />
						Contraoferta
					</button>
				</div>
				<button
					onClick={onAccept}
					className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
					style={{ background: "linear-gradient(135deg, #00CDB8, #00A896)", color: "#080C12" }}
				>
					<Check size={18} />
					Aceptar trueque
				</button>
			</div>
		</div>
	);
}
