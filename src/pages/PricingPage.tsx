import React, { useState } from 'react'
import { Check, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "How is pricing calculated?",
      answer: "Our pricing is based on: Pro labor rate (varies by location and specialty) + Parts & materials (at cost + small markup) + Platform fee (20% of labor). You see the exact breakdown before booking."
    },
    {
      question: "What's your cancellation policy?",
      answer: "Cancel more than 24 hours before scheduled time for full refund. Cancel within 24 hours and we charge a $25 service fee. Emergency cancellations (contractor no-show, weather) are always fully refunded."
    },
    {
      question: "How are contractors vetted?",
      answer: "All pros pass: Background check, License verification, Insurance validation (minimum $1M liability), Skills assessment, Customer review screening. We maintain a 4.8+ star average."
    },
    {
      question: "When do contractors get paid?",
      answer: "Contractors receive payment 24 hours after job completion and client approval. For disputes, payment is held until resolution. We use Stripe Connect for secure, fast payouts."
    },
    {
      question: "What guarantees do you offer?",
      answer: "All work comes with: 30-day workmanship guarantee, Insurance coverage for damages, 24/7 customer support, Full refund if unsatisfied. PreReno Plus members get extended 90-day guarantees."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pay per job or save with PreReno Plus. No hidden fees, no surprises.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-lg shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* One-off Card */}
          <div className="bg-white rounded-2xl shadow-lg border p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">One-off</h3>
              <p className="text-gray-600 mb-6">Pay per job, no commitment</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $0
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600">20% platform fee per job</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Upfront pricing',
                'Vetted & insured pros',
                'Secure payments',
                '30-day guarantee',
                'Customer support'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started Free
            </button>
          </div>

          {/* PreReno Plus Card */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">PreReno Plus</h3>
              <p className="text-gray-600 mb-6">For frequent repairs & landlords</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                ${billingCycle === 'monthly' ? '29' : '24'}
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600">15% platform fee per job</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Everything in One-off',
                'Priority booking',
                '10% off all labor',
                '90-day extended guarantee',
                'Dedicated support line',
                'Bulk job discounts',
                'Property management tools'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Start Free Trial
            </button>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Transparent fee breakdown
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">$80</div>
              <div className="text-sm text-gray-600 mb-1">Pro labor</div>
              <div className="text-xs text-gray-500">Varies by location & skill</div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">$25</div>
              <div className="text-sm text-gray-600 mb-1">Parts & materials</div>
              <div className="text-xs text-gray-500">At cost + small markup</div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">$21</div>
              <div className="text-sm text-gray-600 mb-1">Platform fee</div>
              <div className="text-xs text-gray-500">20% of labor (15% with Plus)</div>
            </div>
          </div>
          
          <div className="text-center mt-6 pt-6 border-t">
            <div className="text-4xl font-bold text-gray-900 mb-2">$126</div>
            <div className="text-gray-600">Total upfront price</div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently asked questions
          </h3>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-gray-600 mb-8">
            Join thousands of homeowners who trust PreReno for their repairs
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
            Book Your First Job
          </button>
        </div>
      </div>
    </div>
  )
}