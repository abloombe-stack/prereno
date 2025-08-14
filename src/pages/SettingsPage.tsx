import React, { useState } from 'react'
import { useAuthContext } from '../components/AuthProvider'
import { Download, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const { user, signOut } = useAuthContext()
  const [loading, setLoading] = useState(false)

  const handleDownloadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch user's data
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', user.id)

      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)

      const userData = {
        profile: user,
        jobs: jobs || [],
        addresses: addresses || [],
        exported_at: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prereno-data-${user.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data downloaded successfully!')
    } catch (error) {
      console.error('Error downloading data:', error)
      toast.error('Failed to download data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )

    if (!confirmed) return

    setLoading(true)
    try {
      // Call delete account edge function
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { user_id: user.id }
      })

      if (error) throw error

      toast.success('Account deletion initiated. You will receive a confirmation email.')
      await signOut()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={user.first_name}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={user.last_name}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={user.phone || ''}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Data & Privacy</h2>
          <div className="space-y-4">
            <button
              onClick={handleDownloadData}
              disabled={loading}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Download My Data</span>
            </button>
            
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              { id: 'email', label: 'Email notifications', checked: true },
              { id: 'sms', label: 'SMS notifications', checked: true },
              { id: 'push', label: 'Push notifications', checked: false },
              { id: 'marketing', label: 'Marketing updates', checked: false }
            ].map(({ id, label, checked }) => (
              <label key={id} className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked={checked} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}