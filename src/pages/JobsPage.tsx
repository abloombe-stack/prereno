import React, { useState, useEffect } from 'react'
import { FileText, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/AuthProvider'
import type { Job } from '../types'

export function JobsPage() {
  const { user } = useAuthContext()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchJobs()
    }
  }, [user])

  const fetchJobs = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const statusOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'draft', label: 'Drafts' },
    { value: 'awaiting_accept', label: 'Finding Contractor' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'awaiting_accept': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'Start by creating your first job' : `No jobs with status "${filter}"`}
            </p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.city}, {job.zip}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.renter_flag && (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Renter
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${(job.client_price_cents / 100).toFixed(0)}</p>
                  <p className="text-sm text-gray-600">{new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}