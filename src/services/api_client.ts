const BASE_URL = "http://localhost:8000"
interface RequestOptions extends RequestInit {
	body?: any;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const token = localStorage.getItem("token");

	const headers: HeadersInit = {
		"Content-Type": "application/json",
		...(token ? { "Authorization": `Bearer ${token}` } : {}),
		...options.headers,
	};

	const config: RequestInit = {
		...options,
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	};

	const response = await fetch(`${BASE_URL}${endpoint}`, config);

	// Handle empty responses (like 204 No Content) safely
	const isJson = response.headers.get("content-type")?.includes("application/json");
	const data = isJson ? await response.json() : null;

	if (!response.ok) {
		throw new Error(data?.message || `Request failed with status ${response.status}`);
	}

	return data as T;
}


