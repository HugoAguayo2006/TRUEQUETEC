import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import React from "react";
import { useApi } from "../../hooks/use_api.ts";
import { api } from "../../services/endpoints.ts";

interface Props {
	onLogin: () => void;
	onGoSignup: () => void;
}

export default function LoginScreen({ onLogin, onGoSignup }: Props) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);

	const { execute, isLoading, error, setError } = useApi<any>();
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

	function validate() {
		const e: typeof errors = {};
		if (!email) e.email = "Email is required";
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
		if (!password) e.password = "Password is required";
		else if (password.length < 6) e.password = "At least 6 characters";
		return e;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) { setErrors(errs); return; }
		setErrors({});

		try {
			// Trigger request manager layer to pull registered users
			await execute(() => api.getUsers(), {
				onSuccess: (allUsers: any[]) => {
					// Search if matching email exists on your FastAPI backend database
					const existingUser = allUsers.find(
						(u) => u.email.toLowerCase() === email.toLowerCase()
					);

					if (existingUser) {
						// Success! Save user UUID text identifier globally for headers
						localStorage.setItem("current_user_id", existingUser.id);
						onLogin();
					} else {
						// User not found in backend DB
						setErrors({ email: "No account found matching this email" });
					}
				}
			});
		} catch (err) {
			// Server network error fallback handling
		}
	}

	const canSubmit = email.length > 0 && password.length > 0;

	return (
		<div
			className="flex flex-col h-full px-6"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(0,205,184,0.08) 0%, transparent 70%)" }}
			/>

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

			<form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
				<div>
					<h2 className="text-xl font-extrabold mb-1" style={{ color: "#EEF2F7" }}>Welcome back</h2>
					<p className="text-sm" style={{ color: "#7A8A9A" }}>Sign in to continue swapping</p>
				</div>

				{/* Global Fetch Connection Error Alert banner */}
				{error && (
					<div className="text-xs p-3.5 bg-red-500/10 border border-red-500/20 text-[#FF3A5C] rounded-2xl">
						{error}
					</div>
				)}

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

				<button
					type="submit"
					disabled={!canSubmit || isLoading}
					className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1"
					style={{
						background: canSubmit ? "linear-gradient(135deg, #00CDB8, #009988)" : "#111820",
						color: canSubmit ? "#080C12" : "#4A5A6A",
						boxShadow: canSubmit ? "0 8px 24px rgba(0,205,184,0.2)" : "none",
					}}
				>
					{isLoading ? (
						<div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
					) : (
						<>Sign In <ArrowRight size={16} /></>
					)}
				</button>

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
