import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getUser, isLoggedIn } from '@/lib/auth'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import SearchPage from '@/pages/SearchPage'
import AccountPage from '@/pages/AccountPage'
import VendorDashboard from '@/pages/VendorDashboard'
import AdminPage from '@/pages/AdminPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  if (!isLoggedIn()) return <Navigate to="/auth" replace />
  const user = getUser()
  if (!user) return <Navigate to="/auth" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/account" element={
          <ProtectedRoute role="customer"><AccountPage /></ProtectedRoute>
        } />
        <Route path="/vendor-dashboard" element={
          <ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}