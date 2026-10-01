import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getUser, isLoggedIn } from '@/lib/auth'
import Layout from '@/components/layout/Layout'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import SearchPage from '@/pages/SearchPage'
import ProductPage from '@/pages/ProductPage'
import OrderCallbackPage from '@/pages/OrderCallbackPage'
import SecurityPage from '@/pages/SecurityPage'
import CartPage from '@/pages/CartPage'
import OrderPage from '@/pages/OrderPage'
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
        <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders/:id" element={
          <ProtectedRoute role="customer"><OrderPage /></ProtectedRoute>
        } />
        <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
        <Route path="/orders/callback" element={
          <ProtectedRoute role="customer"><OrderCallbackPage /></ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute role="customer"><AccountPage /></ProtectedRoute>
        } />
        <Route path="/vendor-dashboard" element={
          <ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
        } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}