import { useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export function useApi() {
  const request = useCallback(async <T,>(endpoint: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  }, [])

  const get = useCallback(async <T,>(endpoint: string): Promise<T> => {
    return request<T>(endpoint, { method: 'GET' })
  }, [request])

  return { request, get }
}
