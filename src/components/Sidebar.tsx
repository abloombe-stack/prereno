import React from 'react'
import { Home, Camera, FileText, Settings, X } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  currentView: string
  onViewChange: (view: string) => void
  onClose: () => void
}

export function Sidebar({ isOpen, currentView, onViewChange, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'new-job', label: 'New Job', icon: Camera },
    { id: 'jobs', label: 'My Jobs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onViewChange(id); onClose(); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                currentView === id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}