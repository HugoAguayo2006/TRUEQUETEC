import React, { createContext, useCallback, useContext, useState } from "react";

interface UserProfile {
	id: string;
	email: string;
	username?: string;
	bio?: string;
	rating?: number;
	role?: "user" | "admin";
	name?: string;
	[key: string]: any;
}

interface AuthContextType {
	user: UserProfile | null;
	isAuthenticated: boolean;
	loginSession: (userData: UserProfile) => void;
	logoutSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserProfile | null>(() => {
		const storedUser = localStorage.getItem("current_user");
		if (storedUser) {
			try {
				return JSON.parse(storedUser);
			} catch (e) {
				localStorage.removeItem("current_user");
			}
		}
		return null;
	});

	const loginSession = useCallback((userData: UserProfile) => {
		setUser(userData);
		localStorage.setItem("current_user_id", userData.id);
		localStorage.setItem("current_user", JSON.stringify(userData));
	}, []);

	const logoutSession = useCallback(() => {
		setUser(null);
		localStorage.removeItem("current_user_id");
		localStorage.removeItem("current_user");
	}, []);

	return (
		<AuthContext.Provider value={{ user, isAuthenticated: !!user, loginSession, logoutSession }}>
			{children}
		</AuthContext.Provider>
	);
}

// Custom hook to grab the session data inside any component easily
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
