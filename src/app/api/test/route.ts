import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API route is working',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST API route is working',
    timestamp: new Date().toISOString()
  })
}