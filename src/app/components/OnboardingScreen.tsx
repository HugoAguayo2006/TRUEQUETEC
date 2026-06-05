import { ArrowRight } from "lucide-react";
import React from "react";

interface Props {
	onLogin: () => void;
	onSignup: () => void;
}

export default function OnboardingScreen({ onLogin, onSignup }: Props) {
	return (
		<div
			className="flex flex-col h-full"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			{/* Hero image */}
			<div className="relative flex-1 min-h-0">
				<img
					src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=1000&fit=crop"
					alt=""
					className="w-full h-full object-cover"
					style={{ filter: "brightness(0.45)" }}
				/>

				<div
					className="absolute inset-0"
					style={{ background: "linear-gradient(to bottom, rgba(8,12,18,0.2) 0%, rgba(8,12,18,0.0) 30%, rgba(8,12,18,0.95) 80%, #080C12 100%)" }}
				/>
				<div className="absolute top-14 left-6 flex items-center gap-2.5">
					<div
						className="w-9 h-9 rounded-xl flex items-center justify-center"
						style={{ background: "linear-gradient(135deg, #00CDB8, #009988)" }}
					>
						<svg width="18" height="18" viewBox="0 0 28 28" fill="none">
							<path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
							<path d="M21 14C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 3" />
							<circle cx="14" cy="14" r="2.5" fill="white" />
						</svg>
					</div>
					<span className="text-lg font-extrabold tracking-tight text-white">TRUEQUETEC</span>
				</div>
			</div>

			{/* Bottom CTA */}
			<div className="shrink-0 px-6 pb-10 pt-6 flex flex-col gap-3" style={{ background: "#080C12" }}>
				<button
					onClick={onSignup}
					className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
					style={{
						background: "linear-gradient(135deg, #00CDB8, #009988)",
						color: "#080C12",
						boxShadow: "0 8px 32px rgba(0,205,184,0.25)",
					}}
				>
					Empezar <ArrowRight size={16} />
				</button>

				<button
					onClick={onLogin}
					className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
					style={{ background: "#111820", color: "#EEF2F7", border: "1.5px solid rgba(255,255,255,0.08)" }}
				>
					Ya tengo una cuenta
				</button>

				<p className="text-center text-xs pt-1" style={{ color: "#3A4A5A" }}>
					Al continuar, aceptas nuestros Términos y Política de privacidad
				</p>
			</div>
		</div>
	);
}
