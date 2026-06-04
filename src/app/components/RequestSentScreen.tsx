import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import React from "react";

interface Props {
	item: { name: string; value: number; image: string; owner: string; ownerAvatar: string };
	onContinue: () => void;
}

export default function RequestSentScreen({ item, onContinue }: Props) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setShow(true), 80);
		return () => clearTimeout(t);
	}, []);

	return (
		<div
			className="flex flex-col h-full items-center justify-center px-6 relative overflow-hidden"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			{/* Background glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: "radial-gradient(ellipse 60% 40% at 50% 45%, rgba(0,205,184,0.12) 0%, transparent 70%)" }}
			/>

			{/* Ring animation */}
			<div
				className="absolute rounded-full border border-primary/20"
				style={{
					width: 280,
					height: 280,
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -60%)",
					animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
					opacity: 0.3,
				}}
			/>

			{/* Floating item image */}
			<div
				className="relative mb-8"
				style={{
					transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
					opacity: show ? 1 : 0,
					transform: show ? "scale(1) translateY(0)" : "scale(0.7) translateY(20px)",
				}}
			>
				<div
					className="w-36 h-36 rounded-3xl overflow-hidden shadow-2xl border-2"
					style={{ borderColor: "rgba(0,205,184,0.4)" }}
				>
					<img src={item.image} alt={item.name} className="w-full h-full object-cover" />
				</div>
				{/* Heart badge */}
				<div
					className="absolute -top-3 -right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-xl"
					style={{ background: "linear-gradient(135deg, #00CDB8, #00A896)" }}
				>
					<span className="text-xl">💚</span>
				</div>
			</div>

			{/* Text */}
			<div
				className="text-center mb-8"
				style={{
					transition: "all 0.5s ease 0.2s",
					opacity: show ? 1 : 0,
					transform: show ? "translateY(0)" : "translateY(10px)",
				}}
			>
				<h1 className="text-foreground text-2xl font-extrabold mb-2">¡Solicitud enviada!</h1>
				<p className="text-muted-foreground text-base leading-relaxed max-w-xs">
					Quieres <span className="text-foreground font-semibold">{item.name}</span>.<br />
					Ya avisamos a {item.owner}; elegirá algo de tu colección para ofrecerte a cambio.
				</p>
			</div>

			{/* Status card */}
			<div
				className="w-full rounded-2xl bg-card border border-border p-4 mb-8"
				style={{
					transition: "all 0.5s ease 0.35s",
					opacity: show ? 1 : 0,
					transform: show ? "translateY(0)" : "translateY(10px)",
				}}
			>
				<div className="flex items-center gap-3">
					<img src={item.ownerAvatar} alt={item.owner} className="w-10 h-10 rounded-full object-cover border border-border" />
					<div className="flex-1">
						<p className="text-foreground font-semibold text-sm">{item.owner}</p>
						<p className="text-muted-foreground text-xs">Revisando tu perfil...</p>
					</div>
					<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
						<Clock size={12} className="text-primary" />
						<span className="text-muted-foreground text-xs">Pendiente</span>
					</div>
				</div>
			</div>

			{/* What happens next */}
			<div
				className="w-full mb-8"
				style={{
					transition: "all 0.5s ease 0.5s",
					opacity: show ? 1 : 0,
					transform: show ? "translateY(0)" : "translateY(10px)",
				}}
			>
				<div className="flex gap-4">
					{[
						{ num: "1", text: "Alex elige artículos para ofrecer" },
						{ num: "2", text: "Revisas el trueque" },
						{ num: "3", text: "Aceptas, rechazas o propones cambios" },
					].map((step) => (
						<div key={step.num} className="flex-1 flex flex-col items-center text-center gap-1">
							<div
								className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center mb-1"
								style={{ background: "rgba(0,205,184,0.15)", color: "#00CDB8" }}
							>
								{step.num}
							</div>
							<span className="text-muted-foreground text-xs leading-tight">{step.text}</span>
						</div>
					))}
				</div>
			</div>

			{/* Simulate: see the offer (demo shortcut) */}
			<div
				className="w-full flex flex-col gap-3"
				style={{
					transition: "all 0.5s ease 0.6s",
					opacity: show ? 1 : 0,
					transform: show ? "translateY(0)" : "translateY(10px)",
				}}
			>
				<button
					onClick={onContinue}
					className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all"
					style={{ background: "linear-gradient(135deg, #00CDB8, #00A896)", color: "#080C12" }}
				>
					Ver oferta entrante →
				</button>
				<p className="text-muted-foreground text-xs text-center">
					Modo demo: simula que {item.owner} envía una oferta
				</p>
			</div>
		</div>
	);
}
