import React from 'react';
import SummaryPage from './SummaryPage';
import ItemsPage from './ItemsPage';
import { QuotationPreviewProps } from './types';

const QuotationPreview = React.forwardRef<
	HTMLDivElement,
	QuotationPreviewProps
>(
	(
		{
			clientInfo,
			quotationDetails,
			quotationItems,
			transportation,
			discount,
			total,
			lowerInkMode = false,
			showDate = true,
			showPageNumber = true,
		},
		ref,
	) => {
		// Calculate total and split items into pages
		const calculatedTotal = quotationItems.reduce(
			(sum, item) => sum + item.totalPrice,
			0,
		);
		const finalTotal = total || calculatedTotal;
		const ITEMS_PER_PAGE = 2;
		const itemPages = [];
		for (let i = 0; i < quotationItems.length; i += ITEMS_PER_PAGE) {
			itemPages.push(quotationItems.slice(i, i + ITEMS_PER_PAGE));
		}

		return (
			<div ref={ref} className="quotation-print-root">
				{/* Summary Page */}
				<div className="print-page">
					<SummaryPage
						clientInfo={clientInfo}
						quotationDetails={quotationDetails}
						finalTotal={finalTotal}
						transportation={transportation}
						discount={discount}
						quotationItems={quotationItems}
						lowerInkMode={lowerInkMode}
						showDate={showDate}
					/>
				</div>

				{/* Items Pages - each wrapped in a div with page break */}
				{itemPages.map((items, index) => (
					<div key={`page-${index}`} className="print-page">
						<ItemsPage
							items={items}
							pageNumber={index + 1}
							lowerInkMode={lowerInkMode}
							showPageNumber={showPageNumber}
						/>
					</div>
				))}
			</div>
		);
	},
);

QuotationPreview.displayName = 'QuotationPreview';

export default QuotationPreview;
