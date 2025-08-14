// Analytics and event tracking

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: string
}

class Analytics {
  private userId: string | null = null
  private userRole: string | null = null

  setUser(userId: string, role: string) {
    this.userId = userId
    this.userRole = role
  }

  clearUser() {
    this.userId = null
    this.userRole = null
  }

  async track(event: string, properties: Record<string, any> = {}) {
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        user_role: this.userRole,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent
      },
      userId: this.userId || undefined,
      timestamp: new Date().toISOString()
    }

    // Send to backend analytics endpoint
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(eventData)
      })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }

    // Also send to external analytics (Segment, etc.)
    if (window.analytics) {
      window.analytics.track(event, eventData.properties)
    }

    console.log('Analytics Event:', eventData)
  }

  // Convenience methods for common events
  estimateCreated(jobData: any) {
    this.track('estimate_created', {
      category: jobData.category,
      zip: jobData.zip,
      price_cents: jobData.client_price_cents,
      rush_flag: jobData.rush_flag,
      after_hours_flag: jobData.after_hours_flag
    })
  }

  paymentInitiated(jobId: string, amount: number) {
    this.track('payment_initiated', {
      job_id: jobId,
      amount_cents: amount
    })
  }

  paymentSucceeded(jobId: string, amount: number, paymentIntentId: string) {
    this.track('payment_succeeded', {
      job_id: jobId,
      amount_cents: amount,
      payment_intent_id: paymentIntentId
    })
  }

  offerAccepted(jobId: string, contractorId: string, amount: number) {
    this.track('offer_accepted', {
      job_id: jobId,
      contractor_id: contractorId,
      amount_cents: amount
    })
  }

  jobApproved(jobId: string, rating?: number) {
    this.track('job_approved', {
      job_id: jobId,
      rating
    })
  }

  refundIssued(jobId: string, refundAmount: number, reason: string) {
    this.track('refund_issued', {
      job_id: jobId,
      refund_amount_cents: refundAmount,
      reason
    })
  }

  payoutTransferred(jobId: string, contractorId: string, amount: number) {
    this.track('payout_transferred', {
      job_id: jobId,
      contractor_id: contractorId,
      amount_cents: amount
    })
  }

  pageView(page: string) {
    this.track('page_view', {
      page,
      referrer: document.referrer
    })
  }

  userSignup(method: string = 'email') {
    this.track('user_signup', {
      method
    })
  }

  userLogin(method: string = 'email') {
    this.track('user_login', {
      method
    })
  }
}

export const analytics = new Analytics()

// Initialize Sentry for error tracking
export const initSentry = () => {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      beforeSend(event, hint) {
        // Add user context
        if (analytics.userId) {
          event.user = {
            id: analytics.userId,
            role: analytics.userRole
          }
        }
        return event
      }
    })
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  analytics.track('javascript_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  analytics.track('unhandled_promise_rejection', {
    reason: event.reason?.toString()
  })
})