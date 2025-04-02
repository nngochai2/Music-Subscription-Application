// src/services/apiService.js
// Base URL for API Gateway from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Flag to determine if we should use mock data
// Set this to false when your AWS services are ready
const USE_MOCK_DATA = !API_BASE_URL;

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

// Mock implementations
const mockAuthService = {
	// Login a user
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
		// Simulate API latency
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Check if email already exists
		const existingUser = PLACEHOLDER_ACCOUNTS.find(account => account.email === email);
		
		if (existingUser) {
			return {
			success: false,
			message: 'The email already exists'
			};
		}
		
		// Add new user to placeholder accounts (only in memory)
		PLACEHOLDER_ACCOUNTS.push({
			email,
			user_name,
			password
		});
		
		return {
			success: true,
			message: 'Registration successful'
		};
	}
};

const mockMusicService = {
	// Query music based on provided criteria
	queryMusic: async (queryParams) => {
		// Simulate API latency
		await new Promise(resolve => setTimeout(resolve, 800));
		
		// Simple search filter simulation
		const results = MOCK_SEARCH_RESULTS.filter(song => {
			// Check if the song matches any of the query parameters
			return (
			(!queryParams.title || song.title.toLowerCase().includes(queryParams.title.toLowerCase())) &&
			(!queryParams.artist || song.artist.toLowerCase().includes(queryParams.artist.toLowerCase())) &&
			(!queryParams.year || song.year.toString() === queryParams.year) &&
			(!queryParams.album || song.album.toLowerCase().includes(queryParams.album.toLowerCase()))
			);
		});
		
		if (results.length === 0) {
			return {
			success: false,
			message: 'No result is retrieved. Please query again'
			};
		}
		
		return {
			success: true,
			music: results
		};
	},
	
	// Get all subscriptions for a user
	getSubscriptions: async (email) => {
		// Simulate API latency
		await new Promise(resolve => setTimeout(resolve, 600));
		
		// In a real app, we'd filter subscriptions by user email
		// For this mock, we'll just return the sample subscriptions
		return {
			success: true,
			subscriptions: MOCK_SUBSCRIPTIONS
		};
	},
	
	// Subscribe to a music track
	subscribeMusic: async (email, musicData) => {
		// Simulate API latency
		await new Promise(resolve => setTimeout(resolve, 700));
		
		// Create a music_id from title and album
		const music_id = `${musicData.title}#${musicData.album}`;
		
		// Check if already subscribed
		const alreadySubscribed = MOCK_SUBSCRIPTIONS.some(
			subscription => subscription.music_id === music_id
		);
		
		if (!alreadySubscribed) {
			// Add to mock subscriptions
			MOCK_SUBSCRIPTIONS.push({
			...musicData,
			music_id
			});
		}
		
		return {
			success: true,
			message: 'Music subscription successful'
		};
	},
	
	// Remove a music subscription
	removeSubscription: async (email, music_id) => {
		// Simulate API latency
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Remove from mock subscriptions
		const index = MOCK_SUBSCRIPTIONS.findIndex(
			subscription => subscription.music_id === music_id
		);
		
		if (index !== -1) {
			MOCK_SUBSCRIPTIONS.splice(index, 1);
		}
		
		return {
			success: true,
			message: 'Subscription removed successfully'
		};
	}
};

// AWS implementations
const awsAuthService = {
	// Login a user
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
			console.error('Login error:', error);
			throw error;
		}
	},
	
	// Register a new user
	register: async (email, user_name, password) => {
		try {
			const response = await fetch(`${API_BASE_URL}/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, user_name, password }),
			});
			
			return await response.json();
		} catch (error) {
			console.error('Register error:', error);
			throw error;
		}
	}
};

const awsMusicService = {
	// Query music based on provided criteria
	queryMusic: async (queryParams) => {
		try {
			// Build query string from parameters
			const queryString = Object.keys(queryParams)
			.filter(key => queryParams[key]) // Filter out empty values
			.map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
			.join('&');
			
			const response = await fetch(`${API_BASE_URL}/music/query?${queryString}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
			});
			
			return await response.json();
		} catch (error) {
			console.error('Query music error:', error);
			throw error;
		}
	},
	
	// Get all subscriptions for a user
	getSubscriptions: async (email) => {
		try {
			const response = await fetch(`${API_BASE_URL}/subscriptions?email=${encodeURIComponent(email)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
			});
			
			return await response.json();
		} catch (error) {
			console.error('Get subscriptions error:', error);
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
			}),
			});
			
			return await response.json();
		} catch (error) {
			console.error('Subscribe music error:', error);
			throw error;
		}
  },
  
	// Remove a music subscription
	removeSubscription: async (email, music_id) => {
		try {
			const response = await fetch(`${API_BASE_URL}/subscriptions`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, music_id }),
			});
			
			return await response.json();
		} catch (error) {
			console.error('Remove subscription error:', error);
			throw error;
		}
	}
};

// Export services (either AWS implementation or mock)
export const authService = USE_MOCK_DATA ? mockAuthService : awsAuthService;
export const musicService = USE_MOCK_DATA ? mockMusicService : awsMusicService;

// Log which implementation is being used
console.log(`Using ${USE_MOCK_DATA ? 'MOCK' : 'AWS'} data for API services`);