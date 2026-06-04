import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import React from "react";

interface Props {
	onLogin: () => void;
	onGoSignup: () => void;
}

export default function LoginScreen({ onLogin, onGoSignup }: Props) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

	function validate() {
		const e: typeof errors = {};
		if (!email) e.email = "Email is required";
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
		if (!password) e.password = "Password is required";
		else if (password.length < 6) e.password = "At least 6 characters";
		return e;
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) { setErrors(errs); return; }
		setErrors({});
		setLoading(true);
		setTimeout(onLogin, 1000);
	}

	const canSubmit = email.length > 0 && password.length > 0;

	return (
		<div
			className="flex flex-col h-full px-6"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			{/* Background glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(0,205,184,0.08) 0%, transparent 70%)" }}
			/>

			{/* Logo */}
			<div className="flex flex-col items-center pt-20 pb-10 shrink-0">
				<div
					className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
					style={{ background: "linear-gradient(135deg, #00CDB8, #009988)", boxShadow: "0 8px 32px rgba(0,205,184,0.3)" }}
				>
					<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
						<path d="M7 14C7 10.134 10.134 7 14 7V7C17.866 7 21 10.134 21 14V14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
						<path d="M21 14C21 17.866 17.866 21 14 21V21C10.134 21 7 17.866 7 14V14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 3" />
						<circle cx="14" cy="14" r="2.5" fill="white" />
					</svg>
				</div>
				<h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#EEF2F7" }}>Swaply</h1>
				<p className="text-sm mt-1" style={{ color: "#7A8A9A" }}>Trade things you love</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
				<div>
					<h2 className="text-xl font-extrabold mb-1" style={{ color: "#EEF2F7" }}>Welcome back</h2>
					<p className="text-sm" style={{ color: "#7A8A9A" }}>Sign in to continue swapping</p>
				</div>

				{/* Email */}
				<div className="flex flex-col gap-1.5">
					<div
						className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
						style={{
							background: "#111820",
							border: errors.email ? "1.5px solid rgba(255,58,92,0.5)" : "1.5px solid rgba(255,255,255,0.06)",
						}}
					>
						<Mail size={16} style={{ color: errors.email ? "#FF3A5C" : "#4A5A6A", flexShrink: 0 }} />
						<input
							type="email"
							value={email}
							onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
							placeholder="Email address"
							className="flex-1 bg-transparent text-sm outline-none"
							style={{ color: "#EEF2F7", fontFamily: "inherit" }}
							autoComplete="email"
						/>
					</div>
					{errors.email && <p className="text-xs px-1" style={{ color: "#FF3A5C" }}>{errors.email}</p>}
				</div>

				{/* Password */}
				<div className="flex flex-col gap-1.5">
					<div
						className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
						style={{
							background: "#111820",
							border: errors.password ? "1.5px solid rgba(255,58,92,0.5)" : "1.5px solid rgba(255,255,255,0.06)",
						}}
					>
						<Lock size={16} style={{ color: errors.password ? "#FF3A5C" : "#4A5A6A", flexShrink: 0 }} />
						<input
							type={showPw ? "text" : "password"}
							value={password}
							onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
							placeholder="Password"
							className="flex-1 bg-transparent text-sm outline-none"
							style={{ color: "#EEF2F7", fontFamily: "inherit" }}
							autoComplete="current-password"
						/>
						<button
							type="button"
							onClick={() => setShowPw((v) => !v)}
							style={{ color: "#4A5A6A", flexShrink: 0 }}
						>
							{showPw ? <EyeOff size={16} /> : <Eye size={16} />}
						</button>
					</div>
					{errors.password && <p className="text-xs px-1" style={{ color: "#FF3A5C" }}>{errors.password}</p>}
				</div>

				{/* Forgot */}
				<div className="flex justify-end -mt-1">
					<button type="button" className="text-sm font-semibold" style={{ color: "#00CDB8" }}>
						Forgot password?
					</button>
				</div>

				{/* Submit */}
				<button
					type="submit"
					disabled={!canSubmit || loading}
					className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1"
					style={{
						background: canSubmit ? "linear-gradient(135deg, #00CDB8, #009988)" : "#111820",
						color: canSubmit ? "#080C12" : "#4A5A6A",
						boxShadow: canSubmit ? "0 8px 24px rgba(0,205,184,0.2)" : "none",
					}}
				>
					{loading ? (
						<div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
					) : (
						<>Sign In <ArrowRight size={16} /></>
					)}
				</button>

				{/* Divider */}
				<div className="flex items-center gap-3 my-1">
					<div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
					<span className="text-xs" style={{ color: "#4A5A6A" }}>or continue with</span>
					<div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
				</div>

				{/* Social */}
				<div className="flex gap-3">
					{[
						{
							label: "Google",
							icon: (
								<svg width="18" height="18" viewBox="0 0 18 18">
									<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
									<path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
									<path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
									<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
								</svg>
							),
						},
						{
							label: "Apple",
							icon: (
								<svg width="18" height="18" viewBox="0 0 814 1000" fill="#EEF2F7">
									<path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.5-57.5-155.2-127.1C46 482.5-5 339.9-5 211.8c0-109.2 38-209.6 109.5-282.5C175.4-142 269.5-192 371.5-192c97.5 0 176.2 45.5 235.5 45.5 57.5 0 147.5-47.5 258-47.5z" />
								</svg>
							),
						},
					].map((s) => (
						<button
							key={s.label}
							type="button"
							className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
							style={{ background: "#111820", color: "#EEF2F7", border: "1.5px solid rgba(255,255,255,0.06)" }}
						>
							{s.icon}
							{s.label}
						</button>
					))}
				</div>

				<div className="flex items-center justify-center gap-1.5 pb-8 mt-auto pt-4">
					<span className="text-sm" style={{ color: "#7A8A9A" }}>Don't have an account?</span>
					<button type="button" onClick={onGoSignup} className="text-sm font-bold" style={{ color: "#00CDB8" }}>
						Sign up
					</button>
				</div>
			</form>
		</div>
	);
}
