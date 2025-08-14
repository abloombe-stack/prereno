import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Check, X, Clock, MapPin, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function OfferAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [jobData, setJobData] = useState<any>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (token) {
      fetchJobData()
    }
  }, [token])

  const fetchJobData = async () => {
    try {
      // In a real app, this would validate the magic token and fetch job data
      // For demo, we'll show a mock job
      setJobData({
        id: '1',
        title: 'Kitchen Faucet Replacement',
        description: 'Replace leaking kitchen faucet with new single-handle model',
        category: 'plumbing',
        city: 'Austin',
        zip: '78701',
        contractor_net_cents: 19200,
        client_price_cents: 24000,
        ai_scope_md: '• Remove old faucet\n• Install new single-handle faucet\n• Test for leaks\n• Clean work area',
        photos: ['/api/placeholder/400/300'],
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      })
    } catch (error) {
      console.error('Error fetching job data:', error)
      setError('Invalid or expired offer link')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOffer = async () => {
    if (!jobData || !token) return

    setAccepting(true)
    try {
      // Call accept offer edge function
      const { data, error } = await supabase.functions.invoke('accept-offer', {
        body: { token }
      })

      if (error) throw error

      toast.success('Offer accepted successfully!')
      // Redirect to contractor dashboard or success page
      window.location.href = '/contractor/dashboard'
    } catch (error: any) {
      console.error('Error accepting offer:', error)
      toast.error(error.message || 'Failed to accept offer')
    } finally {
      setAccepting(false)
    }
  }

  const handleDeclineOffer = async () => {
    if (!token) return

    try {
      const { error } = await supabase.functions.invoke('decline-offer', {
        body: { token }
      })

      if (error) throw error

      toast.success('Offer declined')
      window.location.href = '/'
    } catch (error) {
      console.error('Error declining offer:', error)
      toast.error('Failed to decline offer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Offer</h1>
          <p className="text-gray-600">{error || 'This offer link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const timeRemaining = Math.max(0, new Date(jobData.expires_at).getTime() - Date.now())
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Job Offer</h1>
            <div className="flex items-center space-x-4 text-blue-100">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{minutesRemaining} minutes remaining</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{jobData.city}, {jobData.zip}</span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{jobData.title}</h2>
              <p className="text-gray-600">{jobData.description}</p>
            </div>

            {/* Photos */}
            {jobData.photos && jobData.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Photos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {jobData.photos.map((photo: string, index: number) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Job photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Scope of Work */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Scope of Work</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {jobData.ai_scope_md}
                </pre>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-green-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Payout</h3>
                  <p className="text-sm text-gray-600">After platform fee</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${(jobData.contractor_net_cents / 100).toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Client pays: ${(jobData.client_price_cents / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAcceptOffer}
                disabled={accepting || timeRemaining <= 0}
                className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Check className="h-5 w-5" />
                <span>{accepting ? 'Accepting...' : 'Accept Job'}</span>
              </button>
              
              <button
                onClick={handleDeclineOffer}
                disabled={accepting}
                className="flex-1 bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <X className="h-5 w-5" />
                <span>Decline</span>
              </button>
            </div>

            {timeRemaining <= 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-center">This offer has expired.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}