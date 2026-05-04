import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DevTools from './components/DevTools'
import routeLogger from './utils/routeLogger'
import errorLogger from './utils/errorLogger'

// Component to log route changes
function RouteTracker() {
  const location = useLocation()

  useEffect(() => {
    routeLogger.log(location.pathname, 'navigate')
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute requiredRole="Employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute requiredRole="Manager">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/unauthorized" element={
            <div className="container mt-5 text-center">
              <h2>Unauthorized Access</h2>
              <p>You do not have permission to access this page.</p>
            </div>
          } />
        </Routes>
      </AuthProvider>
      <DevTools />
    </Router>
  )
}
