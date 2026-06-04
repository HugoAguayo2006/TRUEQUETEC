import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Lock, User } from "lucide-react";
import React from "react";

interface Props {
	onSignup: () => void;
	onGoLogin: () => void;
}

type Step = "account" | "profile";
export default function SignupScreen({ onSignup, onGoLogin }: Props) {
	const [step, setStep] = useState<Step>("account");
	const [showPw, setShowPw] = useState(false);
	const [fields, setFields] = useState({ name: "", email: "", password: "" });
	const [errors, setErrors] = useState<Partial<typeof fields>>({});

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

	function handleNext() {
		if (step === "account") {
			const e = validateAccount();
			if (Object.keys(e).length) { setErrors(e); return; }
			setStep("profile");
		} else {
			setTimeout(onSignup, 900);
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

			{/* Top bar */}
			<div className="flex items-center justify-between pt-14 pb-6 shrink-0">
				<button
					onClick={step === "account" ? onGoLogin : () => setStep(STEPS[stepIdx - 1] as Step)}
					className="w-9 h-9 rounded-full flex items-center justify-center"
					style={{ background: "#111820" }}
				>
					<ArrowLeft size={17} style={{ color: "#EEF2F7" }} />
				</button>

				{/* Step progress */}
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

			{/* Progress bar */}
			<div className="h-0.5 rounded-full mb-6 shrink-0" style={{ background: "#111820" }}>
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00CDB8, #009988)" }}
				/>
			</div>

			{/* Step: Account */}
			{step === "account" && (
				<div className="flex flex-col gap-5 flex-1">
					<div>
						<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Step 1 of 3</p>
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

					{/* Password strength */}
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
						onClick={handleNext}
						className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-auto"
						style={{
							background: "linear-gradient(135deg, #00CDB8, #009988)",
							color: "#080C12",
							boxShadow: "0 8px 24px rgba(0,205,184,0.2)",
						}}
					>
						Continue <ArrowRight size={16} />
					</button>

					<div className="flex items-center justify-center gap-1.5 pb-8">
						<span className="text-sm" style={{ color: "#7A8A9A" }}>Already have an account?</span>
						<button onClick={onGoLogin} className="text-sm font-bold" style={{ color: "#00CDB8" }}>Sign in</button>
					</div>
				</div>
			)}

			{/* Step: Profile setup */}
			{step === "profile" && (
				<div className="flex flex-col gap-5 flex-1">
					<div>
						<p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#00CDB8" }}>Step 2 of 3</p>
						<h2 className="text-2xl font-extrabold" style={{ color: "#EEF2F7" }}>Set up your profile</h2>
						<p className="text-sm mt-1" style={{ color: "#7A8A9A" }}>Help others trust you as a swapper</p>
					</div>

					{/* Avatar picker */}
					<div className="flex flex-col items-center gap-3 py-4">
						<div className="relative">
							<div
								className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center"
								style={{ background: "#1A2230", border: "2px dashed rgba(0,205,184,0.3)" }}
							>
								<div className="flex flex-col items-center gap-1">
									<User size={28} style={{ color: "#4A5A6A" }} />
									<span className="text-[10px]" style={{ color: "#4A5A6A" }}>Add photo</span>
								</div>
							</div>
							<button
								className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
								style={{ background: "#00CDB8" }}
							>
								<span className="text-sm">+</span>
							</button>
						</div>
						<p className="text-xs" style={{ color: "#4A5A6A" }}>Optional — skip if you prefer</p>
					</div>

					{/* Location */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: "#7A8A9A" }}>City</label>
						<div
							className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
							style={{ background: "#111820", border: "1.5px solid rgba(255,255,255,0.06)" }}
						>
							<span style={{ color: "#4A5A6A" }}>📍</span>
							<input
								type="text"
								placeholder="San Francisco, CA"
								className="flex-1 bg-transparent text-sm outline-none"
								style={{ color: "#EEF2F7", fontFamily: "inherit" }}
							/>
						</div>
					</div>

					{/* Bio */}
					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: "#7A8A9A" }}>Short bio</label>
						<textarea
							rows={3}
							placeholder="Tell others what kinds of things you swap…"
							className="px-4 py-3.5 rounded-2xl text-sm resize-none outline-none"
							style={{
								background: "#111820",
								border: "1.5px solid rgba(255,255,255,0.06)",
								color: "#EEF2F7",
								fontFamily: "inherit",
							}}
						/>
					</div>

					<button
						onClick={handleNext}
						className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-auto"
						style={{ background: "linear-gradient(135deg, #00CDB8, #009988)", color: "#080C12", boxShadow: "0 8px 24px rgba(0,205,184,0.2)" }}
					>
						Continue <ArrowRight size={16} />
					</button>

					<button onClick={handleNext} className="text-sm pb-8 font-medium" style={{ color: "#4A5A6A" }}>
						Skip for now
					</button>
				</div>
			)}

		</div>
	);
}
