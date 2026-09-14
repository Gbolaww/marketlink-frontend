import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; role: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  mfaVerify: (data: { mfa_token: string; code: string }) =>
    api.post('/auth/mfa/login-verify', data),
  me: () => api.get('/auth/me'),
  logout: (refresh_token: string) =>
    api.post('/auth/logout', { refresh_token }),
}

export const searchApi = {
  search: (params: { lat: number; lon: number; q?: string; radius_km?: number }) =>
    api.get('/search', { params }),
}

export const vendorApi = {
  getMyProfile: () => api.get('/vendors/me'),
  createProfile: (data: {
    business_name: string
    description?: string
    region_id: string
    address?: string
    latitude: number
    longitude: number
  }) => api.post('/vendors/me', data),
  getMyProducts: () => api.get('/vendors/me/products'),
  createProduct: (data: {
    name: string
    description?: string
    price_minor_units: number
    currency_code: string
    stock_quantity?: number
  }) => api.post('/vendors/me/products', data),
  getMyOrders: () => api.get('/vendors/me/orders'),
  fulfilOrder: (orderId: string) =>
    api.post('/orders/' + orderId + '/fulfil', {}),
  submitBankDetails: (data: { account_number: string; bank_code: string }) =>
    api.post('/vendors/me/bank-details', data),
  getBanks: () => api.get('/vendors/banks'),
}

export const orderApi = {
  createOrder: (data: {
    vendor_id: string
    items: { product_id: string; quantity: number }[]
  }) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/me'),
}

export const adminApi = {
  getPendingVendors: () => api.get('/admin/vendors/pending'),
  approveVendor: (vendorId: string) =>
    api.post('/admin/vendors/' + vendorId + '/approve'),
  rejectVendor: (vendorId: string, reason: string) =>
    api.post('/admin/vendors/' + vendorId + '/reject', { reason }),
}