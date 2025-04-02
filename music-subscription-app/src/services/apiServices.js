// Functions for interacting with the API Gateway endpoints

// Base URL for API Gateway from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Placeholder accounts for testing
const PLACEHOLDER_ACCOUNTS = [
	{
		email: 'test@example.com',
		user_name: 'TestUser',
		password: 'password'
	},
	{
		email: 'admin@example.com',
		user_name: 'AdminUser',
		password: 'password'
	}
];

// Mock subscription data
const MOCK_SUBSCRIPTIONS = [
	{
		title: "Bohemian Rhapsody",
		artist: "Queen",
		year: 1975,
		album: "A Night at the Opera",
		image_url: "https://m.media-amazon.com/images/I/71g40mlbinL._SL1500_.jpg",
		music_id: "Bohemian Rhapsody#A Night at the Opera",
		s3_image_url: "https://m.media-amazon.com/images/I/71g40mlbinL._SL1500_.jpg"
	},
	{
		title: "Stairway to Heaven",
		artist: "Led Zeppelin",
		year: 1971,
		album: "Led Zeppelin IV",
		image_url: "https://m.media-amazon.com/images/I/71AfpAs4TXL._SL1500_.jpg",
		music_id: "Stairway to Heaven#Led Zeppelin IV",
		s3_image_url: "https://m.media-amazon.com/images/I/71AfpAs4TXL._SL1500_.jpg"
	}
];

// Mock search results
const MOCK_SEARCH_RESULTS = [
	{
		title: "Sweet Child O' Mine",
		artist: "Guns N' Roses",
		year: 1987,
		album: "Appetite for Destruction",
		image_url: "https://m.media-amazon.com/images/I/71qGF01OfOL._SL1425_.jpg",
		s3_image_url: "https://m.media-amazon.com/images/I/71qGF01OfOL._SL1425_.jpg"
	},
	{
		title: "Hotel California",
		artist: "Eagles",
		year: 1976,
		album: "Hotel California",
		image_url: "https://m.media-amazon.com/images/I/81UtIVTlJzL._SL1500_.jpg",
		s3_image_url: "https://m.media-amazon.com/images/I/81UtIVTlJzL._SL1500_.jpg"
	},
	{
		title: "Imagine",
		artist: "John Lennon",
		year: 1971,
		album: "Imagine",
		image_url: "https://m.media-amazon.com/images/I/713jIoMO1FL._SL1200_.jpg",
		s3_image_url: "https://m.media-amazon.com/images/I/713jIoMO1FL._SL1200_.jpg"
	},
	{
		title: "Billie Jean",
		artist: "Michael Jackson",
		year: 1982,
		album: "Thriller",
		image_url: "https://m.media-amazon.com/images/I/81R4oo3O-yL._SL1500_.jpg",
		s3_image_url: "https://m.media-amazon.com/images/I/81R4oo3O-yL._SL1500_.jpg"
	}
];

// Authentication Services
const authService = {
	// Login as user
	login: async (email, password) => {
		// Simulate API latency
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Try to find matching user
		const user = PLACEHOLDER_ACCOUNTS.find(
			account => account.email === email && account.password === password
		);
		
		if (user) {
			return {
				success: true,
				user: {
					email: user.email,
					user_name: user.user_name
				}
			};
		} else {
			return {
				success: false,
				message: 'Email or password is invalid'
			};
		}
	},

	// Register a new user
	register: async (email, user_name, password) => {
		try {
			const response = await fetch(`${API_BASE_URL}/register`, {
				method: POST,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, user_name, password })
			})

			return await response.json();
		} catch (error) {
			console.error('Register error:', error);
			throw error;
		}
	}
};

// Music Services
const musicService = {
	// Query music based on provided criteria
	queryMusic: async (queryParams) => {
		try {
			// Build query string from params
			const queryString = Object.keys(queryParams)
				.filter(key => queryParams[key]) // Filter out empty values
				.map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
				.join('&');

			const response = await fetch(`${API_BASE_URL}/music/query?${queryString}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			})

			return await response.json();
		} catch (error) {
			console.error('Query music error: ', error);
			throw error;
		}
	},

	// Get all subscriptions for a user
	getSubscriptions: async (email) => {
		try {
			const response = await fetch(`${API_BASE_URL}/subscription?email=${encodeURIComponent(email)}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			return await response.json();
		} catch (error) {
			console.error('Get subscription error: ', error);
			throw error;
		}
	},

	// Subscribe to a music track
	subscribeMusic: async (email, musicData) => {
		try {
			const response = await fetch(`${API_BASE_URL}/subscriptions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					title: musicData.title,
					artist: musicData.artist,
					year: musicData.year,
					album: musicData.album,
					image_url: musicData.image_url
				})
			});

			return await response.json();
		} catch (error) {
			console.error('Subscribe music error: ', error);
			throw error;
		}
	},

	// Unsubscribe
	removeSubscription: async (email, music_id) => {
		try {
			const response = await fetch(`${API_BASE_URL}/subscription`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					music_id
				})
			});

			return await response.json();
		} catch (error) {
			console.error('Remove subscription error: ', error);
			throw error;
		}
	}
};

// Export services
export { authService, musicService }
