import { useEffect, useMemo, useState } from "react";
import { LogOut, MessageSquareText, RefreshCw, ShieldCheck, Star, Trash2 } from "lucide-react";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { api, ItemResponseData, SwapRatingDetailResponseData, UserResponseData } from "../../services/endpoints";
import ProductPrice from "./ProductPrice";

export default function AdminScreen() {
	const { user, logoutSession } = useAuth();
	const [items, setItems] = useState<ItemResponseData[]>([]);
	const [users, setUsers] = useState<UserResponseData[]>([]);
	const [ratings, setRatings] = useState<SwapRatingDetailResponseData[]>([]);
	const [view, setView] = useState<"items" | "reviews">("items");
	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ItemResponseData | null>(null);
	const [pendingReviewDelete, setPendingReviewDelete] = useState<SwapRatingDetailResponseData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [ratingsError, setRatingsError] = useState<string | null>(null);

	const usersById = useMemo(() => {
		return new Map(users.map((currentUser) => [currentUser.id, currentUser]));
	}, [users]);

	async function loadAdminData() {
		setIsLoading(true);
		setError(null);
		setRatingsError(null);
		try {
			const [allItems, allUsers] = await Promise.all([
				api.getAdminItems(),
				api.getUsers(),
			]);
			setItems(allItems);
			setUsers(allUsers);

			try {
				const allRatings = await api.getAllRatings();
				setRatings(allRatings);
			} catch (ratingsErr: any) {
				setRatings([]);
				setRatingsError(ratingsErr.message || "No se pudieron cargar las reseñas.");
			}
		} catch (err: any) {
			setError(err.message || "No se pudo cargar el panel de administración.");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleDeleteReview(review: SwapRatingDetailResponseData) {
		setDeletingId(review.id);
		setError(null);
		try {
			await api.deleteRating(review.id);
			setRatings((currentRatings) => currentRatings.filter((currentRating) => currentRating.id !== review.id));
			setPendingReviewDelete(null);
		} catch (err: any) {
			setError(err.message || "No se pudo borrar la reseña.");
		} finally {
			setDeletingId(null);
		}
	}

	useEffect(() => {
		loadAdminData();
	}, []);

	async function handleDelete(item: ItemResponseData) {
		setDeletingId(item.id);
		setError(null);
		try {
			await api.deleteItem(item.id);
			setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
			setPendingDelete(null);
		} catch (err: any) {
			setError(err.message || "No se pudo borrar la publicación.");
		} finally {
			setDeletingId(null);
		}
	}

	if (!user) return null;

	return (
		<div className="relative flex h-full flex-col overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
			<header className="shrink-0 px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,205,184,0.12)", color: "#00CDB8" }}>
							<ShieldCheck size={20} />
						</div>
						<div className="min-w-0">
							<p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#00CDB8" }}>Administrador</p>
							<h1 className="text-lg font-extrabold truncate" style={{ color: "#EEF2F7" }}>
								{view === "items" ? "Publicaciones" : "Reseñas"}
							</h1>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={loadAdminData}
							disabled={isLoading}
							className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
							style={{ background: "#111820", color: "#00CDB8", border: "1.5px solid rgba(0,205,184,0.18)" }}
							title="Actualizar"
						>
							<RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
						</button>
						<button
							onClick={logoutSession}
							className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
							style={{ background: "#111820", color: "#FF3A5C", border: "1.5px solid rgba(255,58,92,0.18)" }}
							title="Cerrar sesión"
						>
							<LogOut size={17} />
						</button>
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto px-5 py-4">
				<div className="grid grid-cols-2 gap-2 mb-4">
					<div className="py-3 rounded-2xl text-center" style={{ background: "#111820" }}>
						<p className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{items.length}</p>
						<p className="text-xs" style={{ color: "#7A8A9A" }}>Publicaciones</p>
					</div>
					<div className="py-3 rounded-2xl text-center" style={{ background: "#111820" }}>
						<p className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{ratings.length}</p>
						<p className="text-xs" style={{ color: "#7A8A9A" }}>Reseñas</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 mb-4">
					<button
						onClick={() => setView("items")}
						className="rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98]"
						style={{
							background: view === "items" ? "rgba(0,205,184,0.14)" : "#111820",
							color: view === "items" ? "#00CDB8" : "#7A8A9A",
							border: view === "items" ? "1.5px solid rgba(0,205,184,0.3)" : "1.5px solid rgba(255,255,255,0.06)",
						}}
					>
						Publicaciones
					</button>
					<button
						onClick={() => setView("reviews")}
						className="rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						style={{
							background: view === "reviews" ? "rgba(0,205,184,0.14)" : "#111820",
							color: view === "reviews" ? "#00CDB8" : "#7A8A9A",
							border: view === "reviews" ? "1.5px solid rgba(0,205,184,0.3)" : "1.5px solid rgba(255,255,255,0.06)",
						}}
					>
						<MessageSquareText size={15} />
						Reseñas
					</button>
				</div>

				{error && (
					<div className="mb-4 rounded-2xl px-4 py-3 text-xs" style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C", border: "1px solid rgba(255,58,92,0.22)" }}>
						{error}
					</div>
				)}

				{view === "reviews" && ratingsError && (
					<div className="mb-4 rounded-2xl px-4 py-3 text-xs" style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C", border: "1px solid rgba(255,58,92,0.22)" }}>
						{ratingsError}
					</div>
				)}

				{isLoading ? (
					<div className="flex h-56 items-center justify-center text-sm" style={{ color: "#7A8A9A" }}>
						Cargando panel...
					</div>
				) : view === "items" && items.length === 0 ? (
					<div className="flex h-56 items-center justify-center text-sm text-center" style={{ color: "#7A8A9A" }}>
						No hay publicaciones registradas.
					</div>
				) : view === "items" ? (
					<div className="flex flex-col gap-3 pb-8">
						{items.map((item) => {
							const owner = usersById.get(item.owner_id);
							return (
								<article
									key={item.id}
									className="flex items-center gap-3 rounded-2xl p-3"
									style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
								>
									<div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: "#080C12" }}>
										{item.image_url ? (
											<img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full" style={{ background: "#1A2230" }} />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 min-w-0">
											<h2 className="text-sm font-bold truncate" style={{ color: "#EEF2F7" }}>{item.title}</h2>
											{!item.is_available && (
												<span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8" }}>
													No disponible
												</span>
											)}
										</div>
										<p className="text-xs truncate mt-1" style={{ color: "#7A8A9A" }}>
											{owner?.username || "Usuario desconocido"} · {owner?.email || item.owner_id}
										</p>
										<div className="mt-1">
											<ProductPrice productName={item.title} userValue={item.estimated_value} variant="inline" />
										</div>
									</div>
									<button
										onClick={() => setPendingDelete(item)}
										disabled={deletingId === item.id}
										className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer disabled:cursor-not-allowed"
										style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C", border: "1.5px solid rgba(255,58,92,0.18)" }}
										title="Borrar publicación"
									>
										{deletingId === item.id ? (
											<div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
										) : (
											<Trash2 size={17} />
										)}
									</button>
								</article>
							);
						})}
					</div>
				) : ratings.length === 0 ? (
					<div className="flex h-56 items-center justify-center text-sm text-center" style={{ color: "#7A8A9A" }}>
						No hay reseñas registradas.
					</div>
				) : (
					<div className="flex flex-col gap-3 pb-8">
						{ratings.map((review) => (
							<article
								key={review.id}
								className="rounded-2xl p-4"
								style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm font-bold truncate" style={{ color: "#EEF2F7" }}>
											{review.rater.username} → {review.rated_user.username}
										</p>
										<p className="text-xs mt-1 truncate" style={{ color: "#7A8A9A" }}>
											{review.rater.email} calificó a {review.rated_user.email}
										</p>
										<p className="text-xs mt-1" style={{ color: "#4A5A6A" }}>
											{new Date(review.created_at).toLocaleDateString("es-MX")}
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<div className="flex items-center gap-1">
											<Star size={14} className="fill-yellow-400 text-yellow-400" />
											<span className="text-sm font-bold" style={{ color: "#EEF2F7" }}>{review.rating}</span>
										</div>
										<button
											onClick={() => setPendingReviewDelete(review)}
											disabled={deletingId === review.id}
											className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
											style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C", border: "1.5px solid rgba(255,58,92,0.18)" }}
											title="Borrar reseña"
										>
											{deletingId === review.id ? (
												<div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
											) : (
												<Trash2 size={17} />
											)}
										</button>
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

			{pendingDelete && (
				<div className="absolute inset-0 z-50 flex items-center justify-center px-5" style={{ background: "rgba(8,12,18,0.72)", backdropFilter: "blur(10px)" }}>
					<div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C" }}>
								<Trash2 size={18} />
							</div>
							<div className="min-w-0">
								<h2 className="text-base font-extrabold" style={{ color: "#EEF2F7" }}>Borrar publicación</h2>
								<p className="text-sm mt-1 leading-relaxed" style={{ color: "#7A8A9A" }}>
									Se eliminará "{pendingDelete.title}" de {usersById.get(pendingDelete.owner_id)?.username || "este usuario"}.
								</p>
							</div>
						</div>

						<div className="flex gap-2 mt-5">
							<button
								onClick={() => setPendingDelete(null)}
								disabled={deletingId === pendingDelete.id}
								className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
								style={{ background: "#1A2230", color: "#EEF2F7" }}
							>
								Cancelar
							</button>
							<button
								onClick={() => handleDelete(pendingDelete)}
								disabled={deletingId === pendingDelete.id}
								className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
								style={{ background: "#FF3A5C", color: "#FFFFFF" }}
							>
								{deletingId === pendingDelete.id ? "Borrando..." : "Borrar"}
							</button>
						</div>
					</div>
				</div>
			)}

			{pendingReviewDelete && (
				<div className="absolute inset-0 z-50 flex items-center justify-center px-5" style={{ background: "rgba(8,12,18,0.72)", backdropFilter: "blur(10px)" }}>
					<div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C" }}>
								<Trash2 size={18} />
							</div>
							<div className="min-w-0">
								<h2 className="text-base font-extrabold" style={{ color: "#EEF2F7" }}>Borrar reseña</h2>
								<p className="text-sm mt-1 leading-relaxed" style={{ color: "#7A8A9A" }}>
									Se eliminará la reseña de {pendingReviewDelete.rater.username} para {pendingReviewDelete.rated_user.username}.
								</p>
							</div>
						</div>

						<div className="flex gap-2 mt-5">
							<button
								onClick={() => setPendingReviewDelete(null)}
								disabled={deletingId === pendingReviewDelete.id}
								className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
								style={{ background: "#1A2230", color: "#EEF2F7" }}
							>
								Cancelar
							</button>
							<button
								onClick={() => handleDeleteReview(pendingReviewDelete)}
								disabled={deletingId === pendingReviewDelete.id}
								className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
								style={{ background: "#FF3A5C", color: "#FFFFFF" }}
							>
								{deletingId === pendingReviewDelete.id ? "Borrando..." : "Borrar"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
