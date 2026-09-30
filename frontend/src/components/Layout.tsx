import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/agents', label: 'Agents', icon: '🤖' },
  { path: '/tasks', label: 'Task Board', icon: '📋' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/activity', label: 'Activity', icon: '📡' },
  { path: '/memory', label: 'Memory', icon: '🧠' },
  { path: '/office', label: '2D Office', icon: '🏢' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Navigation items={navItems} />
      <main className="flex-1 ml-64 p-6 lg:ml-64 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  )
}
