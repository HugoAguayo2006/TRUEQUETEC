import { useEffect, useState } from "react";
import { api, PricingEstimateData } from "../services/endpoints";

type PriceEstimateState = {
	data: PricingEstimateData | null;
	error: string | null;
	isLoading: boolean;
};

type CacheEntry = PriceEstimateState & {
	promise?: Promise<PricingEstimateData>;
};

const cache = new Map<string, CacheEntry>();

function normalizeProductName(productName: string) {
	return productName.trim().replace(/\s+/g, " ").toLowerCase();
}

export function estimateProductPrice(productName: string) {
	return api.estimateProductPrice(productName.trim());
}

export function usePriceEstimate(productName: string) {
	const cacheKey = normalizeProductName(productName);
	const [state, setState] = useState<PriceEstimateState>(() => {
		const cached = cache.get(cacheKey);
		return {
			data: cached?.data ?? null,
			error: cached?.error ?? null,
			isLoading: cached?.isLoading ?? false,
		};
	});

	useEffect(() => {
		if (!cacheKey) {
			setState({ data: null, error: "Falta el nombre del producto", isLoading: false });
			return;
		}

		const cached = cache.get(cacheKey);
		if (cached?.data || cached?.error) {
			setState({ data: cached.data, error: cached.error, isLoading: false });
			return;
		}

		const productQuery = productName.trim().replace(/\s+/g, " ");
		const promise = cached?.promise ?? estimateProductPrice(productQuery);
		cache.set(cacheKey, { data: null, error: null, isLoading: true, promise });
		setState({ data: null, error: null, isLoading: true });

		let isActive = true;
		promise
			.then((data) => {
				cache.set(cacheKey, { data, error: null, isLoading: false });
				if (isActive) setState({ data, error: null, isLoading: false });
			})
			.catch((err: Error) => {
				const error = err.message || "No se pudo estimar el precio web";
				cache.set(cacheKey, { data: null, error, isLoading: false });
				if (isActive) setState({ data: null, error, isLoading: false });
			});

		return () => {
			isActive = false;
		};
	}, [cacheKey, productName]);

	return state;
}
