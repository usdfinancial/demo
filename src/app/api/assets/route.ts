import { NextRequest, NextResponse } from 'next/server'
import { investmentService } from '@/lib/services/investmentService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const riskLevel = searchParams.get('riskLevel') as any || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const assets = await investmentService.getTokenizedAssets(
      category,
      riskLevel,
      page,
      limit
    )

    return NextResponse.json(assets)
  } catch (error: any) {
    console.error('Assets API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}