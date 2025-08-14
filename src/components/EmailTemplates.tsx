// Email template components for Resend integration

export const WelcomeEmail1 = ({ firstName, unsubscribeUrl }: { firstName: string; unsubscribeUrl: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PreReno</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PreReno!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
    
    <p>Thanks for joining PreReno! You're now part of thousands of homeowners who get their repairs done fast, fairly, and safely.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2563eb;">Ready to book your first repair?</h3>
      <p style="margin-bottom: 20px;">It takes less than 5 minutes:</p>
      <ol style="padding-left: 20px;">
        <li>Upload photos of what needs fixing</li>
        <li>Get an instant estimate</li>
        <li>Book a verified pro</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.VITE_PUBLIC_URL}/new-job" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Book Your First Fix</a>
    </div>
    
    <p>Questions? Just reply to this email or visit our <a href="${process.env.VITE_PUBLIC_URL}/help">help center</a>.</p>
    
    <p>Best,<br>The PreReno Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    <p>PreReno • Austin, TX</p>
    <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> | <a href="${process.env.VITE_PUBLIC_URL}/privacy" style="color: #666;">Privacy Policy</a></p>
  </div>
</body>
</html>
`

export const WelcomeEmail2 = ({ firstName, unsubscribeUrl }: { firstName: string; unsubscribeUrl: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photo Tips for Accurate Pricing</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #2563eb; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📸 Get Better Estimates with Great Photos</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
    
    <p>Want the most accurate estimate? Great photos make all the difference! Here are our pro tips:</p>
    
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <h3 style="margin-top: 0; color: #1e40af;">📷 Photo Tips</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Take multiple angles</strong> - Wide shot + close-ups</li>
        <li><strong>Good lighting</strong> - Natural light works best</li>
        <li><strong>Show the problem clearly</strong> - Focus on what needs fixing</li>
        <li><strong>Include context</strong> - Show surrounding area</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.VITE_PUBLIC_URL}/new-job" style="background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Upload Photos Now</a>
    </div>
    
    <p><small>💡 <strong>Pro tip:</strong> Our system analyzes your photos instantly to detect issues and calculate fair pricing. Better photos = more accurate estimates!</small></p>
    
    <p>Happy fixing!<br>The PreReno Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> | <a href="${process.env.VITE_PUBLIC_URL}/privacy" style="color: #666;">Privacy Policy</a></p>
  </div>
</body>
</html>
`

export const WelcomeEmail3 = ({ firstName, unsubscribeUrl }: { firstName: string; unsubscribeUrl: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Limited Time: $25 Off Your First Job</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 $25 Off Your First Job!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
    
    <p>We noticed you haven't booked your first repair yet. Here's a special welcome offer just for you!</p>
    
    <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed #f59e0b;">
      <h3 style="margin-top: 0; color: #92400e; font-size: 24px;">WELCOME25</h3>
      <p style="margin: 10px 0; font-size: 18px; color: #92400e;"><strong>$25 off your first job</strong></p>
      <p style="margin-bottom: 0; color: #78350f; font-size: 14px;">Valid for 7 days • Minimum $75 job</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.VITE_PUBLIC_URL}/new-job?promo=WELCOME25" style="background: #dc2626; color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Claim Your Discount</a>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Why choose PreReno?</h4>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        <li>✅ Vetted & insured professionals</li>
        <li>✅ Upfront, transparent pricing</li>
        <li>✅ 30-day workmanship guarantee</li>
        <li>✅ Secure payment protection</li>
      </ul>
    </div>
    
    <p><small>⏰ <strong>Hurry!</strong> This offer expires in 7 days. Don't miss out on professional repairs at a great price.</small></p>
    
    <p>Ready to fix it?<br>The PreReno Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> | <a href="${process.env.VITE_PUBLIC_URL}/privacy" style="color: #666;">Privacy Policy</a></p>
  </div>
</body>
</html>
`

export const GoodbyeEmail = ({ firstName, restoreUrl, unsubscribeUrl }: { firstName: string; restoreUrl: string; unsubscribeUrl: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #6b7280; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Account Deletion Confirmed</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
    
    <p>We're sorry to see you go! Your PreReno account has been scheduled for deletion.</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <h3 style="margin-top: 0; color: #dc2626;">⚠️ Important Information</h3>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        <li>Your account will be permanently deleted in <strong>30 days</strong></li>
        <li>All your job history and data will be removed</li>
        <li>You can restore your account anytime before then</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${restoreUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restore My Account</a>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Before you go...</h4>
      <p style="margin-bottom: 0;">We'd love to know how we could have served you better. <a href="mailto:feedback@prereno.com?subject=Account Deletion Feedback" style="color: #2563eb;">Send us feedback</a> and help us improve for other homeowners.</p>
    </div>
    
    <p>If you have any questions or need help with anything, don't hesitate to reach out to our support team.</p>
    
    <p>Thank you for being part of the PreReno community.<br>The PreReno Team</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    <p>PreReno • Austin, TX</p>
    <p><a href="${process.env.VITE_PUBLIC_URL}/privacy" style="color: #666;">Privacy Policy</a></p>
  </div>
</body>
</html>
`