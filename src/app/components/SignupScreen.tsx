import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Lock, User } from "lucide-react";
import React from "react";
import { useApi } from "../../hooks/use_api.ts";
import { api } from "../../services/endpoints";
import { useAuth } from "../../context/AuthContext.tsx";

interface Props {
	onSignup: () => void;
	onGoLogin: () => void;
}

type Step = "account" | "profile";

export default function SignupScreen({ onSignup, onGoLogin }: Props) {
	const [step, setStep] = useState<Step>("account");
	const [showPw, setShowPw] = useState(false);
	const [fields, setFields] = useState({ name: "", email: "", password: "" });
	const [bio, setBio] = useState("");
	const [errors, setErrors] = useState<Partial<typeof fields>>({});

	const { loginSession } = useAuth()
	const { execute, isLoading, error: apiError } = useApi<any>();
	function set(k: keyof typeof fields, v: string) {
		setFields((p) => ({ ...p, [k]: v }));
		setErrors((p) => ({ ...p, [k]: undefined }));
	}

	function validateAccount() {
		const e: Partial<typeof fields> = {};
		if (!fields.name.trim()) e.name = "Name is required";
		if (!fields.email) e.email = "Email is required";
		else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Enter a valid email";
		if (!fields.password) e.password = "Password is required";
		else if (fields.password.length < 6) e.password = "At least 6 characters";
		return e;
	}

	// Handles database creation request submission
	async function submitSignup() {
		try {
			await execute(
				() =>
					api.createUser({
						email: fields.email,
						username: fields.name,
						bio: bio,
						password: fields.password,
					}),
				{
					onSuccess: (newUser) => {
						loginSession(newUser)
						onSignup();
					},
				}
			);
		} catch (err) {
			// Error managed and exposed via hook's apiError variable
		}
	}

	function handleNext() {
		if (step === "account") {
			const e = validateAccount();
			if (Object.keys(e).length) { setErrors(e); return; }
			setStep("profile");
		} else {
			submitSignup();
		}
	}

	const STEPS: Step[] = ["account", "profile"];
	const stepIdx = STEPS.indexOf(step);
	const progress = ((stepIdx + 1) / STEPS.length) * 100;

	return (
		<div
			className="flex flex-col h-full px-6"
			style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#080C12" }}
		>
			<div
				className="absolute inset-0 pointer-events-none"
				style={{ background: "radial-gradient(ellipse 70% 30% at 50% 0%, rgba(0,205,184,0.07) 0%, transparent 65%)" }}
			/>

			<div className="flex items-center justify-between pt-14 pb-6 shrink-0">
				<button
					type="button"
					disabled={isLoading}
					onClick={step === "account" ? onGoLogin : () => setStep(STEPS[stepIdx - 1] as Step)}
					className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
					style={{ background: "#111820" }}
				>
					<ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
				</button>
				<div className="flex items-center gap-1.5">
					{STEPS.map((s, i) => (
						<div
							key={s}
							className="rounded-full transition-all"
							style={{
								width: s === step ? 20 : 6,
								height: 6,
								background: i <= stepIdx ? "#00CDB8" : "#1A2230",
							}}
						/>
					))}
				</div>

				<div className="w-9" />
			</div>

			<div className="h-0.5 rounded-full mb-6 shrink-0" style={{ background: "#111820" }}>
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00CDB8, #009988)" }}
				/>
			</div>
			{apiError && (
				<div className="text-xs p-3.5 mb-4 bg-red-500/10 border border-red-500/20 text-[#FF3A5C] rounded-2xl animate-fade-in shrink-0">
					{apiError}
				</div>
			)}

			{step === "account" && (
				<div className="flex flex-col gap-5 flex-1">
					<div>
						<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Step 1 of 2</p>
						<h2 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Create your account</h2>
						<p className="text-sm mt-1" style={{ color: "#7A8A9A" }}>Join thousands of people swapping things they love</p>
					</div>

					{(
						[
							{ key: "name", label: "Full name", type: "text", icon: <User size={16} />, placeholder: "Jordan Lee", autoComplete: "name" },
							{ key: "email", label: "Email", type: "email", icon: <Mail size={16} />, placeholder: "you@example.com", autoComplete: "email" },
							{ key: "password", label: "Password", type: showPw ? "text" : "password", icon: <Lock size={16} />, placeholder: "Min. 6 characters", autoComplete: "new-password" },
						] as const
					).map((f) => (
						<div key={f.key} className="flex flex-col gap-1.5">
							<div
								className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
								style={{
									background: "#111820",
									border: errors[f.key] ? "1.5px solid rgba(255,58,92,0.5)" : "1.5px solid rgba(255,255,255,0.06)",
								}}
							>
								<span style={{ color: errors[f.key] ? "#FF3A5C" : "#4A5A6A", flexShrink: 0 }}>{f.icon}</span>
								<input
									type={f.type}
									value={fields[f.key]}
									onChange={(e) => set(f.key, e.target.value)}
									placeholder={f.placeholder}
									autoComplete={f.autoComplete}
									className="flex-1 bg-transparent text-sm outline-none"
									style={{ color: "#EEF2F7", fontFamily: "inherit" }}
								/>
								{f.key === "password" && (
									<button type="button" onClick={() => setShowPw((v) => !v)} style={{ color: "#4A5A6A", flexShrink: 0 }}>
										{showPw ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								)}
							</div>
							{errors[f.key] && <p className="text-xs px-1" style={{ color: "#FF3A5C" }}>{errors[f.key]}</p>}
						</div>
					))}

					{fields.password.length > 0 && (
						<div className="flex gap-1 -mt-2">
							{[1, 2, 3, 4].map((i) => {
								const strength = Math.min(Math.floor(fields.password.length / 3), 4);
								const colors = ["#FF3A5C", "#FF8C42", "#FFD166", "#00CDB8"];
								return (
									<div
										key={i}
										className="flex-1 h-1 rounded-full transition-all"
										style={{ background: i <= strength ? colors[strength - 1] : "#1A2230" }}
									/>
								);
							})}
						</div>
					)}
					<button
						type="button"
						onClick={handleNext}
						className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-auto"
						style={{
							background: "linear-gradient(135deg, #00CDB8, #009988)",
							color: "#080C12",
							boxShadow: "0 8px 24px rgba(0,205,184,0.2)",
						}}>
						Continue <ArrowRight size={16} />
					</button>
					<div className="flex items-center justify-center gap-1.5 pb-8">
						<span className="text-sm" style={{ color: "#7A8A9A" }}>Already have an account?</span>
						<button type="button" onClick={onGoLogin} className="text-sm font-bold" style={{ color: "#00CDB8" }}>Sign in</button>
					</div>
				</div>
			)}

			{/* Step: Profile setup */}
			{step === "profile" && (
				<div className="flex flex-col gap-5 flex-1">
					<div>
						<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Step 2 of 2</p>
						<h2 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Set up your profile</h2>
						<p className="text-sm mt-1" style={{ color: "#7A8A9A" }}>Help others trust you as a swapper</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: "#7A8A9A" }}>Short bio</label>
						<textarea
							rows={3}
							value={bio}
							disabled={isLoading}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Tell others what kinds of things you swap…"
							className="px-4 py-3.5 rounded-2xl text-sm resize-none outline-none transition-opacity disabled:opacity-50"
							style={{
								background: "#111820",
								border: "1.5px solid rgba(255,255,255,0.06)",
								color: "#EEF2F7",
								fontFamily: "inherit",
							}}
						/>
					</div>

					<button
						type="button"
						onClick={handleNext}
						disabled={isLoading}
						className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-auto disabled:opacity-50"
						style={{ background: "linear-gradient(135deg, #00CDB8, #009988)", color: "#080C12", boxShadow: "0 8px 24px rgba(0,205,184,0.2)" }}
					>
						{isLoading ? (
							<div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
						) : (
							<>Complete Sign Up <ArrowRight size={16} /></>
						)}
					</button>

					<button
						type="button"
						disabled={isLoading}
						onClick={handleNext}
						className="text-sm pb-8 font-medium hover:underline transition-all disabled:opacity-40"
						style={{ color: "#4A5A6A" }}
					>
						Skip for now
					</button>
				</div>
			)}
		</div>
	);
}
