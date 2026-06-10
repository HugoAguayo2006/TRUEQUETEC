import { ArrowLeft, Package, Star, MessageSquareText } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, ItemResponseData, SwapRatingDetailResponseData, UserResponseData } from "../../services/endpoints";
import ProductPrice from "./ProductPrice";

interface Props {
	userId: string;
	onBack: () => void;
}

export default function PublicProfileScreen({ userId, onBack }: Props) {
	const [profile, setProfile] = useState<UserResponseData | null>(null);
	const [items, setItems] = useState<ItemResponseData[]>([]);
	const [reviews, setReviews] = useState<SwapRatingDetailResponseData[]>([]);
	const [tab, setTab] = useState<"items" | "reviews">("items");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadProfile = React.useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [userData, userItems, userReviews] = await Promise.all([
				api.getUser(userId),
				api.getUserItems(userId),
				api.getReceivedRatings(userId),
			]);
			setProfile(userData);
			setItems(userItems);
			setReviews(userReviews);
		} catch (err: any) {
			setError(err.message || "No se pudo cargar el perfil.");
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	return (
		<div className="flex h-full flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
			<header className="shrink-0 px-5 pt-12 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
				<button
					onClick={onBack}
					className="w-9 h-9 rounded-full flex items-center justify-center mb-5"
					style={{ background: "#111820", color: "#EEF2F7" }}
				>
					<ArrowLeft size={17} />
				</button>

				{isLoading && !profile ? (
					<p className="text-sm" style={{ color: "#7A8A9A" }}>Cargando perfil...</p>
				) : profile ? (
					<div>
						<div className="flex items-start gap-4">
							<div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-extrabold" style={{ background: "#111820", color: "#00CDB8" }}>
								{profile.username.charAt(0).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<h1 className="text-xl font-extrabold truncate" style={{ color: "#EEF2F7" }}>{profile.username}</h1>
								<div className="flex items-center gap-1.5 mt-1">
									<Star size={14} className="fill-yellow-400 text-yellow-400" />
									<span className="text-sm font-bold" style={{ color: "#EEF2F7" }}>{profile.rating}</span>
								</div>
							</div>
						</div>

						<p className="mt-4 text-sm leading-relaxed" style={{ color: "#AAB7C4" }}>
							{profile.bio || "Este usuario todavía no agregó una bio."}
						</p>

						<div className="grid grid-cols-2 gap-2 mt-5">
							<div className="py-3 rounded-2xl text-center" style={{ background: "#111820" }}>
								<p className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{items.length}</p>
								<p className="text-xs" style={{ color: "#7A8A9A" }}>Productos</p>
							</div>
							<div className="py-3 rounded-2xl text-center" style={{ background: "#111820" }}>
								<p className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{reviews.length}</p>
								<p className="text-xs" style={{ color: "#7A8A9A" }}>Reseñas</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2 mt-4">
							<button
								onClick={() => setTab("items")}
								className="rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
								style={{
									background: tab === "items" ? "rgba(0,205,184,0.14)" : "#111820",
									color: tab === "items" ? "#00CDB8" : "#7A8A9A",
									border: tab === "items" ? "1.5px solid rgba(0,205,184,0.3)" : "1.5px solid rgba(255,255,255,0.06)",
								}}
							>
								<Package size={15} />
								Productos
							</button>
							<button
								onClick={() => setTab("reviews")}
								className="rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
								style={{
									background: tab === "reviews" ? "rgba(0,205,184,0.14)" : "#111820",
									color: tab === "reviews" ? "#00CDB8" : "#7A8A9A",
									border: tab === "reviews" ? "1.5px solid rgba(0,205,184,0.3)" : "1.5px solid rgba(255,255,255,0.06)",
								}}
							>
								<MessageSquareText size={15} />
								Reseñas
							</button>
						</div>
					</div>
				) : null}
			</header>

			<main className="flex-1 overflow-y-auto px-5 py-4">
				{error && (
					<div className="rounded-2xl px-4 py-3 text-xs" style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C", border: "1px solid rgba(255,58,92,0.22)" }}>
						{error}
					</div>
				)}

				{tab === "items" && (
					<div className="flex flex-col gap-3 pb-8">
						{!isLoading && items.length === 0 && (
							<div className="flex h-40 flex-col items-center justify-center gap-2 text-center" style={{ color: "#7A8A9A" }}>
								<Package size={24} />
								<p className="text-sm">Este usuario no tiene productos publicados.</p>
							</div>
						)}

						{items.map((item) => (
							<article
								key={item.id}
								className="flex items-center gap-3 rounded-2xl p-3"
								style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
							>
								<div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: "#080C12" }}>
									{item.image_url ? (
										<img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
									) : null}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 min-w-0">
										<p className="text-sm font-bold truncate" style={{ color: "#EEF2F7" }}>{item.title}</p>
										<span
											className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
											style={{
												background: item.is_available ? "rgba(0,205,184,0.12)" : "rgba(56,189,248,0.12)",
												color: item.is_available ? "#00CDB8" : "#38BDF8",
											}}
										>
											{item.is_available ? "Disponible" : "En trueque"}
										</span>
									</div>
									<div className="mt-1">
										<ProductPrice productName={item.title} userValue={item.estimated_value} variant="inline" />
									</div>
								</div>
							</article>
						))}
					</div>
				)}

				{tab === "reviews" && (
					<div className="flex flex-col gap-3 pb-8">
						{!isLoading && reviews.length === 0 && (
							<div className="flex h-40 flex-col items-center justify-center gap-2 text-center" style={{ color: "#7A8A9A" }}>
								<MessageSquareText size={24} />
								<p className="text-sm">Todavía no tiene reseñas escritas.</p>
							</div>
						)}

						{reviews.map((review) => (
							<article
								key={review.id}
								className="rounded-2xl p-4"
								style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm font-bold truncate" style={{ color: "#EEF2F7" }}>{review.rater.username}</p>
										<p className="text-xs mt-0.5" style={{ color: "#7A8A9A" }}>
											{new Date(review.created_at).toLocaleDateString("es-MX")}
										</p>
									</div>
									<div className="flex items-center gap-1 shrink-0">
										<Star size={14} className="fill-yellow-400 text-yellow-400" />
										<span className="text-sm font-bold" style={{ color: "#EEF2F7" }}>{review.rating}</span>
									</div>
								</div>
								<p className="text-sm leading-relaxed mt-3 whitespace-pre-line" style={{ color: "#AAB7C4" }}>
									{review.note || "Sin comentario escrito."}
								</p>
							</article>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
