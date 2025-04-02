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
	return (
			<main className='font-sans antialiased text-gray-900 min-h-screen'>
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
			</main>
	)
}

export default App
