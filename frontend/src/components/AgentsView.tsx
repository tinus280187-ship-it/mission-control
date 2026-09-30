import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { ProcessInfo } from '../types'

export default function AgentsView() {
  const { get } = useApi()
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'hermes' | 'other'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get<ProcessInfo[]>('/processes')
        setProcesses(result)
      } catch (err) {
        setError('Failed to load processes')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [get])

  const filteredProcesses = processes.filter(p => {
    if (filter === 'hermes') return p.command.includes('hermes') || p.command.includes('opencode')
    if (filter === 'other') return !p.command.includes('hermes') && !p.command.includes('opencode')
    return true
  })

  if (loading) return <div className="animate-pulse">Loading agents...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agents & Processes</h2>
        <div className="flex gap-2">
          {['all', 'hermes', 'other'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3">PID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Command</th>
              <th className="px-4 py-3">CPU %</th>
              <th className="px-4 py-3">Memory %</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Start Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProcesses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No processes found</td>
              </tr>
            ) : (
              filteredProcesses.map((proc) => (
                <tr key={proc.pid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{proc.pid}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{proc.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={proc.command}>
                    {proc.command}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{proc.cpu_percent.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{proc.memory_percent.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      proc.status === 'running' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      proc.status === 'sleeping' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {proc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{proc.user}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{proc.start_time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredProcesses.length} of {processes.length} processes. Auto-refreshes every 10s.
      </div>
    </div>
  )
}
