import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: process.env.ADMIN_EMAIL || 'sujaykumar760@gmail.com',
      subject: 'SKSS Email Test',
      html: '<h1>Email is working!</h1><p>Resend is configured correctly.</p>',
    })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
