import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { serverPost } from '../../../lib/serverApi'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = cookies().toString()
    
    const response = await serverPost('/custom-orders', body, { cookieHeader })
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Custom order creation error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create custom order' },
      { status: 500 }
    )
  }
}