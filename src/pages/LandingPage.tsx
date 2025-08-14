import React from 'react'
import { Camera, Check, Shield, Star, Clock, DollarSign, Zap } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Instant Home Repairs
            <span className="text-blue-600"> in 60 Seconds</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Scan, get instant quotes, book insured local pros, and pay securely. 
            Perfect for homeowners and renters.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-blue-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto space-x-2"
          >
            <Camera className="h-5 w-5" />
            <span>Scan & Quote Now</span>
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: '1. Scan or Upload',
                description: 'Take photos of your repair needs or upload existing images'
              },
              {
                icon: Zap,
                title: '2. Get Instant Quote',
                description: 'Receive an instant, accurate price estimate in under 60 seconds'
              },
              {
                icon: Check,
                title: '3. Book & Pay',
                description: 'Local insured pros accept your job. Pay securely when complete.'
              }
            ].map(({ icon: Icon, title, description }, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Shield, label: 'Insured Pros', desc: 'All contractors verified & insured' },
              { icon: Star, label: '4.9/5 Rating', desc: 'Average customer satisfaction' },
              { icon: Clock, label: '60 Second Quotes', desc: 'Instant AI-powered estimates' },
              { icon: DollarSign, label: 'Fair Pricing', desc: 'Transparent, competitive rates' }
            ].map(({ icon: Icon, label, desc }, index) => (
              <div key={index} className="text-center">
                <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">{label}</h4>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Renter-Friendly Callout */}
      <div className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Works for Renters Too!</h2>
          <p className="text-lg">
            Easy landlord approval process with automatic COI handling and building compliance
          </p>
        </div>
      </div>
    </div>
  )
}