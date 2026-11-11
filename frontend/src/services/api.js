import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor request: otomatis lampirkan token admin jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor response:
// - 401 → hapus token lama
// - 422 → normalisasi detail array (Pydantic) jadi string yang bisa dirender
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const detail = err.response?.data?.detail

    if (status === 401) {
      localStorage.removeItem('admin_token')
    }

    if (Array.isArray(detail)) {
      // FastAPI 422 format:
      // [{ type, loc: ["body", "field", ...], msg, input, ctx }]
      err.response.data.detail = detail
        .map((d) => {
          const field = Array.isArray(d.loc) ? d.loc.slice(1).join('.') : ''
          return field ? `${field}: ${d.msg}` : d.msg
        })
        .join(' · ')
    }

    return Promise.reject(err)
  }
)

export default api