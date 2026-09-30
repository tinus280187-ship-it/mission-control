import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardOverview from './components/DashboardOverview'
import AgentsView from './components/AgentsView'
import TaskBoard from './components/TaskBoard'
import CalendarView from './components/CalendarView'
import ActivityFeed from './components/ActivityFeed'
import MemoryView from './components/MemoryView'
import Office2D from './components/Office2D'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="agents" element={<AgentsView />} />
          <Route path="tasks" element={<TaskBoard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="activity" element={<ActivityFeed />} />
          <Route path="memory" element={<MemoryView />} />
          <Route path="office" element={<Office2D />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
