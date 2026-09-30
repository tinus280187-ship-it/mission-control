import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { KanbanBoard, KanbanCard, KanbanColumn } from '../types'

export default function TaskBoard() {
  const { get } = useApi()
  const [boards, setBoards] = useState<KanbanBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeBoard, setActiveBoard] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await get<KanbanBoard[]>('/kanban/boards')
        setBoards(result)
        if (result.length > 0 && !activeBoard) {
          setActiveBoard(result[0].id)
        }
      } catch (err) {
        setError('Failed to load kanban boards')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [get, activeBoard])

  const currentBoard = boards.find(b => b.id === activeBoard)

  if (loading) return <div className="animate-pulse">Loading task board...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h2>
        <div className="flex gap-2">
          {boards.map(board => (
            <button
              key={board.id}
              onClick={() => setActiveBoard(board.id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeBoard === board.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {board.name}
            </button>
          ))}
        </div>
      </div>

      {currentBoard ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {currentBoard.columns.map(column => (
            <ColumnView key={column.id} column={column} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">No board selected</div>
      )}
    </div>
  )
}

function ColumnView({ column }: { column: KanbanColumn }) {
  return (
    <div className="min-w-[300px] max-w-[350px] flex flex-col bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
          {column.cards.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {column.cards.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No cards</p>
        ) : (
          column.cards.map(card => (
            <CardView key={card.id} card={card} />
          ))
        )}
      </div>
    </div>
  )
}

function CardView({ card }: { card: KanbanCard }) {
  const statusColors: Record<string, string> = {
    blocked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    todo: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    ready: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    running: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  }

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3 shadow-sm hover:shadow-md transition-shadow">
      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{card.title}</h4>
      {card.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{card.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[card.column_id] || 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
          {card.column_id}
        </span>
        {card.assignee && (
          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
            {card.assignee}
          </span>
        )}
      </div>
      {card.tags.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {card.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
