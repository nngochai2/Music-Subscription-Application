// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';
import NotificationPopup from '../components/NotificationPopup';

const NotificationContext = createContext();

export const useNotification = () => {
	return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
	const [notifications, setNotifications] = useState([]);

	const showNotification = (message, type = 'success', duration = 3000) => {
		const id = Date.now().toString();
		setNotifications(prev => [...prev, { id, message, type, duration }]);
		return id;
	};

	const closeNotification = (id) => {
		setNotifications(prev => prev.filter(notification => notification.id !== id));
	};

	const value = {
		showNotification,
		closeNotification
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}
			<div className="notification-container">
				{notifications.map(notification => (
					<NotificationPopup
						key={notification.id}
						message={notification.message}
						type={notification.type}
						duration={notification.duration}
						onClose={() => closeNotification(notification.id)}
					/>
				))}
			</div>
		</NotificationContext.Provider>
	);
};