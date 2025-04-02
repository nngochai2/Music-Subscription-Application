import { useEffect, useState } from 'react'
import { Navigate, Route, Router, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';

// Auth guard component to protected routes
const ProtectedRoute = ({ children }) => {
	const user = localStorage.getItem('user');

	if (!user) {
		// Redirect to login if not authenticated
		return <Navigate to='/login' replace />
	}

	return children;
}

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {
		// Check if user is logged in (from localStorage or session)
		const userData = localStorage.getItem('user');
		if (userData) {
			setUser(JSON.parse(userData))
			setIsAuthenticated(true);
		}
	}, [])

	const handleLogin = (userData) => {
		setUser(userData);
		setIsAuthenticated(true);
		localStorage.setItem('user', JSON.stringify(userData));
	}

	const handleLogout = () => {
		setUser(null);
		setIsAuthenticated(false);
		localStorage.removeItem('user');
	}

	return (
		<Router>
			<div className='font-sans antialiased text-gray-900 min-h-screen'>
				<Routes>
					{/* Public routes */}
					<Route path='/login' element={<Login />} />
					<Route path='/register' element={<Register />} />

					{/* Protected routes */}
					<Route 
						path='/main'
						element={
							<ProtectedRoute>
								<Main />
							</ProtectedRoute>
						}
					/>

					{/* Redirect to login for any other route */}
					<Route path='*' element={<Navigate to='/login' replace />} />
				</Routes>
			</div>
		</Router>
	)
}

export default App
