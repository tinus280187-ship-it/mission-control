import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { DashboardOverview as DashboardOverviewType } from '../types'

export default function DashboardOverview() {
  const { get } = useApi()
  const [data, setData] = useState<DashboardOverviewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get<DashboardOverviewType>('/dashboard/overview')
        setData(result)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [get])

  if (loading) return <div className="animate-pulse">Loading dashboard...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!data) return <div>No data available</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="System Health"
          value={data.gateway_status.status === 'running' ? 'Healthy' : 'Degraded'}
          icon="🏥"
          status={data.gateway_status.status === 'running' ? 'good' : 'warning'}
        />
        <MetricCard
          title="Active Agents"
          value={data.active_processes}
          icon="🤖"
        />
        <MetricCard
          title="Kanban Boards"
          value={data.kanban_boards}
          icon="📋"
        />
        <MetricCard
          title="Cron Jobs"
          value={data.cron_jobs}
          icon="⏰"
        />
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricDetailCard
          title="CPU Usage"
          value={`${data.system_metrics.cpu_usage.toFixed(1)}%`}
          icon="⚡"
          color="blue"
        />
        <MetricDetailCard
          title="Memory Usage"
          value={`${data.system_metrics.memory_usage.toFixed(1)}%`}
          icon="💾"
          color="green"
        />
        <MetricDetailCard
          title="Disk Usage"
          value={`${data.system_metrics.disk_usage.toFixed(1)}%`}
          icon="💿"
          color="purple"
        />
      </div>

      {/* Gateway Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Gateway Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-medium capitalize">{data.gateway_status.status}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Uptime</p>
            <p className="font-medium">{data.gateway_status.uptime}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Version</p>
            <p className="font-medium">{data.gateway_status.version || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Agents Connected</p>
            <p className="font-medium">{data.gateway_status.agents_connected}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Memory Files" value={data.memory_files} icon="📄" color="indigo" />
        <StatCard title="Last Heartbeat" value={new Date(data.gateway_status.last_heartbeat).toLocaleTimeString()} icon="💓" color="red" />
        <StatCard title="Network I/O" value={`${(data.system_metrics.network_io.bytes_sent / 1024 / 1024).toFixed(1)} MB sent / ${(data.system_metrics.network_io.bytes_recv / 1024 / 1024).toFixed(1)} MB recv`} icon="📡" color="orange" />
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, status }: { title: string; value: string | number; icon: string; status?: 'good' | 'warning' | 'bad' }) {
  const statusColors = {
    good: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    bad: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      {status && (
        <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )}
    </div>
  )
}

function MetricDetailCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{value}</p>
        </div>
      </div>
    </div>
  )
}
