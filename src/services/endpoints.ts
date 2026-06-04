import { apiClient } from "./api_client";

export const api = {
	getUsers: () =>
		apiClient<any[]>("/users/", { method: "GET" }),
	createUser: (userData: { email: string; username?: string, bio?: string }) =>
		apiClient<any>("/users/", { method: "POST", body: userData }),

	// items
	createItem: (itemData: { name: string; value: number; category: string }) =>
		apiClient<any>("/items/", { method: "POST", body: itemData }),
	getUserItems: (ownerId: string) =>
		apiClient<any[]>(`/items/?owner_id=${ownerId}`, { method: "GET" }),
}
