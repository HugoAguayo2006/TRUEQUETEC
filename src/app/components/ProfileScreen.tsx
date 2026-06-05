import { useEffect, useState } from "react";
import { Star, ChevronRight, Plus } from "lucide-react";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/use_api";
import { api } from "../../services/endpoints.ts";
import AddListingScreen from "./AddListingScreen.tsx";

export default function ProfileScreen() {
	const [addingListing, setAddingListing] = useState(false);
	const [tab, setTab] = useState<"listings" | "reviews" | "settings">("listings");

	const { execute, isLoading, data: items, error } = useApi<any[]>();
	const { execute: createNewItem, isLoading: isSavingItem } = useApi<any>();
	const { user } = useAuth();

	const fetchUserItems = React.useCallback(() => {
		if (user?.id) {
			execute(() => api.getUserItems(user.id));
		}
	}, [user?.id, execute]);

	useEffect(() => {
		fetchUserItems();
	}, [fetchUserItems]);

	async function handlePublish(listing: { title: string; value: number; image_url: string }) {
		try {
			await createNewItem(() => api.createItem({
				title: listing.title,
				estimated_value: listing.value,
				image_url: listing.image_url,
				owner_id: user?.id || ""
			}));

			setAddingListing(false);
			setTab("listings");
			fetchUserItems();
		} catch (err) {
			console.error("Failed to commit new listing asset:", err);
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
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 gap-2 mb-5">
					{[
						{ label: "Trueques", value: "18" },
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
							Add New Listing
						</button>

						{error && <p className="text-xs text-[#FF3A5C] text-center">Failed to fetch updates.</p>}

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
									</div>
								</div>
								<button style={{ color: "#7A8A9A" }}>
									<ChevronRight size={18} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
