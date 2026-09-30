import { useEffect, useRef, useState, useCallback } from 'react'

type WSMessage = { type: string; payload: unknown }

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          setMessages((prev) => [...prev.slice(-99), msg])
        } catch { /* ignore parse errors */ }
      }
    } catch { /* ignore connection errors */ }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connect])

  const send = useCallback((msg: WSMessage) => {
    wsRef.current?.send(JSON.stringify(msg))
  }, [])

  return { messages, connected, send }
}
