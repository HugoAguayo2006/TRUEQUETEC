import { apiClient } from "./api_client";

export interface ItemCreateInput {
	owner_id: string;
	title: string;
	estimated_value: number;
	image_url?: string;
}

export interface ItemResponseData {
	id: string;
	title: string;
	estimated_value: number;
	image_url: string;
	owner_id: string;
}

export const api = {
	getUsers: () =>
		apiClient<any[]>("/users/", { method: "GET" }),
	createUser: (userData: { email: string; username?: string, bio?: string }) =>
		apiClient<any>("/users/", { method: "POST", body: userData }),

	uploadImage: (file: File) => {
		const formData = new FormData();
		formData.append("file", file);

		return apiClient<{ image_url: string }>("/items/upload-image", {
			method: "POST",
			body: formData,
		});
	},

	createItem: (itemData: ItemCreateInput) => {
		return apiClient<ItemResponseData>("/items/", {
			method: "POST",
			body: itemData,
		});
	},

	getItems: () =>
		apiClient<any[]>("/items/", { method: "GET" }),
	getUserItems: (userId: string) => {
		return apiClient<ItemResponseData[]>(`/items?owner_id=${userId}`, {
			method: "GET",
		});
	},
}
