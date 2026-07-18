import { NextRequest, NextResponse } from 'next/server'

// Helper function to forward cookies from request to backend
function getRequestCookies(request: NextRequest): string {
  const cookieHeader = request.headers.get('cookie')
  return cookieHeader || ''
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3003',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
): Promise<NextResponse> {
  const backendApiUrl = process.env.BACKEND_API_URL

  // Check if BACKEND_API_URL is configured
  if (!backendApiUrl) {
    return NextResponse.json(
      { error: 'Backend API URL is not configured. Please set BACKEND_API_URL environment variable.' },
      { status: 500 }
    )
  }

  try {
    // Reconstruct the full path
    const pathSegments = params.path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    const backendUrl = `${backendApiUrl}/api/v1/${pathSegments}${queryString}`

    // Prepare headers for backend request
    const headers = new Headers()
    
    // Forward Content-Type if present
    const contentType = request.headers.get('content-type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    }

    // Forward Authorization header if present
    const authorization = request.headers.get('authorization')
    if (authorization) {
      headers.set('Authorization', authorization)
    }

    // Forward cookies
    const cookies = getRequestCookies(request)
    if (cookies) {
      headers.set('Cookie', cookies)
    }

    // Prepare request body for methods that support it
    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const requestBody = await request.text()
        console.log('Request body:', requestBody)
        body = requestBody || undefined
      } catch (error) {
        // If reading body fails, continue without it
        console.error('Error reading request body:', error)
        body = undefined
      }
    }

    console.log('Proxy forwarding to:', backendUrl, 'Method:', method)
    console.log('Request headers:', Object.fromEntries(headers.entries()))

    // Make request to backend
    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      ...(body ? { body } : {}),
    })

    console.log('Proxy response status:', backendResponse.status)

    // Get response body
    const responseBody = await backendResponse.text()
    
    // Forward Set-Cookie headers from backend response
    const setCookieHeaders = backendResponse.headers.getSetCookie()
    
    // Create Next.js response with backend status and body
    const nextResponse = new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3003',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Allow-Credentials': 'true',
      },
    })

    // Forward Set-Cookie headers from backend response
    for (const cookieHeader of setCookieHeaders) {
      console.log('Forwarding Set-Cookie:', cookieHeader)
      nextResponse.headers.append('Set-Cookie', cookieHeader)
    }

    return nextResponse
  } catch (error) {
    console.error('API Proxy Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend service', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    )
  }
}

// Export handlers for all HTTP methods
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'GET')
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'POST')
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'PATCH')
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'PUT')
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'DELETE')
}
