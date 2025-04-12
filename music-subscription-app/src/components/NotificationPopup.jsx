import React, { useEffect, useState } from 'react'

const NotificationPopup = ({ message, type = 'success', duration = 3000, onClose }) => {
	const [isVisible, setIsVisible] = useState(true);
	const [isClosing, setIsClosing] = useState(false);

	useEffect(() => {
		// Start fade out animation after duration
		const timer = setTimeout(() => {
			setIsClosing(true);

			// Remove component after animation ends
			const animationTimer = setTimeout(() => {
				setIsVisible(false);
			}, 300); // Match with CSS transition duration
			
			return () => clearTimeout(animationTimer);
		}, duration);

		return () => clearTimeout(timer);
	}, [duration, onclose]);

	const handleClick = () => {
		setIsClosing(true);
		setTimeout(() => {
			setIsVisible(false);
			if (onclose) onclose();
		}, 300) // Match with CSS transition duration
	};

	if (!isVisible) return null;

	const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
	
	return (
		<div
			className={`fixed bottom-8 right-8 z-50 flex items-center px-6 py-4 rounded-md shadow-lg text-black ${bgColor} transition-all duration-300 ${isClosing ? 'opacity-0 translate-y-2' : 'opacity-100'
				}`}
			onClick={handleClick}
		>
			<div className="mr-3">
				{type === 'success' ? (
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				) : (
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				)}
			</div>
			<p className="font-medium">{message}</p>
		</div>
	)
}

export default NotificationPopup
