export function formatMoney(value: number) {
	return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;
}

export function formatCurrency(value: number, currency = "MXN") {
	return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${currency}`;
}
