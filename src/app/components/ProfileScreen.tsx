import { useEffect, useState } from "react";
import { Star, Plus, Pencil, LogOut } from "lucide-react";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/use_api";
import { api, ItemResponseData, SwapResponseData } from "../../services/endpoints.ts";
import AddListingScreen from "./AddListingScreen.tsx";

interface Props {
	isActive?: boolean;
}

export default function ProfileScreen({ isActive = false }: Props) {
	const [addingListing, setAddingListing] = useState(false);
	const [editingListing, setEditingListing] = useState<ItemResponseData | null>(null);
	const [tab, setTab] = useState<"listings" | "reviews" | "settings">("listings");

	const { execute, isLoading, data: items, error } = useApi<ItemResponseData[]>();
	const { execute: fetchSwaps, data: swaps } = useApi<SwapResponseData[]>();
	const { execute: createNewItem } = useApi<ItemResponseData>();
	const { execute: updateExistingItem } = useApi<ItemResponseData>();
	const { user, logoutSession } = useAuth();

	const fetchUserItems = React.useCallback(() => {
		if (user?.id) {
			execute(() => api.getUserItems(user.id));
		}
	}, [user?.id, execute]);

	const fetchUserSwaps = React.useCallback(() => {
		if (user?.id) {
			fetchSwaps(() => api.getSwaps(user.id));
		}
	}, [fetchSwaps, user?.id]);

	const refreshProfile = React.useCallback(() => {
		fetchUserItems();
		fetchUserSwaps();
	}, [fetchUserItems, fetchUserSwaps]);

	useEffect(() => {
		refreshProfile();
	}, [refreshProfile]);

	useEffect(() => {
		if (isActive) {
			refreshProfile();
		}
	}, [isActive, refreshProfile]);

	async function handlePublish(listing: { title: string; value: number; image_url: string }) {
		try {
			await createNewItem(() => api.createItem({
				title: listing.title,
				estimated_value: listing.value,
				image_url: listing.image_url,
				owner_id: user?.id || ""
			}));

			setAddingListing(false);
			setEditingListing(null);
			setTab("listings");
			fetchUserItems();
		} catch (err) {
			console.error("Failed to commit new listing asset:", err);
		}
	}

	async function handleUpdateListing(listing: { title: string; value: number; image_url: string }) {
		if (!editingListing || !user?.id) return;
		try {
			await updateExistingItem(() => api.updateItem(editingListing.id, {
				title: listing.title,
				estimated_value: listing.value,
				image_url: listing.image_url,
				owner_id: user.id,
			}));

			setEditingListing(null);
			setTab("listings");
			fetchUserItems();
		} catch (err) {
			console.error("Failed to update listing:", err);
		}
	}

	if (!user) return null;

	if (addingListing) {
		return (
			<AddListingScreen
				onBack={() => setAddingListing(false)}
				onPublish={handlePublish}
			/>
		);
	}

	if (editingListing) {
		return (
			<AddListingScreen
				mode="edit"
				initialListing={editingListing}
				onBack={() => setEditingListing(null)}
				onPublish={handleUpdateListing}
			/>
		);
	}

	return (
		<div className="flex flex-col h-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}>
			<div className="shrink-0 px-5 pt-12 pb-5">
				<div className="flex items-start justify-between mb-5">
					<div className="flex items-center gap-4">
						<div>
							<div className="flex items-center gap-2 mb-0.5">
								<h2 className="text-lg font-extrabold" style={{ color: "#EEF2F7" }}>{user.username}</h2>
							</div>
							<div className="flex items-center gap-1.5">
								<Star size={12} className="fill-yellow-400 text-yellow-400" />
								<span className="text-sm font-semibold" style={{ color: "#EEF2F7" }}>{user.rating}</span>
							</div>
						</div>
					</div>
					<button
						onClick={logoutSession}
						className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
						style={{ background: "#111820", color: "#FF3A5C", border: "1.5px solid rgba(255,58,92,0.18)" }}
						title="Cerrar sesión"
					>
						<LogOut size={17} />
					</button>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 gap-2 mb-5">
					{[
						{ label: "Trueques", value: swaps?.filter((swap) => swap.status === "completed").length || 0 },
						{ label: "Publicados", value: isLoading ? "..." : items?.length || 0 },
					].map((s) => (
						<div key={s.label} className="flex flex-col items-center py-3 rounded-2xl" style={{ background: "#111820" }}>
							<span className="text-xl font-extrabold" style={{ color: "#EEF2F7" }}>{s.value}</span>
							<span className="text-xs" style={{ color: "#7A8A9A" }}>{s.label}</span>
						</div>
					))}
				</div>

				<p className="text-sm leading-relaxed mb-5" style={{ color: "#7A8A9A" }}>
					{user.bio}
				</p>
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-y-auto px-5 pb-8">
				{tab === "listings" && (
					<div className="flex flex-col gap-3">
						{/* Add new listing */}
						<button
							onClick={() => setAddingListing(true)}
							className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
							style={{ border: "1.5px dashed rgba(0,205,184,0.35)", color: "#00CDB8" }}
						>
							<div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,205,184,0.15)" }}>
								<Plus size={14} style={{ color: "#00CDB8" }} />
							</div>
							Agregar publicación
						</button>

						{error && <p className="text-xs text-[#FF3A5C] text-center">No se pudieron cargar las actualizaciones.</p>}

						{items?.map((item) => (
							<div
								key={item.id}
								className="flex items-center gap-3 p-3 rounded-2xl"
								style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
							>
								<div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#080C12]">
									<img src={item.image_url || "/fallback-placeholder.png"} alt={item.title} className="w-full h-full object-cover" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-sm truncate" style={{ color: "#EEF2F7" }}>{item.title}</p>
									<div className="flex items-center gap-2 mt-1.5">
										<span className="font-bold text-sm" style={{ color: "#00CDB8" }}>${item.estimated_value}</span>
										{!item.is_available && (
											<span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8" }}>
												Intercambiado
											</span>
										)}
									</div>
								</div>
								<button
									onClick={() => setEditingListing(item)}
									className="w-9 h-9 rounded-xl flex items-center justify-center"
									style={{ color: "#00CDB8", background: "rgba(0,205,184,0.08)" }}
								>
									<Pencil size={16} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
