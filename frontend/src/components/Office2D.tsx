import { useEffect, useRef, useState } from 'react'

interface Room {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  agents: { id: string; name: string; status: string }[]
  description: string
}

const rooms: Room[] = [
  {
    id: 'lead-agent',
    name: 'Lead Agent',
    x: 50,
    y: 50,
    width: 200,
    height: 150,
    color: 'bg-blue-500/20 border-blue-500',
    agents: [
      { id: 'la-1', name: 'Orchestrator', status: 'active' },
      { id: 'la-2', name: 'Coordinator', status: 'idle' },
    ],
    description: 'Overall objective & coordination'
  },
  {
    id: 'lead-engineer',
    name: 'Lead Engineer',
    x: 300,
    y: 50,
    width: 200,
    height: 150,
    color: 'bg-green-500/20 border-green-500',
    agents: [
      { id: 'le-1', name: 'Planner', status: 'active' },
      { id: 'le-2', name: 'Reviewer', status: 'idle' },
    ],
    description: 'Product & engineering planning'
  },
  {
    id: 'opencode',
    name: 'OpenCode Studio',
    x: 550,
    y: 50,
    width: 200,
    height: 150,
    color: 'bg-purple-500/20 border-purple-500',
    agents: [
      { id: 'oc-1', name: 'Builder', status: 'active' },
      { id: 'oc-2', name: 'Tester', status: 'idle' },
    ],
    description: 'Repository-level coding execution'
  },
  {
    id: 'work-assistant',
    name: 'Work Assistant',
    x: 50,
    y: 250,
    width: 200,
    height: 150,
    color: 'bg-orange-500/20 border-orange-500',
    agents: [
      { id: 'wa-1', name: 'Kanban Processor', status: 'active' },
      { id: 'wa-2', name: 'GWS Sync', status: 'idle' },
    ],
    description: 'Daily ops: kanban + Drive + Obsidian'
  },
  {
    id: 'disertasi',
    name: 'Disertasi Research',
    x: 300,
    y: 250,
    width: 200,
    height: 150,
    color: 'bg-red-500/20 border-red-500',
    agents: [
      { id: 'di-1', name: 'Literature Harvester', status: 'active' },
      { id: 'di-2', name: 'Curator Agent', status: 'idle' },
    ],
    description: 'AI maintenance & ESG dissertation'
  },
  {
    id: 'default',
    name: 'Default Profile',
    x: 550,
    y: 250,
    width: 200,
    height: 150,
    color: 'bg-gray-500/20 border-gray-500',
    agents: [
      { id: 'de-1', name: 'Tech News', status: 'active' },
      { id: 'de-2', name: 'Weekly Review', status: 'idle' },
    ],
    description: 'General Hermes operations'
  },
]

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  idle: 'bg-gray-400',
  busy: 'bg-yellow-500',
  error: 'bg-red-500',
}

export default function Office2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear
    ctx.fillStyle = '#f9fafb'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    const gridSize = 50 * scale
    for (let x = (pan.x % gridSize); x < rect.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.stroke()
    }
    for (let y = (pan.y % gridSize); y < rect.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }

    // Draw rooms
    rooms.forEach(room => {
      const x = room.x * scale + pan.x
      const y = room.y * scale + pan.y
      const w = room.width * scale
      const h = room.height * scale

      // Room background
      ctx.fillStyle = selectedRoom?.id === room.id ? '#dbeafe' : '#ffffff'
      ctx.strokeStyle = room.color.includes('blue') ? '#3b82f6' :
                        room.color.includes('green') ? '#22c55e' :
                        room.color.includes('purple') ? '#a855f7' :
                        room.color.includes('orange') ? '#f97316' :
                        room.color.includes('red') ? '#ef4444' : '#9ca3af'
      ctx.lineWidth = selectedRoom?.id === room.id ? 3 : 2
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 12 * scale)
      ctx.fill()
      ctx.stroke()

      // Room name
      ctx.fillStyle = '#111827'
      ctx.font = `bold ${14 * scale}px system-ui`
      ctx.textAlign = 'center'
      ctx.fillText(room.name, x + w / 2, y + 25 * scale)

      // Description
      ctx.fillStyle = '#6b7280'
      ctx.font = `${11 * scale}px system-ui`
      const descLines = wrapText(ctx, room.description, w - 20 * scale)
      descLines.forEach((line, i) => {
        ctx.fillText(line, x + w / 2, y + 45 * scale + i * 14 * scale)
      })

      // Agents
      room.agents.forEach((agent, i) => {
        const ax = x + 10 * scale + (i % 2) * (w / 2 - 10 * scale)
        const ay = y + h - 40 * scale + Math.floor(i / 2) * 20 * scale
        ctx.fillStyle = statusColors[agent.status] || '#9ca3af'
        ctx.beginPath()
        ctx.arc(ax, ay, 6 * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${8 * scale}px system-ui`
        ctx.textAlign = 'center'
        ctx.fillText(agent.name.charAt(0), ax, ay + 3 * scale)
      })
    })

    // Legend
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 12px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('Legend:', 20, 30)
    Object.entries(statusColors).forEach(([status, color], i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(20, 45 + i * 20, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#374151'
      ctx.font = '11px system-ui'
      ctx.fillText(status.charAt(0).toUpperCase() + status.slice(1), 32, 50 + i * 20)
    })
  }

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [pan, scale, selectedRoom])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true)
      setLastMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.nativeEvent.offsetX - lastMousePos.x
      const dy = e.nativeEvent.offsetY - lastMousePos.y
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
      setLastMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
    }

    // Check hover
    const canvas = canvasRef.current
    if (!canvas) return
    const _rect = canvas.getBoundingClientRect()
    void _rect
    const x = (e.nativeEvent.offsetX - pan.x) / scale
    const y = (e.nativeEvent.offsetY - pan.y) / scale

    const hovered = rooms.find(r =>
      x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    )
    setSelectedRoom(hovered || null)
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const zoom = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.min(Math.max(s * zoom, 0.3), 2))
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const x = (e.nativeEvent.offsetX - pan.x) / scale
    const y = (e.nativeEvent.offsetY - pan.y) / scale

    const clicked = rooms.find(r =>
      x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    )
    if (clicked) {
      setSelectedRoom(prev => prev?.id === clicked.id ? null : clicked)
    } else {
      setSelectedRoom(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2D Office</h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Pan: Shift+Drag | Zoom: Scroll | Click room for details</span>
          <div className="flex gap-2">
            <button onClick={() => setScale(1)} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Reset View</button>
            <button onClick={() => setScale(s => Math.min(s * 1.2, 2))} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Zoom In</button>
            <button onClick={() => setScale(s => Math.max(s * 0.8, 0.3))} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Zoom Out</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-[600px] cursor-default"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleClick}
        />
        {selectedRoom && (
          <div className="absolute right-4 top-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[300px] z-10 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedRoom.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRoom.description}</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-2">
              {selectedRoom.agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <div className={`w-2 h-2 rounded-full ${statusColors[agent.status] || statusColors.idle}`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[agent.status] === 'bg-green-500' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {rooms.map(room => (
          <div key={room.id} className={`p-3 rounded-lg border ${selectedRoom?.id === room.id ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} hover:border-blue-400 transition-colors cursor-pointer`} onClick={() => setSelectedRoom(prev => prev?.id === room.id ? null : room)}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${room.color.includes('blue') ? 'bg-blue-500' : room.color.includes('green') ? 'bg-green-500' : room.color.includes('purple') ? 'bg-purple-500' : room.color.includes('orange') ? 'bg-orange-500' : room.color.includes('red') ? 'bg-red-500' : 'bg-gray-500'}`}></div>
              <span className="font-medium text-gray-900 dark:text-white">{room.name}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{room.agents.length} agents • {room.agents.filter(a => a.status === 'active').length} active</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}
