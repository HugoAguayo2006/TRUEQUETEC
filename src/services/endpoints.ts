import { apiGet } from "./api_client";

export type StorePrice = {
  title: string;
  store: string;
  price: number;
  link: string;
};

export type PriceEstimate = {
  query: string;
  currency: string;
  count: number;
  minimum: number;
  average: number;
  maximum: number;
  stores: StorePrice[];
};

export function estimateProductPrice(query: string) {
  return apiGet<PriceEstimate>(`/pricing/estimate?q=${encodeURIComponent(query)}`);
}
