import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { MemoryFolder, LiteratureEntry } from '../types'

export default function MemoryView() {
  const { get } = useApi()
  const [vaultStructure, setVaultStructure] = useState<MemoryFolder | null>(null)
  const [literature, setLiterature] = useState<LiteratureEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'vault' | 'corpus' | 'search'>('vault')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vault, corpus] = await Promise.all([
          get<MemoryFolder>('/memory/vault'),
          get<LiteratureEntry[]>('/memory/literature')
        ])
        setVaultStructure(vault)
        setLiterature(corpus)
      } catch (err) {
        setError('Failed to load memory data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [get])

  if (loading) return <div className="animate-pulse">Loading memory...</div>
  if (error) return <div className="text-red-500">{error}</div>

  const filteredLiterature = literature.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Memory / Knowledge</h2>
        <div className="flex gap-2">
          {['vault', 'corpus', 'search'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'vault' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Obsidian Vault: {vaultStructure?.name || 'Loading...'}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({vaultStructure?.total_files || 0} files, {(vaultStructure?.total_size || 0 / 1024 / 1024).toFixed(1)} MB)
              </span>
            </h3>
          </div>
          <div className="p-4">
            {vaultStructure ? (
              <FolderTree folder={vaultStructure} />
            ) : (
              <p className="text-gray-500">No vault data available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'corpus' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Literature Corpus ({literature.length} entries)
            </h3>
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
          <div className="p-4">
            {filteredLiterature.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No papers found</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredLiterature.map(entry => (
                  <LiteratureCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Full-Text Search</h3>
          <div className="max-w-2xl">
            <input
              type="text"
              placeholder="Search across Vault, Corpus, and Hermes Memory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Search functionality connects to backend memory service. Results would appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function FolderTree({ folder, depth = 0 }: { folder: MemoryFolder; depth?: number }) {
  if (depth > 3) return null // Limit depth for performance

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}>
      <div className="flex items-center gap-2 py-1">
        <span className="text-lg">📁</span>
        <span className="font-medium text-gray-900 dark:text-white">{folder.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({folder.total_files} files, {folder.folders.length} folders)
        </span>
      </div>
      {folder.folders.map(f => <FolderTree key={f.path} folder={f} depth={depth + 1} />)}
      {folder.files.slice(0, 10).map(file => (
        <div key={file.path} className="flex items-center gap-2 py-1 text-sm text-gray-600 dark:text-gray-300 ml-2">
          <span>{getFileIcon(file.name)}</span>
          <span>{file.name}</span>
          <span className="text-xs text-gray-400">({formatSize(file.size)})</span>
        </div>
      ))}
      {folder.files.length > 10 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 ml-4 py-1">
          ... and {folder.files.length - 10} more files
        </div>
      )}
    </div>
  )
}

function LiteratureCard({ entry }: { entry: LiteratureEntry }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{entry.title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {entry.authors.join(', ')} • {entry.year} • {entry.keywords.slice(0, 3).join(', ')}{entry.keywords.length > 3 ? '...' : ''}
      </p>
      {entry.abstract && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2">{entry.abstract}</p>
      )}
      {entry.url && (
        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">
          View paper →
        </a>
      )}
    </div>
  )
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md': return '📝'
    case 'pdf': return '📄'
    case 'pptx': return '📊'
    case 'docx': return '📝'
    case 'json': return '🔧'
    case 'png': case 'jpg': case 'jpeg': case 'gif': return '🖼️'
    default: return '📄'
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
