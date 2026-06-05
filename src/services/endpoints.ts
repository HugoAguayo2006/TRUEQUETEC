import { apiClient } from "./api_client";

export interface ItemCreateInput {
	owner_id: string;
	title: string;
	estimated_value: number;
	image_url?: string;
	is_available?: boolean;
}

export interface ItemResponseData {
	id: string;
	title: string;
	estimated_value: number;
	image_url: string;
	owner_id: string;
	is_available: boolean;
}

export interface UserResponseData {
	id: string;
	username: string;
	email: string;
	bio: string;
	rating: number;
	role: "user" | "admin";
}

export interface MessageResponseData {
	id: string;
	swap_id: string;
	sender_id: string;
	body: string;
	created_at: string;
}

export interface SwapRatingResponseData {
	id: string;
	swap_id: string;
	rater_id: string;
	rated_user_id: string;
	rating: number;
	note: string;
	created_at: string;
	rated_user: UserResponseData;
}

export type SwapStatus = "pending" | "awaiting" | "accepted" | "countered" | "completed" | "declined";

export interface SwapResponseData {
	id: string;
	requester_id: string;
	owner_id: string;
	wanted_item: ItemResponseData;
	offered_items: ItemResponseData[];
	status: SwapStatus;
	created_at: string;
	updated_at: string;
	partner: UserResponseData;
	last_message?: MessageResponseData | null;
}

export const api = {
	getUser: (user_id: string) =>
		apiClient<UserResponseData>(`/users/${user_id}`, { method: "GET" }),
	getUsers: () =>
		apiClient<UserResponseData[]>("/users/", { method: "GET" }),
	createUser: (userData: { email: string; username?: string, bio?: string, password: string }) =>
		apiClient<UserResponseData>("/users/", { method: "POST", body: userData }),
	loginUser: (email: string, password: string) =>
		apiClient<UserResponseData>("/users/login", {
			method: "POST",
			body: { email, password },
		}),

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

	updateItem: (itemId: string, itemData: Partial<ItemCreateInput>) => {
		return apiClient<ItemResponseData>(`/items/${itemId}`, {
			method: "PATCH",
			body: itemData,
		});
	},

	getItems: (userId: string) => {
		return apiClient<ItemResponseData[]>(`/items?skip=${userId}`, {
			method: "GET",
		});
	},

	getUserItems: (userId: string, availableOnly = false) => {
		return apiClient<ItemResponseData[]>(`/items?owner_id=${userId}${availableOnly ? "&available_only=true" : ""}`, {
			method: "GET",
		});
	},

	getAdminItems: () => {
		return apiClient<ItemResponseData[]>("/items?all_items=true", {
			method: "GET",
		});
	},

	deleteItem: (itemId: string, ownerId?: string) => {
		return apiClient<void>(`/items/${itemId}${ownerId ? `?owner_id=${ownerId}` : ""}`, {
			method: "DELETE",
		});
	},

	createSwap: (requesterId: string, wantedItemId: string) =>
		apiClient<SwapResponseData>("/swaps/", {
			method: "POST",
			body: { requester_id: requesterId, wanted_item_id: wantedItemId },
		}),

	getSwaps: (userId: string) =>
		apiClient<SwapResponseData[]>(`/swaps?user_id=${userId}`, {
			method: "GET",
		}),

	updateSwapOffer: (swapId: string, offeredItemIds: string[]) =>
		apiClient<SwapResponseData>(`/swaps/${swapId}/offer`, {
			method: "PATCH",
			body: { offered_item_ids: offeredItemIds },
		}),

	updateSwapStatus: (swapId: string, status: SwapStatus) =>
		apiClient<SwapResponseData>(`/swaps/${swapId}/status`, {
			method: "PATCH",
			body: { status },
		}),

	getSwapMessages: (swapId: string) =>
		apiClient<MessageResponseData[]>(`/swaps/${swapId}/messages`, {
			method: "GET",
		}),

	sendSwapMessage: (swapId: string, senderId: string, body: string) =>
		apiClient<MessageResponseData>(`/swaps/${swapId}/messages`, {
			method: "POST",
			body: { sender_id: senderId, body },
		}),

	rateSwap: (swapId: string, raterId: string, rating: number, note = "") =>
		apiClient<SwapRatingResponseData>(`/swaps/${swapId}/ratings`, {
			method: "POST",
			body: { rater_id: raterId, rating, note },
		}),
}
