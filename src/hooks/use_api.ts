import { useState, useCallback } from "react";

interface UseApiOptions<T> {
	onSuccess?: (data: T) => void;
	onError?: (error: string) => void;
}

export function useApi<T>() {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<T | null>(null);

	const execute = useCallback(
		async (apiCall: () => Promise<T>, options?: UseApiOptions<T>) => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await apiCall();
				setData(result);

				if (options?.onSuccess) {
					options.onSuccess(result);
				}
				return result;
			} catch (err: any) {
				// Extracts the custom string message from your backend response or fallback text
				const errMsg = err.message || "Ocurrió un error inesperado.";
				setError(errMsg);

				if (options?.onError) {
					options.onError(errMsg);
				}
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	// Expose setError so components can manually clear or inject custom field validation issues
	return { execute, isLoading, error, data, setData, setError };
}
