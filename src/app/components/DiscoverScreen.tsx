import { useState, useRef, useEffect } from "react";
import { X, Heart } from "lucide-react";
import React from "react";
import { api, ItemResponseData, SwapResponseData, UserResponseData } from "../../services/endpoints";
import { useApi } from "../../hooks/use_api";
import { useAuth } from "../../context/AuthContext";
import ProductPrice from "./ProductPrice";

interface Props {
	isActive?: boolean;
	currentIndex?: number;
	onIndexChange?: (index: number) => void;
	onSwapRequested?: (swap: SwapResponseData) => void;
	onViewOwner?: (userId: string) => void;
}

export default function DiscoverScreen({ isActive = false, currentIndex = 0, onIndexChange, onSwapRequested, onViewOwner }: Props) {
	const [dragX, setDragX] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [exiting, setExiting] = useState<"left" | "right" | null>(null);
	const [owner, setOwner] = useState<UserResponseData | null>(null);
	const dragStartX = useRef(0);

	const { user } = useAuth();
	const { execute, isLoading, data: items, error } = useApi<ItemResponseData[]>();
	const { execute: createSwap, isLoading: isCreatingSwap } = useApi<SwapResponseData>();
	const fetch_items = React.useCallback(() => {
		if (user?.id) execute(() => api.getItems(user.id));
	}, [execute, user?.id]);
	const currentItem = items?.[currentIndex] || null;

	function setCurrentIndex(nextIndex: number | ((currentIndex: number) => number)) {
		const resolvedIndex = typeof nextIndex === "function" ? nextIndex(currentIndex) : nextIndex;
		onIndexChange?.(resolvedIndex);
	}

	useEffect(() => { fetch_items(); }, [fetch_items])

	useEffect(() => {
		if (isActive) {
			fetch_items();
		}
	}, [fetch_items, isActive]);

	useEffect(() => {
		let cancelled = false;
		if (!currentItem?.owner_id) {
			setOwner(null);
			return;
		}

		api.getUser(currentItem.owner_id)
			.then((ownerData) => {
				if (!cancelled) setOwner(ownerData);
			})
			.catch(() => {
				if (!cancelled) setOwner(null);
			});

		return () => {
			cancelled = true;
		};
	}, [currentItem?.owner_id]);

	if (!user) return null;

	if (isLoading && !items) {
		return (
			<div className="flex h-full items-center justify-center" style={{ background: "#080C12", color: "#7A8A9A" }}>
				Cargando artículos...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center px-6 text-center" style={{ background: "#080C12", color: "#FF3A5C" }}>
				{error}
			</div>
		);
	}

	if (!items?.length || currentIndex >= items.length) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "#080C12" }}>
				<Heart size={32} style={{ color: "#1A2230" }} />
				<p className="text-sm" style={{ color: "#7A8A9A" }}>No hay más artículos por descubrir por ahora</p>
			</div>
		);
	}

	const item = currentItem;
	const nextItem = items[currentIndex + 1];

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


	async function triggerLike() {
		if (isCreatingSwap) return;
		setExiting("right");
		try {
			const swap = await createSwap(() => api.createSwap(user.id, item.id));
			setTimeout(() => {
				onSwapRequested?.(swap);
				setDragX(0);
				setExiting(null);
				setCurrentIndex((i) => i + 1);
			}, 280);
		} catch {
			setDragX(0);
			setExiting(null);
		}
	}

	function triggerPass() {
		setExiting("left");
		setTimeout(() => {
			setDragX(0);
			setExiting(null);
			setCurrentIndex((i) => i + 1);
		}, 280);
	}

	function openOwnerProfile(e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) {
		e.stopPropagation();
		if (item.owner_id) {
			onViewOwner?.(item.owner_id);
		}
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
					<span className="text-lg font-extrabold tracking-tight" style={{ color: "#EEF2F7" }}>TRUEQUETEC</span>
				</div>
			</div>

			<div className="flex-1 relative mx-4 mb-3" style={{ minHeight: 0 }}>
				{nextItem && (
					<div
						className="absolute inset-0 rounded-3xl overflow-hidden"
						style={{ transform: "scale(0.93) translateY(14px)", zIndex: 0 }}
					>
						<img src={nextItem.image_url} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.4)" }} />
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
					<img src={item.image_url} alt={item.title} className="w-full h-full object-cover pointer-events-none" draggable={false} />

					<div
						className="absolute inset-0"
						style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }}
					/>

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

					<div className="absolute bottom-0 left-0 right-0 p-5">
						<div className="flex items-end justify-between">
							<div>
								<h2 className="text-white text-[22px] font-bold leading-tight mb-1">{item.title}</h2>
								<div className="flex items-center gap-2">
									<button
										onMouseDown={(e) => e.stopPropagation()}
										onTouchStart={(e) => e.stopPropagation()}
										onClick={openOwnerProfile}
										className="text-sm font-semibold text-left transition-colors cursor-pointer hover:underline focus-visible:underline outline-none"
										style={{ color: "rgba(255,255,255,0.72)" }}
									>
										Publicado por {owner?.username || "su dueño"}
									</button>
								</div>
							</div>
							<div className="text-right">
								<ProductPrice productName={item.title} userValue={item.estimated_value} align="right" variant="hero" />
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
					<X size={24} style={{ color: "#f62e50" }} />
				</button>

				<button
					onMouseDown={(e) => e.stopPropagation()}
					onClick={triggerLike}
					disabled={isCreatingSwap}
					className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg"
					style={{ background: "linear-gradient(135deg, #00CDB8, #009988)", boxShadow: "0 8px 24px rgba(0,205,184,0.3)" }}
				>
					<Heart size={26} className="fill-white text-white" />
				</button>
			</div>
		</div>
	);
}
