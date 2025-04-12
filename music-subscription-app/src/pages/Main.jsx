import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { musicService } from '../services/apiServices';
import MusicCard from '../components/MusicCard';
import { useNotification } from '../contexts/NotificationContext';

const Main = () => {
	// User state
	const [user, setUser] = useState(null);

	// Subscription state
	const [subscriptions, setSubscriptions] = useState([]);
	const [subscriptionLoading, setSubscriptionLoading] = useState(false);

	// Query state
	const [queryParams, setQueryParams] = useState({
		title: '',
		artist: '',
		year: '',
		album: ''
	});
	const [queryResults, setQueryResults] = useState([]);
	const [queryError, setQueryError] = useState('');
	const [queryLoading, setQueryLoading] = useState(false);

	const navigate = useNavigate();

	const { showNotification } = useNotification();

	// Check if a use is logged in
	useEffect(() => {
		const loggedInUser = localStorage.getItem('user');
		if (!loggedInUser) {
			// Redirect to login if not logged in
			navigate('/login');
		} else {
			// Set user state from localStorage
			setUser(JSON.parse(loggedInUser));
		}
	}, [navigate]);

	// Load user subscription
	useEffect(() => {
		if (user) {
			loadSubscriptions();
		}
	}, [user])

	// Load user subscription 
	const loadSubscriptions = async () => {
		if (!user) return;

		try {
			setSubscriptionLoading(true);
			const response = await musicService.getSubscriptions(user.email);

			if (response.success) {
				setSubscriptions(response.subscriptions || []);
			} else {
				console.error('Failed to load subscriptions: ', response.message);
			}
		} catch (error) {
			console.error('Error loaing subscriptions: ', error);
		} finally {
			setSubscriptionLoading(false);
		}
	}

	// Handle input change for query fields
	const handleQueryChange = (e) => {
		const { name, value } = e.target;
		setQueryParams({ ...queryParams, [name]: value });
	}

	// Handle query submission
	const handleQuerySubmit = async (e) => {
		e.preventDefault();

		// Check if at least one field is filled
		const hasQuery = Object.values(queryParams).some(value => value.trim() !== '');
		if (!hasQuery) {
			setQueryError('Please enter at least one search term');
			return;
		}

		// Clear previous results and errors
		setQueryResults([]);
		setQueryError('');

		try {
			setQueryLoading(true);
			const response = await musicService.queryMusic(queryParams);

			if (response.success) {
				setQueryResults(response.music || []);
			} else {
				setQueryError(response.message || 'No result is retrieved. Please query again');
			}
		} catch (error) {
			console.error('Error during query: ', error);
			setQueryError('An error occurred during search. Please try again.');
		} finally {
			setQueryLoading(false);
		}
	}

	// Handle subscription to a song
	const handleSubscribe = async (music) => {
		if (!user) return;

		try {
			const response = await musicService.subscribeMusic(user.email, music);

			if (response.success) {
				// Show success notification
				showNotification('You have subscribed successfully!', 'success');

				// Reload subscriptions to show the newly added one
				await loadSubscriptions();
			} else {
				console.error('Subscription failed: ', response.message);

				// Show error notification
				showNotification('Subscription failed. Please try again.', 'error');
			}
		} catch (error) {
			console.error('Error during subscription:', error);
			showNotification('An error occurred. Please try again.', 'error');
		}
	}

	// Handle removing a subscription
	const handleRemoveSubscription = async (music_id) => {
		if (!user) return;

		try {
			const response = await musicService.removeSubscription(user.email, music_id);

			if (response.success) {
				// Show success notification
				showNotification('Subscription removed successfully!', 'success');

				// Update local state to show the removal
				setSubscriptions(subscriptions.filter(sub => sub.music_id !== music_id));
			} else {
				console.error('Remove subscription failed: ', response.message);

				// Show error notification
				showNotification('Failed to remove subscription. Please try again.', 'error');
			}
		} catch (error) {
			console.error('Error removing subscription: ', error);
			showNotification('An error occurred. Please try again.', 'error');
		}
	}

	// Handle logout
	const handleLogout = () => {
		// Clear user data from localStorage
		localStorage.removeItem('user');
		
		// Redirect to login page
		navigate('/login');
	}

	// If user is not loaded yet, show loading
	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-100">
				<div className="text-lg text-gray-600">Loading...</div>
			</div>
		);
	}
 
	return (
		<div className="min-h-screen bg-black text-white font-spotify">
			{/* Top Navigation Bar */}
			<div className="flex items-center justify-between p-4 bg-[#121212] sticky top-0 z-10 px-20">
				{/* Left: Logo and User */}
				<div className="flex items-center space-x-4">
					<div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
						</svg>
					</div>
					<span className="font-medium text-lg">Music Subscription</span>
				</div>

				{/* Right: User profile & logout */}
				<div className="flex items-center space-x-4">
					<div className="bg-[#282828] p-1 rounded-full">
						<div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
							{user.user_name.charAt(0).toUpperCase()}
						</div>
					</div>
					<span className="hidden sm:inline">{user.user_name}</span>
					<button
						onClick={handleLogout}
						className="text-sm py-1 px-3 text-black bg-white rounded-full hover:scale-105 transition-transform"
					>
						Logout
					</button>
				</div>
			</div>

			<div className="flex">
				{/* Main Content */}
				<div className="flex-1 p-6 bg-gradient-to-b from-[#121212] to-black px-20">
					{/* Welcome section */}
					<div className="mb-8">
						<h1 className="text-2xl md:text-3xl font-bold mb-2">Good {getTimeOfDay()}, {user.user_name}</h1>
						<p className="text-gray-400">Explore and discover new music</p>
					</div>

					{/* Search & Query Section */}
					<div className="bg-[#181818] p-6 rounded-lg mb-8">
						<h2 className="text-xl font-bold mb-4">Search Music</h2>
						<form onSubmit={handleQuerySubmit} className="space-y-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="space-y-2">
									<label htmlFor="title" className="block text-sm font-medium text-gray-300">
										Title
									</label>
									<input
										type="text"
										id="title"
										name="title"
										value={queryParams.title}
										onChange={handleQueryChange}
										placeholder="Song title"
										className="w-full px-3 py-2 bg-[#282828] border border-[#333] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="artist" className="block text-sm font-medium text-gray-300">
										Artist
									</label>
									<input
										type="text"
										id="artist"
										name="artist"
										value={queryParams.artist}
										onChange={handleQueryChange}
										placeholder="Artist name"
										className="w-full px-3 py-2 bg-[#282828] border border-[#333] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="year" className="block text-sm font-medium text-gray-300">
										Year
									</label>
									<input
										type="text"
										id="year"
										name="year"
										value={queryParams.year}
										onChange={handleQueryChange}
										placeholder="Release year"
										className="w-full px-3 py-2 bg-[#282828] border border-[#333] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="album" className="block text-sm font-medium text-gray-300">
										Album
									</label>
									<input
										type="text"
										id="album"
										name="album"
										value={queryParams.album}
										onChange={handleQueryChange}
										placeholder="Album name"
										className="w-full px-3 py-2 bg-[#282828] border border-[#333] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
									/>
								</div>
							</div>

							<div>
								<button
									type="submit"
									className={`px-6 py-2 rounded-full text-black font-medium transition-colors focus:outline-none 
                    ${queryLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 hover:scale-105'}`}
									disabled={queryLoading}
								>
									{queryLoading ? 'Searching...' : 'Search'}
								</button>
							</div>
						</form>

						<div className="mt-8">
							{queryError && (
								<div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6">
									{queryError}
								</div>
							)}

							{queryResults.length > 0 && (
								<div>
									<h3 className="text-lg font-bold text-white mb-4">Search Results</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
										{queryResults.map((music, index) => (
											<MusicCard
												key={`query-${index}`}
												music={music}
												actionType="subscribe"
												onAction={() => handleSubscribe(music)}
											/>
										))}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Your Subscriptions Section */}
					<div>
						<h2 className="text-xl font-bold mb-4">Your Subscriptions</h2>

						{subscriptionLoading ? (
							<div className="text-center py-8 text-gray-400">
								Loading subscriptions...
							</div>
						) : subscriptions.length === 0 ? (
							<div className="text-center py-12 bg-[#181818] rounded-lg text-gray-400">
								<div className="mb-4 mx-auto w-16 h-16 rounded-full bg-[#282828] flex items-center justify-center">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
									</svg>
								</div>
								<p className="text-lg">You haven't subscribed to any music yet.</p>
								<p className="text-sm mt-2">Search for songs and hit subscribe to add them here.</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
								{subscriptions.map((subscription, index) => (
									<MusicCard
										key={`sub-${index}`}
										music={subscription}
										actionType="remove"
										onAction={() => handleRemoveSubscription(subscription.music_id)}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// Helper function to get time of day greeting
const getTimeOfDay = () => {
	const hour = new Date().getHours();
	if (hour < 12) return 'morning';
	if (hour < 18) return 'afternoon';
	return 'evening';
};

export default Main
