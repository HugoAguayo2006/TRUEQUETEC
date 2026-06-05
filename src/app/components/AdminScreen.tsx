import { useEffect, useMemo, useState } from "react";
import { LogOut, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { api, ItemResponseData, UserResponseData } from "../../services/endpoints";
import ProductPrice from "./ProductPrice";

export default function AdminScreen() {
	const { user, logoutSession } = useAuth();
	const [items, setItems] = useState<ItemResponseData[]>([]);
	const [users, setUsers] = useState<UserResponseData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ItemResponseData | null>(null);
	const [error, setError] = useState<string | null>(null);

	const usersById = useMemo(() => {
		return new Map(users.map((currentUser) => [currentUser.id, currentUser]));
	}, [users]);

	async function loadAdminData() {
		setIsLoading(true);
		setError(null);
		try {
			const [allItems, allUsers] = await Promise.all([
				api.getAdminItems(),
				api.getUsers(),
			]);
			setItems(allItems);
			setUsers(allUsers);
		} catch (err: any) {
			setError(err.message || "No se pudo cargar el panel de administración.");
		} finally {
			setIsLoading(false);
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
							<h1 className="text-lg font-extrabold truncate" style={{ color: "#EEF2F7" }}>Publicaciones</h1>
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
						<p className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{users.filter((currentUser) => currentUser.role !== "admin").length}</p>
						<p className="text-xs" style={{ color: "#7A8A9A" }}>Usuarios</p>
					</div>
				</div>

				{error && (
					<div className="mb-4 rounded-2xl px-4 py-3 text-xs" style={{ background: "rgba(255,58,92,0.1)", color: "#FF3A5C", border: "1px solid rgba(255,58,92,0.22)" }}>
						{error}
					</div>
				)}

				{isLoading ? (
					<div className="flex h-56 items-center justify-center text-sm" style={{ color: "#7A8A9A" }}>
						Cargando publicaciones...
					</div>
				) : items.length === 0 ? (
					<div className="flex h-56 items-center justify-center text-sm text-center" style={{ color: "#7A8A9A" }}>
						No hay publicaciones registradas.
					</div>
				) : (
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
		</div>
	);
}
