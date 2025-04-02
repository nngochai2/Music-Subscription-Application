import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/apiServices.js';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Clear previous errors
		setError('');
		
		// Validate form
		if (!email || !password) {
			setError('Email and password are required');
			return;
		}

		try {
			setLoading(true);

			// Call login API
			const response = await authService.login(email, password);

			if (response.success) {
				// Save user data in local storage for session management
				localStorage.setItem('user', JSON.stringify({
					email: response.user.email, 
					user_name: response.user.user_name
				}));

				// Redirect to main page
				navigate('/main');
			} else {
				// Display error message 
				setError(response.message || 'Email or password is invalid');
			}
		} catch (error) {
			console.error('Login error: ', error);
			setError('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Music Subscription App</h1>
				<h2 className="text-xl text-center text-gray-600 mb-6">Login</h2>

				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="bg-red-50 text-red-700 p-3 rounded-md">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="block text-sm font-medium text-gray-700">
							Password
						</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							required
						/>
					</div>

					<button
						type="submit"
						className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
              ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
						disabled={loading}
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>

					<div className="text-center text-gray-600">
						Don't have an account?{' '}
						<Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-500">
							Register here
						</Link>
					</div>
				</form>
			</div>
		</div>
	)
}

export default Login
