import { useEffect, useState, useRef } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  source: string
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activities])

  const { messages, connected } = useWebSocket('/ws')

  // Process WebSocket messages into activities
  useEffect(() => {
    messages.forEach(msg => {
      const newActivity: ActivityItem = {
        id: `${Date.now()}-${Math.random()}`,
        type: msg.type,
        message: typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload),
        timestamp: new Date().toISOString(),
        source: 'websocket',
      }
      setActivities(prev => [...prev.slice(-99), newActivity])
    })
  }, [messages])

  // Simulate some initial activities
  useEffect(() => {
    if (activities.length === 0) {
      setActivities([
        { id: '1', type: 'system', message: 'Mission Control started', timestamp: new Date().toISOString(), source: 'system' },
        { id: '2', type: 'gateway', message: 'Gateway status: running', timestamp: new Date().toISOString(), source: 'gateway' },
        { id: '3', type: 'kanban', message: 'Kanban processor v2 executed', timestamp: new Date().toISOString(), source: 'cron' },
        { id: '4', type: 'sync', message: 'Obsidian Sync: Fully synced', timestamp: new Date().toISOString(), source: 'obsidian' },
      ])
    }
  }, [])

  const filteredActivities = activities.filter(a => 
    filter === 'all' || a.type === filter
  )

  const types = ['all', 'system', 'gateway', 'kanban', 'cron', 'sync', 'agent', 'memory', ...new Set(activities.map(a => a.type))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h2>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filter === t
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
            connected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {connected ? 'Live' : 'Disconnected'}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Events</h3>
          <button
            onClick={scrollToBottom}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ↓ Jump to latest
          </button>
        </div>
        <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
          {filteredActivities.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No activity</p>
          ) : (
            filteredActivities.slice().reverse().map(activity => (
              <ActivityItemView key={activity.id} activity={activity} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}

function ActivityItemView({ activity }: { activity: ActivityItem }) {
  const typeColors: Record<string, string> = {
    system: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    gateway: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    kanban: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    cron: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    sync: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    agent: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    memory: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  }

  const typeIcons: Record<string, string> = {
    system: '⚙️',
    gateway: '🌐',
    kanban: '📋',
    cron: '⏰',
    sync: '🔄',
    agent: '🤖',
    memory: '🧠',
  }

  return (
    <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
        {typeIcons[activity.type] || '📝'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[activity.type] || typeColors.system}`}>
            {activity.type}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">{activity.message}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Source: {activity.source}</p>
      </div>
    </div>
  )
}
