import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

		// Clear previous errors
		setError('');

		// Validate form
		if (!email || !username || !password) {
			setError('All fields are required');
			return;
		}

		try {
			setLoading(true);

			// Call register API
			const response = await authService.register(email, username, password);

			if (response.success) {
				// Registration successful, redirect to login page
				navigate('/login', {
					state: { message: 'Registration successful! Please login with your new account.' }
				});
			} else {
				// Display error message from API
				setError(response.message || 'Registration failed. Please try again.');
			}
		} catch (err) {
			console.error('Registration error:', err);
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
						<div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center mr-2">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-black">
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
							</svg>
						</div>
						<span className="text-white text-2xl font-bold">Music Subscription Application</span>
					</div>
				</div>
			</header>

			{/* Register Form */}
			<div className="flex-1 flex items-center justify-center p-6">
				<div className="w-full max-w-md bg-[#121212] p-8 rounded-lg">
					<h2 className="text-3xl font-bold text-white mb-6 text-center">Sign up for free</h2>

					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="email" className="block text-sm font-medium text-gray-400">
								What's your email?
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-full px-3 py-3 bg-[#282828] border-0 rounded text-white focus:outline-none focus:ring-2 focus:ring-white"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="username" className="block text-sm font-medium text-gray-400">
								What should we call you?
							</label>
							<input
								type="text"
								id="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter a profile name"
								className="w-full px-3 py-3 bg-[#282828] border-0 rounded text-white focus:outline-none focus:ring-2 focus:ring-white"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="block text-sm font-medium text-gray-400">
								Create a password
							</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Create a password"
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
								{loading ? 'Signing up...' : 'SIGN UP'}
							</button>
						</div>

						<div className="pt-4 border-t border-[#282828]">
							<p className="text-center text-gray-400 mb-4">Already have an account?</p>
							<Link
								to="/login"
								className="block w-full py-3 px-4 rounded-full border border-gray-400 text-white text-center font-bold hover:border-white transition-colors"
							>
								LOG IN INSTEAD
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

export default Register;