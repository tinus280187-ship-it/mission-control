import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { CronJob } from '../types'

export default function CalendarView() {
  const { get } = useApi()
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'timeline'>('list')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get<CronJob[]>('/cron/jobs')
        setJobs(result)
      } catch (err) {
        setError('Failed to load cron jobs')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [get])

  const upcomingJobs = jobs
    .filter(j => j.next_run)
    .sort((a, b) => new Date(a.next_run!).getTime() - new Date(b.next_run!).getTime())
    .slice(0, 20)

  if (loading) return <div className="animate-pulse">Loading calendar...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar & Cron Jobs</h2>
        <div className="flex gap-2">
          {['list', 'timeline'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as 'list' | 'timeline')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Google Calendar Placeholder */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-300">Google Calendar Integration</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Not yet configured. Complete GWS OAuth authentication to sync Google Calendar events.
            </p>
          </div>
        </div>
      </div>

      {/* Cron Jobs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Scheduled Jobs ({jobs.length})</h3>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No cron jobs configured</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map(job => (
              <div key={job.id} className="px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {job.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {job.status}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white mt-1 truncate">{job.description || job.command}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{job.schedule}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm">
                  {job.last_run && (
                    <div className="text-gray-500 dark:text-gray-400">
                      Last: <span className="text-gray-900 dark:text-white font-mono">{new Date(job.last_run).toLocaleString()}</span>
                    </div>
                  )}
                  {job.next_run && (
                    <div className="text-gray-500 dark:text-gray-400">
                      Next: <span className="text-gray-900 dark:text-white font-mono">{new Date(job.next_run).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Timeline */}
      {upcomingJobs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Upcoming Runs (Next 7 Days)</h3>
          <div className="space-y-2">
            {upcomingJobs.map(job => (
              <div key={job.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-32 text-right text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {new Date(job.next_run!).toLocaleString()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{job.description || job.command}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{job.schedule}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  job.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {job.enabled ? 'Active' : 'Paused'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
