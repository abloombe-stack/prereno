import React from 'react'
import { useAuthContext } from '../components/AuthProvider'
import { Camera, FileText, Check, DollarSign, Calendar, ChevronRight } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuthContext()

  if (!user) return null

  // Mock data for demo
  const stats = {
    activeJobs: 2,
    completedJobs: 5,
    totalSaved: 847
  }

  const recentJobs = [
    {
      id: '1',
      title: 'Kitchen Faucet Replacement',
      status: 'completed',
      price: 240,
      date: '2025-01-15',
      city: 'Austin',
      zip: '78701'
    },
    {
      id: '2', 
      title: 'Bathroom Tile Repair',
      status: 'in_progress',
      price: 360,
      date: '2025-01-20',
      city: 'Austin',
      zip: '78701'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

      {/* Recent Jobs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
        {recentJobs.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
            <p className="text-gray-600 mb-4">Start by scanning your first repair</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Create First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.city}, {job.zip}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${job.price}</p>
                  <p className="text-sm text-gray-600">{new Date(job.date).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}