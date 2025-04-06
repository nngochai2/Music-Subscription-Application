import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { musicService } from '../services/apiServices';
import MusicCard from '../components/MusicCard';

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
				// Reload subscriptions to show the newly added one
				await loadSubscriptions();
			} else {
				console.error('Subscription failed: ', response.message);
			}
		} catch (error) {
			console.error('Error during subscription:', error);
		}
	}

	// Handle removing a subscription
	const handleRemoveSubscription = async (music_id) => {

	}

	// Handle logout
	const handleLogout = () => {

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
		<div className="min-h-screen bg-black">
			<header className="bg-black text-white shadow-md">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
					<h1 className="text-2xl font-bold">Music Subscription App</h1>
					<div className="flex items-center space-x-4">
						<span className="font-medium">Welcome, {user.user_name}</span>
						<button
							onClick={handleLogout}
							className="px-3 py-1 border border-white rounded-md hover:bg-white hover:text-indigo-600 transition-colors"
						>
							Logout
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<section className="bg-spotify-light-black rounded-lg shadow-md p-6 mb-8">
					<h2 className="text-xl font-bold text-white mb-6">Search Music</h2>
					<form onSubmit={handleQuerySubmit} className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="space-y-2">
								<label htmlFor="title" className="block text-sm font-semibold text-spotify-gray">
									Title
								</label>
								<input
									type="text"
									id="title"
									name="title"
									value={queryParams.title}
									onChange={handleQueryChange}
									placeholder="Song title"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-spotify-green focus:border-spotify-green"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="artist" className="block text-sm font-semibold text-spotify-gray">
									Artist
								</label>
								<input
									type="text"
									id="artist"
									name="artist"
									value={queryParams.artist}
									onChange={handleQueryChange}
									placeholder="Artist name"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="year" className="block text-sm font-semibold text-spotify-gray">
									Year
								</label>
								<input
									type="text"
									id="year"
									name="year"
									value={queryParams.year}
									onChange={handleQueryChange}
									placeholder="Release year"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="album" className="block text-sm font-semibold text-spotify-gray">
									Album
								</label>
								<input
									type="text"
									id="album"
									name="album"
									value={queryParams.album}
									onChange={handleQueryChange}
									placeholder="Album name"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>
						</div>

						<div>
							<button
								type="submit"
								className={`px-4 py-2 rounded-md text-spotify-light-black font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                  ${queryLoading ? 'bg-green-700 cursor-not-allowed' : 'bg-spotify-green hover:bg-green-700'}`}
								disabled={queryLoading}
							>
								{queryLoading ? 'Searching...' : 'Query'}
							</button>
						</div>
					</form>

					<div className="mt-8">
						{queryError && (
							<div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
								{queryError}
							</div>
						)}

						{queryResults.length > 0 && (
							<div>
								<h3 className="text-lg font-medium text-gray-800 mb-4">Search Results</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
				</section>

				<section className="bg-spotify-light-black rounded-lg shadow-md p-6">
					<h2 className="text-xl font-bold text-white mb-6">Your Subscriptions</h2>

					{subscriptionLoading ? (
						<div className="text-center py-8 text-white">
							Loading subscriptions...
						</div>
					) : subscriptions.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 rounded-md text-white">
							You haven't subscribed to any music yet.
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
				</section>
			</main>
		</div>
	);
}

export default Main
