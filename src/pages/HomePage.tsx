import React, { useState } from 'react'
import { Camera, Upload, MapPin, Star, Shield, Clock, DollarSign, Check, ChevronRight, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HomePageProps {
  onGetStarted: () => void
}

export function HomePage({ onGetStarted }: HomePageProps) {
  const [zipCode, setZipCode] = useState('')
  const [category, setCategory] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const categories = [
    { value: 'plumbing', label: 'Plumbing', from: 85 },
    { value: 'electrical', label: 'Electrical', from: 90 },
    { value: 'handyman', label: 'Handyman', from: 75 },
    { value: 'paint', label: 'Painting', from: 65 },
    { value: 'roof', label: 'Roofing', from: 100 },
    { value: 'hvac', label: 'HVAC', from: 110 },
    { value: 'flooring', label: 'Flooring', from: 80 }
  ]

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 5))
  }

  const handleGetEstimate = async () => {
    if (!zipCode || !category || photos.length === 0) return
    
    setLoading(true)
    try {
      // This would integrate with the full job creation flow
      onGetStarted()
    } catch (error) {
      console.error('Error getting estimate:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Form */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Fix it fast. Vetted local pros.
              <span className="text-blue-600"> Upfront pricing.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload photos → get instant estimate → book a verified pro today
            </p>
          </div>

          {/* Hero Form */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="78701"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service...</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photos
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {photos.length > 0 ? `${photos.length} photos selected` : 'Click to upload photos'}
                  </p>
                </label>
              </div>
            </div>

            <button
              onClick={handleGetEstimate}
              disabled={!zipCode || !category || photos.length === 0 || loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>{loading ? 'Processing...' : 'Get Instant Estimate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step Process */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">Get your repair done in 3 simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Pick a time',
                description: 'Upload photos and get an instant estimate. Choose your preferred time slot.',
                icon: Camera
              },
              {
                step: '2', 
                title: 'Book instantly',
                description: 'Pay securely online. Your payment is held safely until job completion.',
                icon: Check
              },
              {
                step: '3',
                title: 'Pro arrives',
                description: 'Verified, insured professional arrives on time and completes your repair.',
                icon: Star
              }
            ].map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  {step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Starting Price Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Transparent pricing</h2>
            <p className="text-lg text-gray-600">Starting prices for common repairs</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {categories.map(({ value, label, from }) => (
              <div key={value} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-1">from ${from}</p>
                <p className="text-sm text-gray-600">+ parts & materials</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Final price depends on job complexity and location. Get exact quote in 60 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, label: 'Vetted & insured', desc: 'All pros background checked' },
              { icon: DollarSign, label: 'Upfront pricing', desc: 'No surprises or hidden fees' },
              { icon: Clock, label: '24/7 support', desc: 'Help when you need it' },
              { icon: Star, label: 'Stripe-secured', desc: 'Bank-level payment security' }
            ].map(({ icon: Icon, label, desc }, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <Icon className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof Carousel */}
      <div className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What homeowners say</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Got my kitchen faucet fixed same day. Fair price, great work!",
                author: "Sarah M.",
                location: "Austin, TX",
                rating: 5
              },
              {
                quote: "Finally found reliable contractors. The app makes it so easy.",
                author: "Mike R.", 
                location: "Dallas, TX",
                rating: 5
              },
              {
                quote: "Transparent pricing and quality work. Highly recommend!",
                author: "Lisa K.",
                location: "Houston, TX", 
                rating: 5
              }
            ].map(({ quote, author, location, rating }, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex mb-3">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{quote}"</p>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{author}</p>
                  <p className="text-gray-600">{location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Renter CTA */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Renters welcome!</h2>
          <p className="text-xl mb-8">
            Easy landlord approval process with automatic insurance handling
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}