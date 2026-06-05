import { useState, useRef } from "react";
import { ArrowLeft, Camera, X, DollarSign, Tag } from "lucide-react";
import React from "react";
import { api } from "../../services/endpoints.ts";
import { useApi } from "../../hooks/use_api";

interface Props {
	onBack: () => void;
	onPublish: (listing: { title: string; value: number; image_url: string }) => void;
	initialListing?: { title: string; estimated_value: number; image_url: string };
	mode?: "create" | "edit";
}

export default function AddListingScreen({ onBack, onPublish, initialListing, mode = "create" }: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [photos, setPhotos] = useState<string[]>(initialListing?.image_url ? [initialListing.image_url] : []);
	const [title, setName] = useState(initialListing?.title || "");
	const [estimated_value, setValue] = useState(initialListing?.estimated_value ? String(initialListing.estimated_value) : "");
	const [publishing, setPublishing] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const { execute: uploadAsset, isLoading: isUploadingAsset } = useApi<{ image_url: string }>();
	const canPublish = title.trim() && estimated_value && photos.length > 0 && !isUploadingAsset;

	async function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		setErrors((prev) => ({ ...prev, photos: "" }));
		try {
			const data = await uploadAsset(() => api.uploadImage(selectedFile));
			if (data?.image_url) {
				setPhotos((prev) => [...prev, data.image_url]);
			}
		} catch (err) {
			setErrors((prev) => ({ ...prev, photos: "No se pudo subir la foto. Intenta de nuevo." }));
		}

		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	function removePhoto(idx: number) {
		setPhotos((p) => p.filter((_, i) => i !== idx));
	}

	function validate() {
		const e: Record<string, string> = {};
		if (!title.trim()) e.name = "El nombre del artículo es obligatorio";
		if (!estimated_value) e.value = "Ingresa un valor estimado";
		else if (isNaN(Number(estimated_value)) || Number(estimated_value) <= 0) e.value = "Ingresa un monto válido";
		if (photos.length === 0) e.photos = "Agrega al menos una foto";
		return e;
	}

	function handlePublish() {
		const e = validate();
		if (Object.keys(e).length) { setErrors(e); return; }
		setPublishing(true);

		// Fires back to profile with structural fields extracted directly
		onPublish({
			title,
			value: Number(estimated_value),
			image_url: photos[0] || ""
		});
	}

	return (
		<div
			className="flex flex-col h-full"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileSelection}
				accept="image/*"
				className="hidden"
			/>

			{/* Header */}
			<div
				className="flex items-center justify-between px-5 pt-12 pb-4 shrink-0"
				style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
			>
				<button
					onClick={onBack}
					className="w-9 h-9 rounded-full flex items-center justify-center"
					style={{ background: "#111820" }}
				>
					<ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
				</button>
				<h1 className="text-base font-bold" style={{ color: "#EEF2F7" }}>{mode === "edit" ? "Editar publicación" : "Nueva publicación"}</h1>
				<button
					onClick={handlePublish}
					disabled={!canPublish || publishing}
					className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
					style={{
						background: canPublish ? "linear-gradient(135deg, #00CDB8, #009988)" : "#1A2230",
						color: canPublish ? "#080C12" : "#4A5A6A",
					}}
				>
					{publishing ? "Guardando..." : mode === "edit" ? "Guardar" : "Publicar"}
				</button>
			</div>

			<div className="flex-1 overflow-y-auto pb-8">
				<div className="px-5 pt-5 pb-4">
					<div className="flex items-center justify-between mb-3">
						<p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
							Fotos <span style={{ color: "#4A5A6A" }}>{photos.length}/4</span>
						</p>
						{errors.photos && <p className="text-xs" style={{ color: "#FF3A5C" }}>{errors.photos}</p>}
					</div>

					<div className="flex gap-3 overflow-x-auto pb-1">
						{photos.length < 4 && (
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isUploadingAsset}
								className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
								style={{
									width: photos.length === 0 ? "100%" : 90,
									height: photos.length === 0 ? 200 : 90,
									background: "#111820",
									border: errors.photos ? "1.5px dashed rgba(255,58,92,0.5)" : "1.5px dashed rgba(0,205,184,0.3)",
									minWidth: photos.length > 0 ? 90 : undefined,
								}}
							>
								<div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,205,184,0.1)" }}>
									{isUploadingAsset ? (
										<div className="w-5 h-5 rounded-full border-2 border-[#00CDB8] border-t-transparent animate-spin" />
									) : (
										<Camera size={20} style={{ color: "#00CDB8" }} />
									)}
								</div>
								<span className="text-sm font-semibold" style={{ color: "#00CDB8" }}>
									{isUploadingAsset ? "Subiendo..." : "Agregar foto"}
								</span>
								{photos.length === 0 && !isUploadingAsset && (
									<span className="text-xs" style={{ color: "#4A5A6A" }}>Toca para subir</span>
								)}
							</button>
						)}

						{photos.map((src, i) => (
							<div
								key={i}
								className="relative shrink-0 rounded-2xl overflow-hidden"
								style={{ width: i === 0 && photos.length === 1 ? "100%" : 90, height: i === 0 && photos.length === 1 ? 200 : 90 }}
							>
								<img src={src} alt="Vista previa de la publicación" className="w-full h-full object-cover" />
								{i === 0 && (
									<div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.6)", color: "#EEF2F7" }}>
										Portada
									</div>
								)}
								<button
									type="button"
									onClick={() => removePhoto(i)}
									className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
									style={{ background: "rgba(0,0,0,0.6)" }}
								>
									<X size={12} style={{ color: "#EEF2F7" }} />
								</button>
							</div>
						))}
					</div>
				</div>

				<div className="px-5 flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
							Nombre del artículo
						</label>
						<div
							className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
							style={{
								background: "#111820",
								border: errors.name ? "1.5px solid rgba(255,58,92,0.4)" : "1.5px solid rgba(255,255,255,0.06)",
							}}
						>
							<Tag size={15} style={{ color: "#4A5A6A", flexShrink: 0 }} />
							<input
								type="text"
								value={title}
								onChange={(e) => setName(e.target.value)}
								placeholder="Ej. Cámara Leica M6 vintage"
								className="flex-1 bg-transparent text-sm outline-none"
								style={{ color: "#EEF2F7", fontFamily: "inherit" }}
							/>
						</div>
						{errors.name && <p className="text-xs" style={{ color: "#FF3A5C" }}>{errors.name}</p>}
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7A8A9A" }}>
							Valor estimado
						</label>
						<div
							className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
							style={{
								background: "#111820",
								border: errors.value ? "1.5px solid rgba(255,58,92,0.4)" : "1.5px solid rgba(255,255,255,0.06)",
							}}
						>
							<DollarSign size={15} style={{ color: "#4A5A6A", flexShrink: 0 }} />
							<input
								type="number"
								value={estimated_value}
								onChange={(e) => setValue(e.target.value)}
								placeholder="0.00"
								min="0"
								className="flex-1 bg-transparent text-sm outline-none"
								style={{ color: "#EEF2F7", fontFamily: "inherit" }}
							/>
							<span className="text-sm" style={{ color: "#4A5A6A" }}>MXN</span>
						</div>
						{errors.value
							? <p className="text-xs" style={{ color: "#FF3A5C" }}>{errors.value}</p>
							: <p className="text-xs px-1" style={{ color: "#4A5A6A" }}></p>
						}
					</div>

					{/* Publish button */}
					<button
						type="button"
						onClick={handlePublish}
						disabled={!canPublish || publishing}
						className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
						style={{
							background: canPublish ? "linear-gradient(135deg, #00CDB8, #009988)" : "#111820",
							color: canPublish ? "#080C12" : "#4A5A6A",
							boxShadow: canPublish ? "0 8px 24px rgba(0,205,184,0.2)" : "none",
						}}
					>
						{publishing ? (
							<div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
						) : (
							mode === "edit" ? "Guardar cambios" : "Publicar artículo"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
