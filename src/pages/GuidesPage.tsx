import React from 'react'
import { DollarSign, Clock, Star, MapPin } from 'lucide-react'

export function GuidesPage() {
  const guides = [
    {
      slug: 'plumbing-repair-costs',
      title: 'Average Cost to Fix Plumbing Issues',
      excerpt: 'Complete guide to plumbing repair costs including faucets, pipes, and emergency services.',
      category: 'Plumbing',
      readTime: '5 min read',
      priceRange: '$85-200'
    },
    {
      slug: 'electrical-repair-costs',
      title: 'Electrical Repair Costs and What to Expect',
      excerpt: 'From outlet repairs to panel upgrades, understand electrical service pricing.',
      category: 'Electrical',
      readTime: '6 min read',
      priceRange: '$90-300'
    },
    {
      slug: 'handyman-services-costs',
      title: 'Handyman Services: Pricing Guide',
      excerpt: 'Comprehensive pricing for common handyman tasks and home repairs.',
      category: 'Handyman',
      readTime: '4 min read',
      priceRange: '$75-150'
    },
    {
      slug: 'painting-costs-guide',
      title: 'Interior and Exterior Painting Costs',
      excerpt: 'Room painting, touch-ups, and full house painting cost breakdown.',
      category: 'Painting',
      readTime: '7 min read',
      priceRange: '$65-180'
    },
    {
      slug: 'roof-repair-costs',
      title: 'Roof Repair Costs by Type and Severity',
      excerpt: 'Leak repairs, shingle replacement, and emergency roof services pricing.',
      category: 'Roofing',
      readTime: '8 min read',
      priceRange: '$100-500'
    },
    {
      slug: 'hvac-repair-costs',
      title: 'HVAC Repair and Maintenance Costs',
      excerpt: 'AC repair, heating system fixes, and seasonal maintenance pricing.',
      category: 'HVAC',
      readTime: '6 min read',
      priceRange: '$110-400'
    },
    {
      slug: 'flooring-repair-costs',
      title: 'Flooring Repair Costs and Options',
      excerpt: 'Hardwood, tile, carpet, and laminate repair cost guide.',
      category: 'Flooring',
      readTime: '5 min read',
      priceRange: '$80-250'
    },
    {
      slug: 'emergency-repair-costs',
      title: 'Emergency Home Repair Costs',
      excerpt: 'After-hours and urgent repair pricing for all service types.',
      category: 'Emergency',
      readTime: '4 min read',
      priceRange: '$125-600'
    },
    {
      slug: 'austin-repair-costs',
      title: 'Home Repair Costs in Austin, TX',
      excerpt: 'Local pricing guide for Austin homeowners and renters.',
      category: 'Local',
      readTime: '6 min read',
      priceRange: '$75-300'
    },
    {
      slug: 'renter-repair-guide',
      title: 'Renter\'s Guide to Home Repairs',
      excerpt: 'What renters can fix, landlord approval process, and cost sharing.',
      category: 'Renters',
      readTime: '8 min read',
      priceRange: 'Varies'
    }
  ]

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Plumbing': 'bg-blue-100 text-blue-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'Handyman': 'bg-green-100 text-green-800',
      'Painting': 'bg-purple-100 text-purple-800',
      'Roofing': 'bg-red-100 text-red-800',
      'HVAC': 'bg-orange-100 text-orange-800',
      'Flooring': 'bg-indigo-100 text-indigo-800',
      'Emergency': 'bg-red-100 text-red-800',
      'Local': 'bg-teal-100 text-teal-800',
      'Renters': 'bg-pink-100 text-pink-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Home Repair Cost Guides
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get accurate pricing information for all types of home repairs. 
            Know what to expect before you book.
          </p>
        </div>

        {/* Featured Guide */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12 text-white">
          <div className="max-w-3xl">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
              Most Popular
            </span>
            <h2 className="text-3xl font-bold mb-4">
              Complete Home Repair Pricing Guide 2024
            </h2>
            <p className="text-lg mb-6 text-blue-100">
              Everything you need to know about home repair costs, from emergency fixes 
              to planned maintenance. Updated with current market rates.
            </p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Read Full Guide
            </button>
          </div>
        </div>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide) => (
            <div key={guide.slug} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(guide.category)}`}>
                    {guide.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {guide.readTime}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {guide.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {guide.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="font-semibold">{guide.priceRange}</span>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Read Guide →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get your repair done?
          </h2>
          <p className="text-gray-600 mb-6">
            Skip the research and get an instant, accurate quote for your specific repair
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
            Get Instant Quote
          </button>
        </div>

        {/* Local SEO Section */}
        <div className="mt-16 bg-gray-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Local Home Repair Services
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { city: 'Austin', zip: '78701', services: 'Plumbing, Electrical, HVAC' },
              { city: 'Dallas', zip: '75201', services: 'Handyman, Roofing, Painting' },
              { city: 'Houston', zip: '77001', services: 'Flooring, Emergency Repairs' }
            ].map(({ city, zip, services }) => (
              <div key={city} className="bg-white p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">{city}, TX</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">ZIP: {zip}</p>
                <p className="text-sm text-gray-700">{services}</p>
                <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Local Pricing →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}