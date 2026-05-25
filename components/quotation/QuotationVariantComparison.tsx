import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SavedQuotation, QuotationItem } from './types';

interface QuotationVariantComparisonProps {
	baseQuotation: SavedQuotation;
	variants: SavedQuotation[];
	onOpenVariant: (id: string) => void;
}

const formatCurrency = (value: number) =>
	`৳${Math.round(value || 0).toLocaleString()}`;

const getTransportation = (quotation: SavedQuotation) =>
	quotation.transportationCost !== null
		? quotation.transportationCost
		: quotation.transportationLocation === 'inside'
			? 5500
			: 15500;

const getQuotationTotals = (quotation: SavedQuotation) => {
	const subtotal = quotation.quotationItems.reduce(
		(sum, item) => sum + (Number(item.totalPrice) || 0),
		0,
	);
	const transportation = getTransportation(quotation);
	const discount = quotation.hasDiscount ? quotation.discountAmount : 0;
	return {
		subtotal,
		transportation,
		discount,
		total: subtotal + transportation - discount,
	};
};

const getItemLabel = (item: QuotationItem) =>
	item.applicationName || item.productName || item.description || `Item ${item.id}`;

const getItemKey = (item: QuotationItem) =>
	item.id ||
	item.productId ||
	[item.applicationName, item.productName, item.description, item.id]
		.filter(Boolean)
		.join('|');

const getSkippedReason = (
	reason: 'manual-unmatched' | 'missing-product' | 'target-series-unavailable',
) => {
	if (reason === 'target-series-unavailable') {
		return 'Selected series unavailable';
	}
	if (reason === 'missing-product') {
		return 'Product not found';
	}
	return 'Manual/unmatched item';
};

export default function QuotationVariantComparison({
	baseQuotation,
	variants,
	onOpenVariant,
}: QuotationVariantComparisonProps) {
	const orderedVariants = [...variants].sort((a, b) =>
		(a.variantName || '').localeCompare(b.variantName || ''),
	);
	const comparisonQuotations = [baseQuotation, ...orderedVariants];
	const rows = baseQuotation.quotationItems.map(item => {
		const key = getItemKey(item);
		const baseTotal = Number(item.totalPrice) || 0;
		return {
			key,
			label: getItemLabel(item),
			baseTotal,
			variantTotals: orderedVariants.map(variant => {
				const match = variant.quotationItems.find(
					variantItem => getItemKey(variantItem) === key,
				);
				return Number(match?.totalPrice) || 0;
			}),
		};
	});

	return (
		<div className="h-full overflow-auto bg-white">
			<div className="p-4 space-y-4">
				<div>
					<h2 className="text-base font-semibold text-slate-900">
						Series Comparison
					</h2>
					<p className="text-xs text-slate-500">
						Totals are calculated from saved variant item prices.
					</p>
				</div>

				<div className="overflow-auto rounded-md border border-slate-200">
					<table className="w-full min-w-[760px] text-xs">
						<thead className="bg-slate-50 text-slate-600">
							<tr>
								<th className="px-3 py-2 text-left font-semibold">Variant</th>
								<th className="px-3 py-2 text-left font-semibold">Series</th>
								<th className="px-3 py-2 text-right font-semibold">Subtotal</th>
								<th className="px-3 py-2 text-right font-semibold">Transportation</th>
								<th className="px-3 py-2 text-right font-semibold">Discount</th>
								<th className="px-3 py-2 text-right font-semibold">Total</th>
								<th className="px-3 py-2 text-right font-semibold">Updated</th>
								<th className="px-3 py-2 text-right font-semibold">Skipped</th>
								<th className="px-3 py-2 text-right font-semibold">Open</th>
							</tr>
						</thead>
						<tbody>
							{comparisonQuotations.map(quotation => {
								const totals = getQuotationTotals(quotation);
								const isBase = quotation.variantType === 'base';
								return (
									<tr key={quotation.id} className="border-t border-slate-100">
										<td className="px-3 py-2 font-medium text-slate-800">
											{quotation.variantName || (isBase ? 'Base' : 'Quotation')}
										</td>
										<td className="px-3 py-2 text-slate-600">
											{quotation.globalSeriesName || '-'}
										</td>
										<td className="px-3 py-2 text-right">
											{formatCurrency(totals.subtotal)}
										</td>
										<td className="px-3 py-2 text-right">
											{formatCurrency(totals.transportation)}
										</td>
										<td className="px-3 py-2 text-right">
											{formatCurrency(totals.discount)}
										</td>
										<td className="px-3 py-2 text-right font-semibold">
											{formatCurrency(totals.total)}
										</td>
										<td className="px-3 py-2 text-right">
											{quotation.variantApplyResult?.updatedCount ?? '-'}
										</td>
										<td className="px-3 py-2 text-right">
											{quotation.variantApplyResult?.skippedItems.length ?? '-'}
										</td>
										<td className="px-3 py-2 text-right">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-7 px-2 text-xs"
												onClick={() => onOpenVariant(quotation.id)}
											>
												<ExternalLink className="w-3.5 h-3.5" />
												Open
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="overflow-auto rounded-md border border-slate-200">
					<table className="w-full min-w-[720px] text-xs">
						<thead className="bg-slate-50 text-slate-600">
							<tr>
								<th className="px-3 py-2 text-left font-semibold">Item/Product</th>
								<th className="px-3 py-2 text-right font-semibold">Base total</th>
								{orderedVariants.map(variant => (
									<th
										key={variant.id}
										className="px-3 py-2 text-right font-semibold"
									>
										{variant.variantName}
									</th>
								))}
								<th className="px-3 py-2 text-right font-semibold">
									Difference vs Base
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(row => {
								const minVariantTotal = row.variantTotals.length
									? Math.min(...row.variantTotals)
									: row.baseTotal;
								return (
									<tr key={row.key} className="border-t border-slate-100">
										<td className="px-3 py-2 text-slate-800">{row.label}</td>
										<td className="px-3 py-2 text-right">
											{formatCurrency(row.baseTotal)}
										</td>
										{row.variantTotals.map((total, index) => (
											<td
												key={`${row.key}-${orderedVariants[index]?.id}`}
												className="px-3 py-2 text-right"
											>
												{formatCurrency(total)}
											</td>
										))}
										<td className="px-3 py-2 text-right font-medium">
											{formatCurrency(minVariantTotal - row.baseTotal)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{orderedVariants.some(
					variant => (variant.variantApplyResult?.skippedItems.length || 0) > 0,
				) && (
					<div className="rounded-md border border-amber-200 bg-amber-50 p-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
							<AlertTriangle className="w-4 h-4" />
							Skipped Items
						</div>
						<div className="mt-2 grid gap-2">
							{orderedVariants.map(variant =>
								variant.variantApplyResult?.skippedItems.length ? (
									<div key={variant.id} className="text-xs text-amber-900">
										<div className="font-medium">{variant.variantName}</div>
										<ul className="mt-1 space-y-0.5">
											{variant.variantApplyResult.skippedItems.map(item => (
												<li key={`${variant.id}-${item.id}`}>
													{item.label}: {getSkippedReason(item.reason)}
												</li>
											))}
										</ul>
									</div>
								) : null,
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
