import { NextResponse } from 'next/server'

// FIX: This test route was left in from development.
// It has been DISABLED in production. Delete this file before going live.
// If you need to test emails, use a local test script outside of Next.js API routes.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Test email route (dev only — disabled in production)' })
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ message: 'Test email route (dev only — disabled in production)' })
}
