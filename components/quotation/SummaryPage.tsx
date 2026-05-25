import React from 'react';
import moment from 'moment';
import Header from './Header';
import Footer from './Footer';
import {
	ClientInfo,
	PreviewQuotationItem,
	QuotationDetails,
	getQuotationQuantityType,
} from './types';
import { BiSolidRightArrow } from 'react-icons/bi';

interface SummaryPageProps {
	clientInfo: ClientInfo;
	quotationDetails: QuotationDetails;
	finalTotal: number;
	transportation: number;
	discount: number;
	quotationItems: PreviewQuotationItem[];
	lowerInkMode?: boolean;
	showDate?: boolean;
}

const SummaryPage: React.FC<SummaryPageProps> = ({
	clientInfo,
	quotationDetails,
	finalTotal,
	transportation,
	discount,
	quotationItems,
	lowerInkMode = false,
	showDate = true,
}) => {
	// Check if any items have quantity > 0
	const hasItemsWithQuantity = quotationItems.some(
		item =>
			getQuotationQuantityType(item) === 'JOB' ||
			(item.sqft || 0) > 0 ||
			(item.quantity || 0) > 0,
	);

	// Format the date using moment
	const formattedDate = moment(quotationDetails.date).format(
		'dddd, MMMM DD, YYYY',
	);

	// Define color classes based on lowerInkMode
	const primaryBg = lowerInkMode ? 'bg-[#006A91]/50' : 'bg-[#006A91]';
	const primaryBgLight = lowerInkMode ? 'bg-[#006A91]/2.5' : 'bg-[#006A91]/5';
	const primaryBgLighter = lowerInkMode ? 'bg-[#006A91]/5' : 'bg-[#006A91]/10';
	const primaryText = lowerInkMode ? 'text-[#006A91]/50' : 'text-[#006A91]';
	const primaryBorder = lowerInkMode
		? 'border-[#006A91]/10'
		: 'border-[#006A91]/20';
	const primaryBorderStrong = lowerInkMode
		? 'border-[#006A91]/15'
		: 'border-[#006A91]/30';

	return (
		<div className="page min-h-screen pb-8">
			{/* Header */}
			<Header />

			<div className="px-6">
				{/* Date and Client Info Section */}
				<div className="mb-1">
					<div className="mb-2">
						<div className="flex items-start justify-between">
							<p className="text-xs text-gray-800 font-semibold">
								{clientInfo.name || ''}
								{clientInfo.phone && (
									<span className="text-gray-600">
										({clientInfo.phone || ''})
									</span>
								)}
							</p>
							{showDate && (
								<p className="text-xs text-gray-600">
									<span className="font-semibold">{formattedDate}</span>
								</p>
							)}
						</div>

						<p className="text-xs text-gray-600">
							<span className="font-semibold">Project Location:</span>
							{clientInfo.address || ''}
						</p>
						<p className="text-xs text-gray-600">
							<span className="font-semibold">Subject:</span> Estimated Cost for
							Interior Project.
						</p>
					</div>

					<div className="mb-2">
						<p className="text-xs text-gray-800">Dear Valued Customer,</p>
						<p className="text-xs text-gray-600 mt-1">
							We are pleased to provide the cost estimate for your requested
							items.
						</p>
					</div>
				</div>

				{/* Summary Table */}
				<div className="mb-1">
					<div
						className={`${primaryBgLight} border ${primaryBorder} rounded-lg overflow-hidden`}
					>
						<div className={`${primaryBg} text-white text-left py-1 px-3`}>
							<h2 className="text-sm font-bold">SUMMARY</h2>
						</div>
						<table className="w-full">
							<thead className={primaryBgLighter}>
								<tr>
									<th
										className={`px-3 py-0.5 text-left font-semibold ${primaryText} border-b ${primaryBorder} text-xs`}
									>
										SL
									</th>
									<th
										className={`px-3 py-0.5 text-left font-semibold ${primaryText} border-b ${primaryBorder} text-xs`}
									>
										DESCRIPTION OF ITEM
									</th>
									<th
										className={`px-3 py-0.5 text-center font-semibold ${primaryText} border-b ${primaryBorder} text-xs`}
									>
										SQFT
									</th>
									<th
										className={`px-3 py-0.5 text-center font-semibold ${primaryText} border-b ${primaryBorder} text-xs`}
									>
										AMOUNT (BDT)
									</th>
								</tr>
							</thead>
							<tbody className="bg-white">
								<tr className={`border-b ${primaryBorder}`}>
									<td className="px-3 py-1 text-center font-medium text-gray-800 text-xs">
										A
									</td>
									<td className="px-3 py-1 font-medium text-gray-800 text-xs">
										TOTAL AMOUNT FOR CABINET AND INTERIOR WORK
									</td>
									<td className="px-3 py-1 text-center font-bold text-gray-900 text-xs">
										{finalTotal - transportation - discount > 0 ? (
											<>
												BDT{' '}
												{(
													finalTotal -
													transportation -
													discount
												).toLocaleString()}
											</>
										) : (
											''
										)}
									</td>
									<td className="px-3 py-1 text-center text-gray-600 text-xs"></td>
								</tr>
								<tr className={`border-b ${primaryBorder}`}>
									<td className="px-3 py-0.5 text-center font-medium text-gray-800 text-xs">
										B
									</td>
									<td className="px-3 py-0.5 font-medium text-gray-800 text-xs">
										TRANSPORTATION COST
									</td>
									<td className="px-3 py-0.5 text-center font-bold text-gray-900 text-xs">
										BDT {transportation.toLocaleString()}
									</td>
									<td className="px-3 py-0.5 text-center text-xs text-gray-600">
										Details bill will be enclosed
									</td>
								</tr>
								{/* Discount - Only show if discount > 0 */}
								{discount > 0 && (
									<tr className={`border-b ${primaryBorder}`}>
										<td className="px-3 py-0.5 text-center font-medium text-gray-800 text-xs">
											C
										</td>
										<td className="px-3 py-0.5 font-medium text-gray-800 text-xs">
											DISCOUNT
										</td>
										<td className="px-3 py-0.5 text-center font-bold text-red-600 text-xs">
											-BDT {discount.toLocaleString()}
										</td>
										<td className="px-3 py-0.5 text-center text-gray-600 text-xs"></td>
									</tr>
								)}
								{hasItemsWithQuantity ? (
									<tr
										className={`${primaryBgLight} border-b-2 ${primaryBorderStrong}`}
									>
										<td
											className={`px-3 py-2 text-center font-bold ${primaryText} text-xs`}
										></td>
										<td
											className={`px-3 py-2 font-bold ${primaryText} text-sm`}
										>
											TOTAL AMOUNT IN TAKA
										</td>
										<td
											className={`px-3 py-2 text-center font-bold ${primaryText} text-sm`}
										>
											BDT {finalTotal.toLocaleString()}
										</td>
										<td className="px-3 py-2 text-center text-gray-600 text-xs"></td>
									</tr>
								) : (
									<tr
										className={`${primaryBgLight} border-b-2 ${primaryBorderStrong}`}
									>
										<td
											className={`px-3 py-3 text-center font-bold ${primaryText} text-xs`}
										></td>
										<td
											className={`px-3 py-3 font-bold ${primaryText} text-sm`}
										>
											TOTAL AMOUNT IN TAKA
										</td>
										<td
											className={`px-3 py-3 text-center font-bold ${primaryText} text-sm`}
										>
											{/* Empty space when no items have quantity */}
										</td>
										<td className="px-3 py-3 text-center text-gray-600 text-xs"></td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Terms and Conditions */}
				<div className="mb-1">
					<div className={`${primaryBg} text-white p-1 rounded-t-lg`}>
						<h3 className="font-bold text-sm">Terms & Conditions</h3>
					</div>
					<div
						className={`${primaryBgLight} py-1 px-3 rounded-b-lg border ${primaryBorder} border-t-0`}
					>
						<div className="text-[10px] text-gray-700">
							<div>
								<div
									className={`font-semibold ${primaryText} flex items-center justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1" /> Payment
									Milestones: <span></span>
								</div>
								<div className="ml-3">
									<div>
										a. Contract value &lt; BDT 5,00,000: 60% on order, 40% on
										completion.
									</div>
									<div>
										b. Contract value BDT 5,00,000 – 10,00,000: 50% on order,
										40% on delivery, 10% on completion.
									</div>
									<div>
										c. Contract value &gt; BDT 10,00,000: 40% on order, 40% on
										delivery, 20% on completion.
									</div>
									<div>
										d. Contract value &gt; BDT 20,00,000: 40% on order, 30% on
										delivery, 20% on 75% of total work has done , 10% on
										completion.
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-center justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1" /> Work Progress
								</div>
								<div className="ml-3">
									<div>
										a. ⁠50% Work will count when completed a visible structure
										of cabinets.
									</div>
									<div>
										b. ⁠75% Work will count when a visible structure of cabinets
										is completed without ﬁxing its front shutter.
									</div>
									<div>
										c. ⁠95% Work will count when completed a visible structure
										of cabinets with ﬁxing its front shutter & Edge-banding.
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-center justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1" /> Mode of
									Payment:
									<span className="text-gray-800 font-normal ml-1">
										All remittances shall be made in favour of "Solution
										Provider" by crossed cheque, demand draft, RTGS/NPSB bank
										transfer or approved mobile financial service.
									</span>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-center justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1" /> Bank Details
								</div>
								<div className="ml-3">
									<div>
										Midland Bank Ltd., Nurjahan Road Branch{' '}
										<span>A/C 5514 1050 0002 63</span>
									</div>
									<div>
										United Commercial Bank Ltd., Mohammadpur Branch{' '}
										<span>A/C 0502 1010 0000 7511</span>
									</div>
									<div>
										Dutch-Bangla Bank Ltd., Mohammadpur Branch{' '}
										<span>A/C 2581 1001 7504</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Logistics & Handling:
										<span className="text-gray-800 font-normal ml-1">
											A flat charge of BDT {transportation.toLocaleString()} is
											payable for inbound freight, on-site unloading and basic
											hoisting, stair-carry or out-of-hours handling will be
											separately quoted.
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Delivery & Installation Schedule:
										<span className="text-gray-800 font-normal ml-1">
											Production and dispatch shall commence upon receipt of the
											first milestone payment. Installation will be completed
											within the number of working days stated in the Project
											Schedule annexed hereto, subject to site readiness and
											free access during normal working hours.
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Price Validity:
										<span className="text-gray-800 font-normal ml-1">
											Quotation valid for five (5) days; thereafter subject to
											revision.
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Taxes & Duties:
										<span className="text-gray-800 font-normal ml-1">
											All amounts are quoted exclusive of Value Added Tax (VAT),
											Advance Income Tax (AIT) or any other statutory levy that
											may be imposed by the competent authorities, which shall
											be borne by the Client.
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Scope Exclusions:
										<span className="text-gray-800 font-normal ml-1">
											Unless expressly listed, the following items are excluded:
											electrical wiring, ceiling light fittings, switch-sockets,
											wall/ceiling painting, floor polishing/cleaning, granite
											or quartz countertops, under-cabinet lighting, Kitchen
											Hood Installation and any civil or plumbing work.
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>Warranty</div>
								</div>
								<div className="ml-3">
									<div>
										a. <span className="font-medium">Product:</span> Solution
										Provider warrants that its factory-built components shall be
										free from material manufacturing defects for 6–12 months
										(series-specific) from the date of hand-over. This warranty
										does not cover normal wear & tear, accidental damage, water
										ingress (except in the Water-Resistant Series), or
										consequential loss.
									</div>
									<div>
										b. <span className="font-medium">Service:</span> Any
										warranty service will be scheduled within seven (7) working
										days of written notice and completed during normal business
										hours.
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Token / Advance Payment:
										<span className="text-gray-800 font-normal ml-1">
											Initial deposits are non-refundable. If the Client cancels
											the contract, the deposit may be applied to alternative
											cabinet work within three (3) months, less a
											site-evaluation and other charges.
										</span>
									</div>
								</div>
							</div>

							<div>
								<div
									className={`font-semibold ${primaryText} flex items-start justify-start`}
								>
									<BiSolidRightArrow className="text-xs mr-1 mt-[2px] shrink-0" />
									<div>
										Governing Law:
										<span className="text-gray-800 font-normal ml-1">
											This agreement shall be construed and enforced in
											accordance with the laws of the People's Republic of
											Bangladesh. Any dispute shall be subject to the exclusive
											jurisdiction of the courts of Bangladesh.
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Payment Methods */}
				<div className="mb-3">
					<div className={`${primaryBg} text-white p-1 rounded-t-lg`}>
						<h3 className="font-bold text-sm">We Also Accept</h3>
					</div>
					<div
						className={`${primaryBgLight} p-1 rounded-b-lg border ${primaryBorder} border-t-0`}
					>
						<div className="flex-1 flex justify-center">
							<img
								src={
									typeof window !== 'undefined'
										? `${window.location.origin}/image/Payment_ICON.png`
										: '/image/Payment_ICON.png'
								}
								alt="Solution Provider"
								className="h-8 w-auto"
							/>
						</div>
					</div>
				</div>

				{/* Signatures */}
				<div className="mt-10">
					<div className="flex justify-between items-center">
						<div className="text-left flex flex-col items-center">
							<div className="border-b border-gray-400 w-40"></div>
							<p className="text-xs font-semibold text-gray-800">Consultant</p>
						</div>
						<div className="text-right flex flex-col items-center">
							<div className="border-b border-gray-400 w-40"></div>
							<p className="text-xs font-semibold text-gray-800">
								Deputy Project Engineer
							</p>
						</div>
						<div className="text-right flex flex-col items-center">
							<div className="border-b border-gray-400 w-40 mx-auto"></div>
							<p className="text-xs font-semibold text-gray-800">
								Client's Approval:
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Footer */}
			<Footer lowerInkMode={lowerInkMode} />
		</div>
	);
};

export default SummaryPage;
