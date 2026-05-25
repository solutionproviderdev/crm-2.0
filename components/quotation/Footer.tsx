import React from 'react';

interface FooterProps {
	pageNumber?: number;
	lowerInkMode?: boolean;
	showPageNumber?: boolean;
}

const Footer: React.FC<FooterProps> = ({ pageNumber, lowerInkMode = false, showPageNumber = true }) => {
	// Define conditional color classes based on lowerInkMode
	const primaryText = lowerInkMode ? 'text-slate-800' : 'text-[#006A91]';

	return (
		<div className="print:fixed print:bottom-3 print:left-0 print:right-0 bg-slate-100 border-t border-slate-200 p-1 mt-4">
			<div className="flex justify-between items-center text-xs max-w-full mx-auto px-2 relative">
				{/* Left Section - Contact Info */}
				<div className="flex flex-col space-y-1 flex-1">
					<div className="flex items-center space-x-2">
						<div className={`flex-shrink-0 w-3 h-3 ${primaryText} bg-opacity-20 rounded-full flex items-center justify-center`}>
							<svg
								className={`w-2 h-2 ${primaryText}`}
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<span className={`font-medium ${primaryText} whitespace-nowrap`}>
							Plot# 119/B (3rd Floor), Love Road, Tejgaon Industrial Area,
							Dhaka-1208
						</span>
					</div>
					<div className="flex items-center space-x-2">
						<div className={`flex-shrink-0 w-3 h-3 ${primaryText} bg-opacity-20 rounded-full flex items-center justify-center`}>
							<svg
								className={`w-2 h-2 ${primaryText}`}
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
							</svg>
						</div>
						<span className={`font-medium ${primaryText}`}>01949-654499</span>
					</div>
				</div>

				{/* Center Divider */}
				<div className={`w-px h-8 ${primaryText} bg-opacity-30 mx-4`}></div>

				{/* Right Section - Digital Contact */}
				<div className="flex flex-col space-y-1 flex-1 ml-20">
					<div className="flex items-center space-x-2">
						<div className={`flex-shrink-0 w-3 h-3 ${primaryText} bg-opacity-20 rounded-full flex items-center justify-center`}>
							<svg
								className={`w-2 h-2 ${primaryText}`}
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
								<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
							</svg>
						</div>
						<span className={`font-medium ${primaryText}`}>
							info@solutionprovider.com.bd
						</span>
					</div>
					<div className="flex items-center space-x-2">
						<div className={`flex-shrink-0 w-3 h-3 ${primaryText} bg-opacity-20 rounded-full flex items-center justify-center`}>
							<svg
								className={`w-2 h-2 ${primaryText}`}
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118C6.004 6.262 4.97 7.52 4.083 9zM10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 2c-.424 0-.84.04-1.25.115-.562 1.31-.902 2.969-.902 4.885s.34 3.575.902 4.885c.41.075.826.115 1.25.115s.84-.04 1.25-.115c.562-1.31.902-2.969.902-4.885s-.34-3.575-.902-4.885A6.019 6.019 0 0010 4z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<span className={`font-medium ${primaryText}`}>
							www.solutionprovider.com.bd
						</span>
					</div>
				</div>

				{/* Page Number */}
				{showPageNumber && pageNumber && (
					<div className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${primaryText} opacity-50 font-bold text-sm`}>
						Page {pageNumber}
					</div>
				)}
			</div>
		</div>
	);
};

export default Footer;
