import React, { useState } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../components/AuthProvider'
import toast from 'react-hot-toast'

export function NewJobPage() {
  const { user } = useAuthContext()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResults, setAiResults] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'handyman' as const,
    address: '',
    isRenter: false,
    isRush: false,
    isAfterHours: false
  })

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 5)) // Max 5 photos
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const analyzePhotos = async () => {
    if (photos.length === 0) return
    
    setIsAnalyzing(true)
    
    try {
      // Upload photos to Supabase Storage
      const photoUrls: string[] = []
      
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const fileName = `${user?.id}/${Date.now()}-${i}.${file.name.split('.').pop()}`
        
        const { data, error } = await supabase.storage
          .from('job-photos')
          .upload(fileName, file)

        if (error) throw error
        photoUrls.push(data.path)
      }

      // Call AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-job', {
        body: {
          photos: photoUrls,
          category: formData.category,
          zip: '78701', // Default for demo
          rush_flag: formData.isRush,
          after_hours_flag: formData.isAfterHours
        }
      })

      if (error) throw error

      setAiResults(data)
      setStep(3)
    } catch (error: any) {
      console.error('AI analysis error:', error)
      toast.error('Failed to analyze photos. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const createJob = async () => {
    if (!aiResults || !user) return

    try {
      // Create address first (simplified for demo)
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          line1: formData.address || '123 Demo Street',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          is_default: false
        })
        .select()
        .single()

      if (addressError) throw addressError

      // Create job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          address_id: address.id,
          title: formData.title || 'AI-Generated Repair Job',
          description: formData.description,
          category: formData.category,
          status: 'draft',
          photos: aiResults.photos || [],
          ai_tags: aiResults.tags || [],
          ai_scope_md: aiResults.scope || '',
          client_price_cents: aiResults.clientPrice || 25000,
          contractor_net_cents: aiResults.contractorNet || 20000,
          platform_fee_cents: aiResults.platformFee || 5000,
          margin_pct: 0.20,
          rush_flag: formData.isRush,
          after_hours_flag: formData.isAfterHours,
          city: 'Austin',
          zip: '78701',
          renter_flag: formData.isRenter
        })
        .select()
        .single()

      if (jobError) throw jobError

      toast.success('Job created successfully!')
      setStep(4) // Show success/booking step
    } catch (error: any) {
      console.error('Job creation error:', error)
      toast.error('Failed to create job. Please try again.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">New Repair Job</h1>
          <div className="flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Photos</h2>
            <p className="text-gray-600 mb-4">
              Take clear photos of the repair area. Our system will analyze them to provide an accurate quote.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Camera className="h-12 w-12 text-gray-400" />
                <span className="text-lg font-medium text-gray-900">
                  Take or Upload Photos
                </span>
                <span className="text-sm text-gray-600">
                  PNG, JPG up to 10MB each (max 5 photos)
                </span>
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div />
            <button
              onClick={() => setStep(2)}
              disabled={photos.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next: Add Details
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Job Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Kitchen Faucet Replacement"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="handyman">Handyman</option>
                  <option value="paint">Painting</option>
                  <option value="roof">Roofing</option>
                  <option value="hvac">HVAC</option>
                  <option value="flooring">Flooring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, Austin, TX 78701"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRenter}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRenter: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">I'm a renter (requires landlord approval)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRush}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRush: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Rush job (+50% fee)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAfterHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAfterHours: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">After hours/weekend (+25% fee)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              onClick={analyzePhotos}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Get Instant Quote
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Analysis Complete</h2>
            
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing photos...</p>
                <p className="text-sm text-gray-500 mt-2">This usually takes 30-60 seconds</p>
              </div>
            ) : aiResults ? (
              <div className="space-y-6">
                {/* Price Display */}
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-blue-600 mb-2">
                    ${((aiResults.clientPrice || 25000) / 100).toFixed(0)}
                  </h3>
                  <p className="text-gray-600">Total price (includes all fees)</p>
                </div>

                {/* AI Detected Issues */}
                <div>
                  <h4 className="font-medium mb-2">Detected Issues:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(aiResults.tags || ['faucet_leak', 'water_damage']).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                      >
                        {tag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scope of Work */}
                <div>
                  <h4 className="font-medium mb-2">Scope of Work:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {aiResults.scope || '• Remove old fixtures\n• Install new components\n• Test functionality\n• Clean work area'}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Click "Get Instant Quote" to analyze your photos</p>
              </div>
            )}
          </div>

          {aiResults && (
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={createJob}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Book at This Price</span>
              </button>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Created!</h2>
          <p className="text-gray-600 mb-6">
            Your repair job has been created and contractors are being notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            View My Jobs
          </button>
        </div>
      )}
    </div>
  )
}