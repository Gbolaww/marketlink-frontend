import axios from 'axios'

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
const BASE_URL = API_BASE_URL

/** Turn an API-relative path such as /uploads/x.jpg into a full URL the browser can load. */
export const assetUrl = (path?: string | null): string | null =>
  path ? (/^https?:\/\//.test(path) ? path : BASE_URL.replace(/\/$/, '') + path) : null

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
    // A 401 from an /auth/* call (wrong code, wrong password) is a form error, not an expired session.
    const isAuthCall = String(error.config?.url ?? '').startsWith('/auth/') && error.config?.url !== '/auth/me'
    if (error.response?.status === 401 && localStorage.getItem('access_token') && !isAuthCall) {
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
  mfaSetup: () => api.post('/auth/mfa/setup'),
  mfaConfirm: (code: string) => api.post('/auth/mfa/setup/confirm', { code }),
  logout: (refresh_token: string) =>
    api.post('/auth/logout', { refresh_token }),
}

export const searchApi = {
  search: (params: { lat: number; lon: number; q?: string; radius_km?: number; limit?: number }) =>
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
  updateProduct: (
    productId: string,
    data: { name?: string; description?: string | null; price_minor_units?: number; stock_quantity?: number | null; is_active?: boolean },
  ) => api.patch('/vendors/me/products/' + productId, data),
  uploadProductImage: (productId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/vendors/me/products/' + productId + '/image', form)
  },
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
  getBankDetails: () => api.get('/vendors/me/bank-details'),
}

export const productApi = {
  get: (id: string) => api.get('/products/' + id),
}

export interface DeliveryDetails {
  name: string
  phone: string
  address: string
  city: string
  state: string
  notes?: string
}

export const orderApi = {
  createOrder: (data: { items: { product_id: string; quantity: number }[]; delivery?: DeliveryDetails }) =>
    api.post('/orders', data),
  getMyOrders: () => api.get('/orders/me'),
  /** Ask the backend to confirm the payment directly with Paystack (does not rely on the webhook). */
  verifyPayment: (reference: string) => api.post('/orders/verify', { reference }),
}

export const adminApi = {
  getPendingVendors: () => api.get('/admin/vendors/pending'),
  approveVendor: (vendorId: string) =>
    api.post('/admin/vendors/' + vendorId + '/approve'),
  rejectVendor: (vendorId: string, reason: string) =>
    api.post('/admin/vendors/' + vendorId + '/reject', { reason }),
}