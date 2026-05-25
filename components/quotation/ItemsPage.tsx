import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { PreviewQuotationItem, getQuotationQuantityType } from './types';

interface ItemsPageProps {
	items: PreviewQuotationItem[];
	pageNumber: number;
	lowerInkMode?: boolean;
	showPageNumber?: boolean;
}

const ItemsPage: React.FC<ItemsPageProps> = ({
	items,
	pageNumber,
	lowerInkMode = false,
	showPageNumber = true,
}) => {
	// Define color classes based on lowerInkMode
	const primaryBg = lowerInkMode ? 'bg-[#006A91]/50' : 'bg-[#006A91]';
	const primaryBgLight = lowerInkMode ? 'bg-[#006A91]/5' : 'bg-[#006A91]/10';
	const primaryText = lowerInkMode ? 'text-[#006A91]/50' : 'text-[#006A91]';
	const primaryBorder = lowerInkMode
		? 'border-[#006A91]/25'
		: 'border-[#006A91]';
	const specBlockClass = `text-[11px] leading-[1.22] rounded border-l-2 ${primaryBorder} pl-1 py-[1px] mb-[1px]`;
	const specTextClass = 'text-black ml-1 leading-[1.22] font-segoe font-thin';

	const getQuantityDisplay = (item: PreviewQuotationItem) => {
		const quantityType = getQuotationQuantityType(item);
		if (quantityType === 'NOS') {
			return item.quantity && item.quantity > 0 ? item.quantity : '';
		}
		if (quantityType === 'JOB') return 'JOB';
		return item.sqft && item.sqft > 0 ? item.sqft : '';
	};

	const getUnitDisplay = (item: PreviewQuotationItem) => {
		const quantityType = getQuotationQuantityType(item);
		if (quantityType === 'NOS') return item.quantity && item.quantity > 0 ? 'nos' : '';
		if (quantityType === 'JOB') return '';
		return item.sqft && item.sqft > 0 ? 'sft' : '';
	};

	const getRateDisplay = (item: PreviewQuotationItem) => {
		const quantityType = getQuotationQuantityType(item);
		const unitPrice = item.unitPrice ?? item.pricePerSqft;
		if (quantityType === 'NOS') {
			return unitPrice && unitPrice > 0 ? `${unitPrice.toLocaleString()}/nos` : '';
		}
		if (quantityType === 'JOB') {
			return unitPrice && unitPrice > 0 ? unitPrice.toLocaleString() : '';
		}
		return item.pricePerSqft && item.pricePerSqft > 0
			? `${item.pricePerSqft.toLocaleString()}/sft`
			: '';
	};

	const renderRichDescription = (description?: string) => {
		if (!description) return null;
		return (
			<div
				className="text-black text-[11px] leading-[1.22] font-segoe focus:outline-none [&_p]:my-0 [&_p]:leading-[1.22] [&_ul]:my-0 [&_ol]:my-0 [&_li]:my-0 [&_ul]:list-none [&_ol]:list-decimal [&_ol]:pl-3 [&_li]:relative [&_li]:pl-2 [&_li]:py-[1px] [&_li]:leading-[1.22] [&_li]:border [&_li]:border-[#046288] [&_li]:rounded-sm [&_li]:mb-[1px]"
				dangerouslySetInnerHTML={{
					__html: description.replace(/&nbsp;/g, ' '),
				}}
			/>
		);
	};

	const renderNote = (note?: string) =>
		note ? (
			<p className={`text-[11px] font-bold ${primaryText} mt-[2px] leading-[1.22]`}>
				{note}
			</p>
		) : null;

	return (
		<div className="relative page min-h-screen pb-10 print:pb-28">
			{/* Header */}
			<Header isItemsPage={true} pageNumber={pageNumber} />

			{/* Items Table */}
			<div className="mb-1 px-6">
				{/* Show items that have either a series name OR are manual */}
				{items
					.filter(i =>
						Boolean(
							i?.isManual || (i?.seriesName && i.seriesName.trim().length > 0),
						),
					)
					.map((item, index) => {
						return (
							<div key={item.id} className="mb-1 border border-gray-400">
								{/* Applicable Area Header - Only show if applicationArea has value */}
								{item.applicationArea && (
									<div className={`${primaryBg} px-2 py-[1px] text-center`}>
										<span className="text-sm font-bold text-white">
											{item.applicationArea.toUpperCase()}
										</span>
									</div>
								)}

								{/* Application Name Header */}
								<div
									className={`${primaryBgLight} text-gray-900 text-center py-[1px]`}
								>
									<span className="text-xs font-bold">
										{item.applicationName?.toUpperCase() || 'APPLICATION NAME'}
									</span>
								</div>

								{/* Main Content Table */}
								<table className="w-full table-auto border-collapse text-black">
									<colgroup>
										<col className="w-8" />
										<col className="w-8" />
										<col />
										<col className="w-16" />
										<col className="w-12" />
										<col className="w-20" />
										<col className="w-24" />
									</colgroup>
									<thead>
										<tr className={`${primaryBgLight} text-black`}>
											<th className="border border-gray-400 px-1 py-[2px] text-[10px] md:text-xs font-bold text-center">
												{' '}
											</th>
											<th className="border border-gray-400 px-1 py-[2px] text-[10px] md:text-xs font-bold text-center">
												SL
											</th>

											<th className="border border-gray-400 px-2 py-[2px] text-[10px] md:text-xs font-bold text-left">
												DESCRIPTION OF ITEMS
											</th>
											<th className="border border-gray-400 px-1 py-[2px] text-[10px] md:text-xs font-bold text-center">
												QUANTITY
											</th>
											<th className="border border-gray-400 px-1 py-[2px] text-[10px] md:text-xs font-bold text-center">
												UNIT
											</th>
											<th className="border border-gray-400 px-1 py-[2px] text-[10px] md:text-xs font-bold text-center">
												RATE IN TK
											</th>
											<th className="border border-gray-400 px-1 py-[2px] text-[10px] md:text-xs font-bold text-center">
												AMOUNT IN TK
											</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											{/* Vertical Series Name */}
											<td
												className={`border border-gray-400 text-center align-middle ${
													lowerInkMode ? 'bg-[#006A91]/2.5' : 'bg-[#006A91]/5'
												} relative`}
												rowSpan={1}
											>
												<div className="flex flex-col items-center justify-center h-full">
													<span
														className={`whitespace-nowrap text-xs font-bold ${primaryText} py-2`}
														style={{
															writingMode: 'vertical-rl',
															textOrientation: 'mixed',
															transform: 'rotate(180deg)',
														}}
													>
														{item.seriesName?.toUpperCase() || ''}
													</span>
												</div>
											</td>

											{/* Serial Number */}
											<td className="border border-gray-400 px-1 py-[2px] text-center text-xs align-middle leading-[1.22]">
												{(pageNumber - 1) * 2 + index + 1 || ''}
											</td>

											{/* Description Column */}
											<td className="border border-gray-400 px-1.5 py-[2px] text-[11px] leading-[1.22] align-top whitespace-normal break-words">
												<div className="space-y-[1px]">
													{/* Generic Name Header */}
													<div className="font-bold text-black text-[11px] leading-[1.22]">
														Generic Name : {item.productName || ''}
													</div>
													{item.applicationName && (
														<div className="text-[11px] font-semibold text-black leading-[1.22]">
															Application : {item.applicationName}
														</div>
													)}

													{item.isManual ? (
														/* ── Manual: show freeform description & note ── */
														<div className="space-y-[1px]">
															{renderRichDescription(item.description)}
															{renderNote(item.note)}
														</div>
													) : (
														/* ── Standard: existing material spec block ── */
														<>
															{item.specification ? (
																<div className="space-y-0">
																	{item.specification.hasBodyStructure && (
																		<>
																			<div className={specBlockClass}>
																				<span className="font-medium">
																					{item.specification.configs?.bodyStructure?.board?.name || ''}
																				</span>
																				<div className={specTextClass}>
																					For structural base, body, partition, shelf & frames.
																					<br />
																					{item.specification.configs?.bodyStructure?.board?.name
																						?.toLowerCase()
																						?.includes('chips') ||
																					item.specification.configs?.bodyStructure?.board?.name
																						?.toLowerCase()
																						?.includes('mdf') ? (
																						<>
																							Front side & backside both pre-fabricated (MF)
																							resin coated. <br />
																							Pre-fabricated surfaces are available in matte &
																							embossed types In four solid colors, patterns, or
																							wood grains based on availability. <br />
																							Simple scratch-abrasion-resistant surface.
																						</>
																					) : (
																						''
																					)}
																				</div>
																			</div>
																			<div className={specBlockClass}>
																				<span className="font-medium">
																					{item.specification.configs?.bodyStructure?.edging?.name ||
																						'PVC Edge banding Finish'}
																				</span>
																				<div className={specTextClass}>
																					For Inside on structural body & frame.
																				</div>
																			</div>
																		</>
																	)}

																	{item.specification.hasFront && (
																		<>
																			<div className={specBlockClass}>
																				<span className="font-medium">
																					{item.specification.configs?.front?.board?.name || ''}
																				</span>
																				<div className={specTextClass}>
																					For Front Shutter.
																					{item.specification.configs?.front?.board?.name
																						?.toLowerCase()
																						?.includes('chips') ||
																					item.specification.configs?.front?.board?.name
																						?.toLowerCase()
																						?.includes('mdf') ? (
																						<>
																							Front side & backside both pre-fabricated (MF)
																							resin coated. <br />
																							Pre-fabricated surfaces are available in matte &
																							embossed types In four solid colors, patterns, or
																							wood grains based on availability. <br />
																							Simple scratch-abrasion-resistant surface.
																						</>
																					) : (
																						''
																					)}
																				</div>
																			</div>
																			<div className={specBlockClass}>
																				<span className="font-medium">
																					{item.specification.configs?.front?.edging?.name || ''}
																				</span>
																				<div className={specTextClass}>
																					For Front Shutter.
																				</div>
																			</div>
																		</>
																	)}

																	<div className={specBlockClass}>
																		<span className="font-medium">Push-Touch Latch Series</span>
																		<div className={specTextClass}>
																			For effortless touch opening system.
																		</div>
																	</div>
																	{item.applicationName === 'Hanging Middle Cabinet' && (
																		<div className={specBlockClass}>
																			<span className="font-medium">5mm Clear Glas.</span>
																			<div className={specTextClass}>
																				For Central Glass Pannel.
																			</div>
																		</div>
																	)}
																	<div className={specBlockClass}>
																		<span className="font-medium">
																			{item.specification.hardware?.name || ''} Hardware & Hinges
																		</span>
																		<div className={specTextClass}>
																			For Front Shutters.
																		</div>
																	</div>
																</div>
															) : (
																renderRichDescription(item.description)
															)}
															{item.productName === 'Hanging Middle Cabinet' && (
																<p className={`text-[11px] font-bold ${primaryText} leading-[1.22] mt-[1px]`}>
																	if the shelf installed using glass instead of engineered
																	wood, the price will be increase by 100/- per SQFT
																</p>
															)}
															{item.specification && renderRichDescription(item.description)}
															{renderNote(item.note)}
														</>
													)}
												</div>
											</td>

											{/* Quantity */}
											<td className="border border-gray-400 px-1 py-[2px] text-center text-xs font-medium align-middle leading-[1.22]">
												{getQuantityDisplay(item)}
											</td>

											{/* Unit */}
											<td className="border border-gray-400 px-1 py-[2px] text-center text-xs align-middle leading-[1.22]">
												{getUnitDisplay(item)}
											</td>

											{/* Rate */}
											<td className="border border-gray-400 px-1 py-[2px] text-center text-xs align-middle leading-[1.22]">
												{getRateDisplay(item)}
											</td>

											{/* Amount */}
											<td className="border border-gray-400 px-1 py-[2px] text-center text-xs font-bold align-middle leading-[1.22]">
												{item.totalPrice && item.totalPrice > 0
													? `${item.totalPrice.toLocaleString()}/-`
													: ''}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						);
					})}
			</div>

			{/* Footer */}
			<Footer
				pageNumber={pageNumber}
				lowerInkMode={lowerInkMode}
				showPageNumber={showPageNumber}
			/>
		</div>
	);
};

export default ItemsPage;
