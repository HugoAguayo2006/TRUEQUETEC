export const BASE_URL = "http://localhost:8000";
export const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");
interface RequestOptions extends RequestInit {
	body?: any;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const userId = localStorage.getItem("current_user_id");
	const isFormData = options.body instanceof FormData;
	const headers: HeadersInit = {
		...(isFormData ? {} : { "Content-Type": "application/json" }),
		...(userId ? { "X-User-Id": userId } : {}),
		...options.headers,
	};

	const config: RequestInit = {
		...options,
		headers,
		body: isFormData ? (options.body as FormData) :
			options.body ? JSON.stringify(options.body) : undefined,
	};

	const response = await fetch(`${BASE_URL}${endpoint}`, config);

	// empty responses safely
	const isJson = response.headers.get("content-type")?.includes("application/json");
	const data = isJson ? await response.json() : null;

	if (!response.ok) {
		throw new Error(data?.detail || data?.message || `La solicitud falló con el estado ${response.status}`);
	}

	return data as T;
}
