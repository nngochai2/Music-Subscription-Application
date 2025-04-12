// src/pages/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/apiServices';

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
		} catch (err) {
			console.error('Login error:', err);
			setError('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-black flex flex-col font-spotify">
			{/* Header */}
			<header className="py-8 px-8 border-b border-[#282828]">
				<div className="flex items-center justify-center">
					<div className="flex items-center">
						<span className="text-green-500 text-2xl font-bold">Music Subscription Application</span>
					</div>
				</div>
			</header>

			{/* Login Form */}
			<div className="flex-1 flex items-center justify-center p-6">
				<div className="w-full max-w-md bg-[#121212] p-8 rounded-lg">
					<h2 className="text-3xl font-bold text-white mb-6 text-center">Log in to continue</h2>

					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="email" className="block text-sm font-medium text-gray-400">
								Email address
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email address"
								className="w-full px-3 py-3 bg-[#282828] border-0 rounded text-white focus:outline-none focus:ring-2 focus:ring-white"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="block text-sm font-medium text-gray-400">
								Password
							</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								className="w-full px-3 py-3 bg-[#282828] border-0 rounded text-white focus:outline-none focus:ring-2 focus:ring-white"
							/>
						</div>

						<div>
							<button
								type="submit"
								className={`w-full py-3 px-4 rounded-full font-bold text-lg transition-all
                  ${loading
										? 'bg-gray-600 cursor-not-allowed'
										: 'bg-green-500 text-black hover:scale-105'}`}
								disabled={loading}
							>
								{loading ? 'Logging in...' : 'LOG IN'}
							</button>
						</div>

						<div className="pt-4 border-t border-[#282828]">
							<p className="text-center text-gray-400 mb-4">Don't have an account?</p>
							<Link
								to="/register"
								className="block w-full py-3 px-4 rounded-full border border-gray-400 text-white text-center font-bold hover:border-white transition-colors"
							>
								SIGN UP
							</Link>
						</div>
					</form>
				</div>
			</div>

			{/* Footer */}
			<footer className="py-4 text-center text-xs text-gray-500">
				<p>This is a demo application for educational purposes only.</p>
			</footer>
		</div>
	);
};

export default Login;