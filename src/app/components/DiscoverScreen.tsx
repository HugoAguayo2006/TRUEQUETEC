import { useState, useRef } from "react";
import { X, Heart } from "lucide-react";
import React from "react";

const ITEMS = [
	{
		id: 1,
		name: "Cámara analógica Leica M6",
		value: 180,
		condition: "Buen estado",
		owner: "Alex M.",
		ownerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
		image: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=600&h=900&fit=crop",
		category: "Fotografía",
		description: "Telémetro clásico en excelente funcionamiento. Incluye correa de piel y lente de 50 mm.",
		tags: ["Vintage", "Analógica"],
	},
	{
		id: 2,
		name: "Audífonos Bose QC45",
		value: 150,
		condition: "Como nuevo",
		owner: "Sara K.",
		ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
		image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=900&fit=crop",
		category: "Audio",
		description: "Usados solo dos veces. Incluye estuche original, cables y documentación.",
		tags: ["Inalámbrico", "Premium"],
	},
	{
		id: 3,
		name: "Bolso mensajero de piel",
		value: 95,
		condition: "Muy buen estado",
		owner: "Tom R.",
		ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
		image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=900&fit=crop",
		category: "Moda",
		description: "Piel de grano completo. Cabe una laptop de 15 pulgadas. Herrajes de latón.",
		tags: ["Piel", "Diario"],
	},
	{
		id: 4,
		name: "HHKB Pro Hybrid",
		value: 210,
		condition: "Como nuevo",
		owner: "Ji-Ho L.",
		ownerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
		image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=900&fit=crop",
		category: "Tecnología",
		description: "Switches Topre de 45 g. Bluetooth + USB-C. Casi sin uso.",
		tags: ["Mecánico", "Inalámbrico"],
	},
];

interface Props {
	onSwipeRight: (item: typeof ITEMS[0]) => void;
}

export default function DiscoverScreen({ onSwipeRight }: Props) {
	const [currentIdx, setCurrentIdx] = useState(0);
	const [dragX, setDragX] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [exiting, setExiting] = useState<"left" | "right" | null>(null);
	const dragStartX = useRef(0);

	const item = ITEMS[currentIdx];
	const nextItem = ITEMS[currentIdx + 1];

	const rotation = dragX * 0.06;
	const wantOpacity = Math.min(Math.max(dragX / 90, 0), 1);
	const passOpacity = Math.min(Math.max(-dragX / 90, 0), 1);

	function onDragStart(x: number) {
		setIsDragging(true);
		dragStartX.current = x;
	}
	function onDragMove(x: number) {
		if (!isDragging) return;
		setDragX(x - dragStartX.current);
	}
	function onDragEnd() {
		if (!isDragging) return;
		setIsDragging(false);
		if (dragX > 90) triggerLike();
		else if (dragX < -90) triggerPass();
		else setDragX(0);
	}

	function triggerLike() {
		setExiting("right");
		setTimeout(() => {
			onSwipeRight(item);
			setDragX(0);
			setExiting(null);
			setCurrentIdx((i) => i + 1);
		}, 280);
	}

	function triggerPass() {
		setExiting("left");
		setTimeout(() => {
			setDragX(0);
			setExiting(null);
			setCurrentIdx((i) => i + 1);
		}, 280);
	}

	if (!item) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-3" style={{ background: "#080C12" }}>
				<span style={{ fontSize: 40 }}>✨</span>
				<p className="font-bold" style={{ color: "#EEF2F7" }}>Ya viste todo</p>
				<p className="text-sm" style={{ color: "#7A8A9A" }}>Vuelve más tarde para ver nuevos artículos</p>
			</div>
		);
	}

	const cardStyle = exiting
		? {
			transform: `translateX(${exiting === "right" ? 500 : -500}px) rotate(${exiting === "right" ? 20 : -20}deg)`,
			transition: "transform 0.28s ease-in",
			opacity: 0,
		}
		: {
			transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
			transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
		};

	return (
		<div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
			<div className="flex items-center justify-between px-5 pt-12 pb-4 shrink-0">
				<div className="flex flex-col items-center">
					<span className="text-lg font-extrabold tracking-tight" style={{ color: "#EEF2F7" }}>Swaply</span>
				</div>
			</div>

			<div className="flex-1 relative mx-4 mb-3" style={{ minHeight: 0 }}>
				{nextItem && (
					<div
						className="absolute inset-0 rounded-3xl overflow-hidden"
						style={{ transform: "scale(0.93) translateY(14px)", zIndex: 0 }}
					>
						<img src={nextItem.image} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.4)" }} />
					</div>
				)}

				<div
					className="absolute inset-0 rounded-3xl overflow-hidden"
					style={{ ...cardStyle, zIndex: 1, cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
					onMouseDown={(e) => onDragStart(e.clientX)}
					onMouseMove={(e) => onDragMove(e.clientX)}
					onMouseUp={onDragEnd}
					onMouseLeave={onDragEnd}
					onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
					onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
					onTouchEnd={onDragEnd}
				>
					<img src={item.image} alt={item.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />

					{/* Gradient */}
					<div
						className="absolute inset-0"
						style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }}
					/>

					{/* WANT stamp */}
					<div
						className="absolute top-16 left-6 px-3 py-1 rounded-xl"
						style={{
							opacity: wantOpacity,
							border: "2.5px solid #00CDB8",
							transform: "rotate(-12deg)",
						}}
					>
						<span className="font-black text-xl tracking-widest" style={{ color: "#00CDB8" }}>QUIERO</span>
					</div>

					{/* PASS stamp */}
					<div
						className="absolute top-16 right-6 px-3 py-1 rounded-xl"
						style={{
							opacity: passOpacity,
							border: "2.5px solid #FF3A5C",
							transform: "rotate(12deg)",
						}}
					>
						<span className="font-black text-xl tracking-widest" style={{ color: "#FF3A5C" }}>PASAR</span>
					</div>

					{/* Card info */}
					<div className="absolute bottom-0 left-0 right-0 p-5">
						<div className="flex gap-1.5 mb-3">
							{item.tags.map((tag) => (
								<span
									key={tag}
									className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
									style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }}
								>
									{tag}
								</span>
							))}
						</div>

						<div className="flex items-end justify-between">
							<div>
								<h2 className="text-white text-[22px] font-bold leading-tight mb-1">{item.name}</h2>
								<div className="flex items-center gap-2">
									<img src={item.ownerAvatar} alt={item.owner} className="w-5 h-5 rounded-full object-cover" style={{ border: "1px solid rgba(255,255,255,0.3)" }} />
									<span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{item.owner}</span>
									<span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
									<span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{item.category}</span>
								</div>
							</div>
							<div className="text-right">
								<span className="text-xl font-extrabold" style={{ color: "#00CDB8" }}>${item.value}</span>
								<p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{item.condition}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Buttons */}
			<div className="flex items-center justify-center gap-5 pb-6 pt-2 shrink-0">
				<button
					onMouseDown={(e) => e.stopPropagation()}
					onClick={triggerPass}
					className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-all active:scale-90"
					style={{ background: "#111820", border: "1.5px solid rgba(255,58,92,0.2)" }}
				>
					<X size={24} style={{ color: "#FF3A5C" }} />
				</button>

				<button
					onMouseDown={(e) => e.stopPropagation()}
					onClick={triggerLike}
					className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg"
					style={{ background: "linear-gradient(135deg, #00CDB8, #009988)", boxShadow: "0 8px 24px rgba(0,205,184,0.3)" }}
				>
					<Heart size={26} className="fill-white text-white" />
				</button>
			</div>
		</div>
	);
}
