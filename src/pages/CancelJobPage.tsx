import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, DollarSign, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/AuthProvider'
import toast from 'react-hot-toast'

export function CancelJobPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [refundAmount, setRefundAmount] = useState(0)
  const [serviceFee, setServiceFee] = useState(0)

  useEffect(() => {
    if (jobId && user) {
      fetchJobDetails()
    }
  }, [jobId, user])

  const fetchJobDetails = async () => {
    try {
      const { data: jobData, error } = await supabase
        .from('jobs')
        .select(`
          *,
          payments (*)
        `)
        .eq('id', jobId)
        .eq('client_id', user?.id)
        .single()

      if (error) throw error
      
      setJob(jobData)
      calculateRefund(jobData)
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Job not found')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const calculateRefund = (jobData: any) => {
    if (!jobData.scheduled_at || !jobData.payments?.[0]) return

    const scheduledTime = new Date(jobData.scheduled_at)
    const now = new Date()
    const hoursUntilJob = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    const totalPaid = jobData.payments[0].amount_cents
    
    if (hoursUntilJob > 24) {
      // Full refund if more than 24 hours
      setRefundAmount(totalPaid)
      setServiceFee(0)
    } else {
      // Partial refund with $25 service fee
      const fee = 2500 // $25 in cents
      setRefundAmount(Math.max(0, totalPaid - fee))
      setServiceFee(fee)
    }
  }

  const handleCancelJob = async () => {
    if (!job || !user) return

    setCancelling(true)
    try {
      // Call cancel job edge function
      const { data, error } = await supabase.functions.invoke('cancel-job', {
        body: {
          job_id: jobId,
          refund_amount_cents: refundAmount,
          service_fee_cents: serviceFee
        }
      })

      if (error) throw error

      toast.success('Job cancelled successfully')
      navigate('/jobs')
    } catch (error: any) {
      console.error('Error cancelling job:', error)
      toast.error(error.message || 'Failed to cancel job')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
          <button
            onClick={() => navigate('/jobs')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to jobs
          </button>
        </div>
      </div>
    )
  }

  const scheduledTime = job.scheduled_at ? new Date(job.scheduled_at) : null
  const hoursUntilJob = scheduledTime ? (scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60) : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to jobs
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Cancel Job</h1>
                <p className="text-red-100">Review cancellation details</p>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
              <p className="text-gray-600">{job.description}</p>
              
              {scheduledTime && (
                <div className="flex items-center mt-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Scheduled for {scheduledTime.toLocaleDateString()} at {scheduledTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Cancellation Policy */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Cancellation Policy</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Cancel more than 24 hours before: Full refund</li>
                <li>• Cancel within 24 hours: $25 service fee applies</li>
                <li>• Emergency cancellations (weather, contractor no-show): Full refund</li>
              </ul>
            </div>

            {/* Refund Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Refund Breakdown
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Original payment</span>
                  <span className="font-medium">${(job.payments?.[0]?.amount_cents / 100).toFixed(2)}</span>
                </div>
                
                {serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service fee</span>
                    <span className="text-red-600">-${(serviceFee / 100).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-medium text-gray-900">Refund amount</span>
                  <span className="font-bold text-green-600">${(refundAmount / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Refund will be processed to your original payment method within 5-10 business days
              </p>
            </div>

            {/* Warning */}
            {hoursUntilJob <= 24 && hoursUntilJob > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Late Cancellation</h4>
                    <p className="text-sm text-red-700 mt-1">
                      You're cancelling within 24 hours of your scheduled appointment. 
                      A $25 service fee will be deducted from your refund.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/jobs')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Keep Job
              </button>
              
              <button
                onClick={handleCancelJob}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}