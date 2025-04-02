// Functions for interacting with the API Gateway endpoints

// Base URL for API Gateway from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Authentication Services
const authService = {
	// Login as user
	login: async (email, password) => {
		try {
			const response = await fetch(`${API_BASE_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			return await response.json();
		} catch (error) {
			 console.error('Login error: ', error);
			 throw error
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
