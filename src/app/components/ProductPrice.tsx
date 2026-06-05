import React from "react";
import { usePriceEstimate } from "../../hooks/use_price_estimate";
import { formatCurrency, formatMoney } from "../../utils/currency";

interface ProductPriceProps {
	productName: string;
	userValue: number;
	align?: "left" | "right";
	variant?: "stacked" | "inline" | "hero";
}

export default function ProductPrice({ productName, userValue, align = "left", variant = "stacked" }: ProductPriceProps) {
	const { data, error, isLoading } = usePriceEstimate(productName);
	const textAlign = align === "right" ? "text-right items-end" : "text-left items-start";
	const webAverage = data ? formatCurrency(data.average, data.currency) : null;
	const errorLabel = error ? "No se pudo consultar SERP" : null;

	if (variant === "hero") {
		return (
			<div className={`flex flex-col gap-1 ${textAlign}`}>
				<span className="text-xl font-extrabold" style={{ color: "#00CDB8" }}>
					{formatMoney(userValue)}
				</span>
				<span className="text-xs font-semibold" style={{ color: data ? "#D8E1EA" : "#9AA8B6" }}>
					Promedio web: {data ? webAverage : isLoading ? "cargando..." : "sin datos"}
				</span>
				{errorLabel && <span className="text-[10px] leading-tight max-w-[170px]" style={{ color: "#FFB4C2" }}>{errorLabel}</span>}
			</div>
		);
	}

	if (variant === "inline") {
		return (
			<div className={`flex flex-wrap gap-x-2 gap-y-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
				<span className="text-xs font-semibold" style={{ color: "#00CDB8" }}>{formatMoney(userValue)}</span>
				<span className="text-xs font-semibold" style={{ color: data ? "#38BDF8" : "#7A8A9A" }}>
					Promedio web: {data ? webAverage : isLoading ? "cargando..." : "sin datos"}
				</span>
			</div>
		);
	}

	return (
		<div className={`flex flex-col gap-0.5 ${textAlign}`}>
			<span className="text-xs font-semibold" style={{ color: "#00CDB8" }}>{formatMoney(userValue)}</span>
			<span className="text-xs font-semibold" style={{ color: data ? "#38BDF8" : "#7A8A9A" }}>
				Promedio web: {data ? webAverage : isLoading ? "cargando..." : "sin datos"}
			</span>
			{errorLabel && <span className="text-[10px] leading-tight max-w-[180px]" style={{ color: "#FF8FA3" }}>{errorLabel}</span>}
		</div>
	);
}
