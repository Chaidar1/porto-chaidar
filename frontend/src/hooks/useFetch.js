import { useEffect, useState } from 'react'
import api from '../services/api'

export default function useFetch(url, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prevUrl, setPrevUrl] = useState(url)

  if (url !== prevUrl) {
    setPrevUrl(url)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let cancelled = false

    api
      .get(url)
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}