import React, { useState } from 'react';
import { Trash2, Pencil, BookOpen, LayoutGrid, Layers, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectWithIcon } from '@/components/ui/select-with-icon';
import { QuotationItem, QuotationQuantityType } from './types';
import { Product, ProductSeries } from '@/store/slices/products';

interface QuotationItemCardProps {
	item: QuotationItem;
	index: number;
	totalItemsCount: number;
	products: Product[];
	onRemove: (id: string) => void;
	onManualFieldChange: (
		index: number,
		field: keyof QuotationItem,
		value: string | number,
	) => void;
	onQuantityFieldChange: (
		index: number,
		changes: Partial<QuotationItem>,
	) => void;
	onQuantityTypeChange: (
		index: number,
		quantityType: QuotationQuantityType,
	) => void;
	/** Called when user picks a product+series in Normal mode — patches all prefilled fields at once */
	onProductSelect: (
		index: number,
		product: Product,
		series: ProductSeries,
	) => void;
}

interface QuantityControlsProps {
	index: number;
	item: QuotationItem;
	quantityType: QuotationQuantityType;
	unitPrice: number;
	editableRate: boolean;
	onQuantityTypeChange: (index: number, quantityType: QuotationQuantityType) => void;
	onQuantityFieldChange: (index: number, changes: Partial<QuotationItem>) => void;
}

const QuantityControls: React.FC<QuantityControlsProps> = ({
	index,
	item,
	quantityType,
	unitPrice,
	editableRate,
	onQuantityTypeChange,
	onQuantityFieldChange,
}) => (
	<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
		<SelectWithIcon
			id={`quantity-type-${index}`}
			label="Quantity Type"
			icon={Layers}
			value={quantityType}
			onChange={value =>
				onQuantityTypeChange(index, value as QuotationQuantityType)
			}
			options={[
				{ value: 'SQFT', label: 'SQFT' },
				{ value: 'NOS', label: 'NOS' },
				{ value: 'JOB', label: 'JOB' },
			]}
		/>

		{quantityType === 'SQFT' && (
			<>
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">
						Area / SQFT
					</label>
					<Input
						type="number"
						value={item.sqft || ''}
						onChange={e =>
							onQuantityFieldChange(index, {
								sqft: parseFloat(e.target.value) || 0,
							})
						}
						placeholder="Sqft"
						min="0"
						step="0.01"
						className="h-8 text-sm"
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">
						Rate / SQFT (৳)
					</label>
					{editableRate ? (
						<Input
							type="number"
							value={item.pricePerSqft || ''}
							onChange={e => {
								const price = parseFloat(e.target.value) || 0;
								onQuantityFieldChange(index, {
									pricePerSqft: price,
									unitPrice: price,
								});
							}}
							placeholder="Rate"
							min="0"
							className="h-8 text-sm"
						/>
					) : (
						<div className="px-3 py-1 bg-white border border-violet-200 rounded-md text-sm h-8 flex items-center text-gray-600">
							৳{(item.pricePerSqft || 0).toLocaleString()}
						</div>
					)}
				</div>
			</>
		)}

		{quantityType === 'NOS' && (
			<>
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">
						Quantity
					</label>
					<Input
						type="number"
						value={item.quantity || ''}
						onChange={e =>
							onQuantityFieldChange(index, {
								quantity: parseFloat(e.target.value) || 0,
							})
						}
						placeholder="Qty"
						min="0"
						step="1"
						className="h-8 text-sm"
					/>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">
						Unit Price (৳)
					</label>
					<Input
						type="number"
						value={unitPrice || ''}
						onChange={e =>
							onQuantityFieldChange(index, {
								unitPrice: parseFloat(e.target.value) || 0,
							})
						}
						placeholder="Unit price"
						min="0"
						className="h-8 text-sm"
						readOnly={!editableRate}
					/>
				</div>
			</>
		)}

		{quantityType === 'JOB' && (
			<div>
				<label className="block text-xs font-medium text-gray-700 mb-1">
					Job Price (৳)
				</label>
				<Input
					type="number"
					value={unitPrice || ''}
					onChange={e =>
						onQuantityFieldChange(index, {
							quantity: 1,
							unitPrice: parseFloat(e.target.value) || 0,
						})
					}
					placeholder="Job price"
					min="0"
					className="h-8 text-sm"
					readOnly={!editableRate}
				/>
			</div>
		)}

		<div>
			<label className="block text-xs font-medium text-gray-500 mb-1">
				Total Price
			</label>
			<div
				className={`px-3 py-1 bg-white border rounded-md text-sm h-8 flex items-center font-semibold ${
					editableRate
						? 'border-amber-300 text-amber-800'
						: 'border-violet-300 text-violet-800'
				}`}
			>
				৳{item.totalPrice.toLocaleString()}
			</div>
		</div>
	</div>
);

const QuotationItemCard: React.FC<QuotationItemCardProps> = ({
	item,
	index,
	totalItemsCount,
	products,
	onRemove,
	onManualFieldChange,
	onQuantityFieldChange,
	onQuantityTypeChange,
	onProductSelect,
}) => {
	// Each card tracks its own mode independently
	const [isEditMode, setIsEditMode] = useState(false);

	// ── drag-and-drop ──
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const dragStyle: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 50 : 'auto',
	};

	// ── helpers for Normal mode selects ──
	const selectedProduct = products.find(p => p.id === item.productId) ?? null;
	const selectedSeries =
		selectedProduct?.series.find(s => s.id === item.seriesId) ?? null;
	const quantityType = item.quantityType ?? 'SQFT';
	const unitPrice = item.unitPrice ?? item.pricePerSqft ?? 0;

	const handleProductChange = (productId: string) => {
		const product = products.find(p => p.id === productId);
		if (!product) return;
		// Auto-pick the first series
		const series = product.series[0];
		if (series) {
			onProductSelect(index, product, series);
		}
	};

	const handleSeriesChange = (seriesId: string) => {
		if (!selectedProduct) return;
		const series = selectedProduct.series.find(s => s.id === seriesId);
		if (series) {
			onProductSelect(index, selectedProduct, series);
		}
	};



	return (
		<div
			ref={setNodeRef}
			style={dragStyle}
			className={`border rounded-lg p-3 ${
				isEditMode
					? 'bg-amber-50 border-amber-300'
					: 'bg-violet-50 border-violet-200'
			} ${isDragging ? 'shadow-2xl ring-2 ring-primary' : ''}`}
		>
			{/* ── Header ── */}
			<div className="flex items-center justify-between mb-3">
				<h4 className="font-medium text-sm flex items-center gap-1.5">
					<button
						type="button"
						{...attributes}
						{...listeners}
						className="print:hidden -ml-1 mr-0.5 p-1 rounded hover:bg-black/5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
						aria-label="Drag to reorder"
						title="Drag to reorder"
					>
						<GripVertical className="w-4 h-4" />
					</button>
					Item {index + 1}
					<span
						className={`text-xs px-1.5 py-0.5 rounded-full font-normal ${
							isEditMode
								? 'bg-amber-200 text-amber-800'
								: 'bg-violet-200 text-violet-800'
						}`}
					>
						{isEditMode ? 'Edit' : 'Normal'}
					</span>
				</h4>

				<div className="flex items-center gap-1.5">
					{/* Mode toggle */}
					<Button
						onClick={() => setIsEditMode(prev => !prev)}
						variant="outline"
						size="sm"
						className={`print:hidden h-7 text-xs gap-1 ${
							isEditMode
								? 'border-amber-400 text-amber-700 hover:bg-amber-50'
								: 'border-violet-400 text-violet-700 hover:bg-violet-100'
						}`}
					>
						{isEditMode ? (
							<>
								<BookOpen className="w-3 h-3" />
								Normal
							</>
						) : (
							<>
								<Pencil className="w-3 h-3" />
								Edit
							</>
						)}
					</Button>

					{/* Remove */}
					{totalItemsCount > 1 && (
						<Button
							onClick={() => onRemove(item.id)}
							variant="outline"
							size="sm"
							className="text-red-600 hover:text-red-700 print:hidden h-7 w-7 p-0"
						>
							<Trash2 className="w-3 h-3" />
						</Button>
					)}
				</div>
			</div>

			{/* ══════════════════════════════════════════════
			    NORMAL MODE
			══════════════════════════════════════════════ */}
			{!isEditMode && (
				<div className="space-y-3">
					{/* Row 1 — Product + Series selects */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<SelectWithIcon
						id={`product-${index}`}
						label="Product"
						icon={LayoutGrid}
						value={item.productId}
						onChange={handleProductChange}
						options={[
							{ value: '', label: '— Select product —' },
							...products.map(p => ({ value: p.id, label: p.name })),
						]}
					/>

					<SelectWithIcon
						id={`series-${index}`}
						label="Series"
						icon={Layers}
						value={item.seriesId}
						onChange={handleSeriesChange}
						options={[
							{ value: '', label: '— Select series —' },
							...(selectedProduct?.series ?? []).map(s => ({ value: s.id, label: s.name })),
						]}
						selectProps={{ disabled: !selectedProduct }}
					/>
				</div>

					{/* Row 2 — User-filled fields */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">
								Application Name
							</label>
							<Input
								value={item.applicationName}
								onChange={e =>
									onManualFieldChange(index, 'applicationName', e.target.value)
								}
								placeholder="e.g. Wardrobe"
								className="h-8 text-sm"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">
								Application Area
							</label>
							<Input
								value={item.applicationArea}
								onChange={e =>
									onManualFieldChange(index, 'applicationArea', e.target.value)
								}
								placeholder="e.g. Master Bedroom"
								className="h-8 text-sm"
							/>
						</div>

					</div>

					{/* Row 3 — quantity and total */}
					<QuantityControls
						index={index}
						item={item}
						quantityType={quantityType}
						unitPrice={unitPrice}
						editableRate={false}
						onQuantityTypeChange={onQuantityTypeChange}
						onQuantityFieldChange={onQuantityFieldChange}
					/>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{selectedSeries?.note && (
							<div className="sm:col-span-1">
								<label className="block text-xs font-medium text-gray-500 mb-1">
									Note
								</label>
								<div className="px-3 py-1 bg-white border border-violet-200 rounded-md text-xs h-8 flex items-center text-gray-500 truncate">
									{selectedSeries.note}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════
			    EDIT MODE — all fields editable
			══════════════════════════════════════════════ */}
			{isEditMode && (
				<div className="space-y-3">
					{/* Row 1 — Product Name + Series Name */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">
								Product Name
							</label>
							<Input
								value={item.productName}
								onChange={e =>
									onManualFieldChange(index, 'productName', e.target.value)
								}
								placeholder="e.g. Cabinet"
								className="h-8 text-sm"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">
								Series Name
							</label>
							<Input
								value={item.seriesName}
								onChange={e =>
									onManualFieldChange(index, 'seriesName', e.target.value)
								}
								placeholder="e.g. Premium"
								className="h-8 text-sm"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">
								Application Name
							</label>
							<Input
								value={item.applicationName}
								onChange={e =>
									onManualFieldChange(index, 'applicationName', e.target.value)
								}
								placeholder="e.g. Wardrobe"
								className="h-8 text-sm"
							/>
						</div>

						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">
								Application Area
							</label>
							<Input
								value={item.applicationArea}
								onChange={e =>
									onManualFieldChange(index, 'applicationArea', e.target.value)
								}
								placeholder="e.g. Master Bedroom"
								className="h-8 text-sm"
							/>
						</div>
					</div>

					{/* Row 2 — quantity/rate/total */}
					<QuantityControls
						index={index}
						item={item}
						quantityType={quantityType}
						unitPrice={unitPrice}
						editableRate={true}
						onQuantityTypeChange={onQuantityTypeChange}
						onQuantityFieldChange={onQuantityFieldChange}
					/>

					{/* Description */}
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">
							Description
						</label>
						<RichTextEditor
							value={item.description || ''}
							onChange={content =>
								onManualFieldChange(index, 'description', content)
							}
							placeholder="Enter item description (material specs, etc.)…"
						/>
					</div>

					{/* Note */}
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">
							Note{' '}
							<span className="font-normal text-gray-400">(optional)</span>
						</label>
						<Input
							value={item.note || ''}
							onChange={e =>
								onManualFieldChange(index, 'note', e.target.value)
							}
							placeholder="e.g. Price increases by ৳100/sqft for glass shelf"
							className="h-8 text-sm"
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default QuotationItemCard;
