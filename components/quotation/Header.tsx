import React from 'react';

interface HeaderProps {
	isItemsPage?: boolean;
	pageNumber?: number;
}

const Header: React.FC<HeaderProps> = () => (
	<div className="bg-slate-100 border-b border-slate-200 mt-2 mb-2">
		<div className="flex justify-between items-center py-4">
			<div className="flex-1 flex justify-center">
				<img
					src={
						typeof window !== 'undefined'
							? `${window.location.origin}/image/FLAT_LOGO.png`
							: '/image/FLAT_LOGO.png'
					}
					alt="Solution Provider"
					className="h-10 w-auto"
				/>
			</div>
		</div>
	</div>
);

export default Header;
