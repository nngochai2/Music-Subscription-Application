import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/apiServices';

const Register = () => {
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Clear previous error
		setError('');

		// Validate form
		if (!email || !username || !password) {
			setError('All fields are required')
			return;
		}

		try {
			setLoading(true);

			// Call register API
			const response = await authService.register(email, username, password);

			if (response.success) {
				// Registration successful, redirect to login page
				navigate('/login', {
					state: {
						message: 'Registration successful! Please login with your new account.'
					}
				})
			} else {
				// Display error message from API
				setError(response.message || 'Registration failed. Please try again.')
			}
		} catch (error) {
			console.error('Registration error: ', error);
			setError('An error occurred. Please try again.')
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-black font-spotify">
			<div className="bg-[#121212] p-8 rounded-lg shadow-md w-full max-w-md">
				<h1 className="text-2xl font-bold text-center text-spotify-green mb-2">Music Subscription App</h1>
				<h2 className="text-l text-center text-spotify-gray mb-6">Register</h2>

				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-50 text-red-700 p-3 rounded-md">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="email" className="block text-sm font-medium text-spotify-gray">
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full px-3 py-2 border text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-white focus:border-white"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="username" className="block text-sm font-medium text-spotify-gray">
							Username
						</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter your username"
							className="w-full px-3 py-2 border text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-white focus:border-white"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="block text-sm font-medium text-spotify-gray">
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							className="w-full px-3 py-2 border text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-white focus:border-white"
							required
						/>
					</div>

					<button
						type="submit"
						className={`w-full py-2 px-4 rounded-md text-black font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
              ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-spotify-green hover:bg-green-700'}`}
						disabled={loading}
					>
						{loading ? 'Registering...' : 'Register'}
					</button>

					<div className="text-center text-spotify-gray">
						Already have an account?{' '}
						<Link to="/login" className="text-spotify-green font-medium hover:text-green-700">
							Login here
						</Link>
					</div>
				</form>
			</div>
		</div>
	)
}

export default Register
