import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { analytics, initSentry } from './lib/analytics'
import { AuthProvider, useAuthContext } from './components/AuthProvider'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewJobPage } from './pages/NewJobPage'
import { HomePage } from './pages/HomePage'
import { PricingPage } from './pages/PricingPage'
import { GuidesPage } from './pages/GuidesPage'
import { CancelJobPage } from './pages/CancelJobPage'
import { JobsPage } from './pages/JobsPage'
import { SettingsPage } from './pages/SettingsPage'
import { OfferAcceptPage } from './pages/OfferAcceptPage'

// Initialize error tracking
initSentry()

function AppContent() {
  const { user, loading } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')

  React.useEffect(() => {
    if (user) {
      analytics.setUser(user.id, user.role || 'client')
    } else {
      analytics.clearUser()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<HomePage onGetStarted={() => window.location.href = '/auth'} />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/offer/accept/:token" element={<OfferAcceptPage />} />
          <Route path="/cancel/:jobId" element={<CancelJobPage />} />
          <Route path="*" element={<HomePage onGetStarted={() => window.location.href = '/auth'} />} />
        </Routes>
      </Router>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />
      case 'new-job':
        return <NewJobPage />
      case 'jobs':
        return <JobsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <Router>
      <Routes>
        <Route path="/offer/accept/:token" element={<OfferAcceptPage />} />
        <Route path="/*" element={
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
        } />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App