import React, { useState } from 'react'
import { AuthProvider, useAuthContext } from './components/AuthProvider'
import { LandingPage } from './pages/LandingPage'
import { Camera, FileText, Check, DollarSign, Calendar, ChevronRight, Menu, User, X, Home, Settings } from 'lucide-react'

// Simple Dashboard Component
function Dashboard() {
  const { user } = useAuthContext()
  
  if (!user) return null

  const stats = {
    activeJobs: 2,
    completedJobs: 5,
    totalSaved: 847
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.first_name}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your repairs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalSaved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Camera className="h-8 w-8 text-blue-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium">Start New Job</h3>
              <p className="text-sm text-gray-600">Scan or upload photos for instant pricing</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-8 w-8 text-green-600 mr-4" />
            <div className="text-left">
              <h3 className="font-medium">Schedule Service</h3>
              <p className="text-sm text-gray-600">Book recurring maintenance</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>
        </div>
      </div>

      {/* Demo Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">🚀 Demo Mode</h3>
        <p className="text-blue-700 text-sm">
          You're viewing the PreReno dashboard! This is a fully functional demo showing 
          the AI-powered home repair platform. Connect your Supabase database to enable 
          real job creation and contractor dispatch.
        </p>
      </div>
    </div>
  )
}

// Header Component
function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, signOut } = useAuthContext()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button onClick={onMenuToggle} className="md:hidden p-2">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 ml-2 md:ml-0">
              <h1 className="text-2xl font-bold text-blue-600">PreReno</h1>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="hidden sm:block text-sm text-gray-700">
                {user.first_name} {user.last_name}
              </span>
              <div className="relative group">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button className="text-gray-600 hover:text-gray-900">Sign In</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Sidebar Component
function Sidebar({ isOpen, currentView, onViewChange, onClose }: {
  isOpen: boolean
  currentView: string
  onViewChange: (view: string) => void
  onClose: () => void
}) {
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

// Main App Content
function AppContent() {
  const { user, loading } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [showAuth, setShowAuth] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user && !showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />
  }

  if (showAuth && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Demo Mode</h1>
            <p className="text-gray-600 mt-2">
              This is a demo of the PreReno platform. Connect your Supabase database to enable full authentication.
            </p>
          </div>
          <button
            onClick={() => setShowAuth(false)}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Landing
          </button>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'new-job':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Create New Job</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600">Job creation form will be implemented here.</p>
            </div>
          </div>
        )
      case 'jobs':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">My Jobs</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600">Jobs list will be implemented here.</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-gray-600">Settings panel will be implemented here.</p>
            </div>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          currentView={currentView}
          onViewChange={setCurrentView}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

// Root App Component
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}