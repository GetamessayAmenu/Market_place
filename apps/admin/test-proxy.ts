import fs from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
// Import middleware directly
import { middleware } from './middleware'

let testFailures = 0

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`)
    testFailures++
  } else {
    console.log(`✅ ${message}`)
  }
}

// Global fetch mock variables
let lastFetchUrl: string | null = null
let lastFetchOptions: any = null

const originalFetch = global.fetch
global.fetch = (async (url: any, options: any) => {
  lastFetchUrl = String(url)
  lastFetchOptions = options || null
  
  // Return a mock backend response
  const headers = new Headers()
  headers.append('content-type', 'application/json')
  headers.append('set-cookie', 'access_token=mock_jwt_token_from_backend; Path=/; HttpOnly')
  headers.append('set-cookie', 'another_cookie=hello; Path=/')
  
  return new Response(JSON.stringify({
    success: true,
    data: {
      user: { id: 'admin-1', email: 'admin@marketplace.com', role: 'admin' },
      tokens: { accessToken: 'mock_jwt_token_from_backend' }
    }
  }), {
    status: 200,
    headers
  })
}) as any

async function runTests() {
  console.log('=== Starting Admin Auth Proxy Test Suite ===\n')

  // ----------------------------------------------------
  // Test Case 1: Preservation - Middleware Protection
  // ----------------------------------------------------
  console.log('--- Test Case 1: Middleware Preservation ---')
  try {
    // 1. Protected route without access_token -> should redirect to /login
    const req1 = new NextRequest('http://localhost:3003/analytics')
    const res1 = await middleware(req1)
    assert(
      res1?.status === 307 || res1?.status === 308 || res1?.headers.get('location')?.includes('/login'),
      'Unauthenticated request to protected route (/analytics) redirects to /login'
    )
    if (res1) {
      const location = res1.headers.get('location')
      assert(location?.includes('redirect=%2Fanalytics') ?? false, `Redirect URL contains redirect param: ${location}`)
    }

    // 2. Public route (/login) -> should allow access without redirect
    const req2 = new NextRequest('http://localhost:3003/login')
    const res2 = await middleware(req2)
    assert(res2 === undefined || res2.status === 200 || !res2.headers.has('location'), 'Public route (/login) is accessible')

    // 3. Static asset (/_next/static/...) -> should allow access
    const req3 = new NextRequest('http://localhost:3003/_next/static/chunks/main.js')
    const res3 = await middleware(req3)
    assert(res3 === undefined || res3.status === 200 || !res3.headers.has('location'), 'Static asset route is bypassed')

    // 4. Protected route with access_token cookie -> should allow access
    const req4 = new NextRequest('http://localhost:3003/analytics')
    req4.cookies.set('access_token', 'valid-token')
    const res4 = await middleware(req4)
    assert(res4 === undefined || res4.status === 200 || !res4.headers.has('location'), 'Authenticated route is accessible with cookie')

    // 5. Protected route with Bearer token in headers -> should allow access
    const req5 = new NextRequest('http://localhost:3003/analytics', {
      headers: { authorization: 'Bearer valid-token' }
    })
    const res5 = await middleware(req5)
    assert(res5 === undefined || res5.status === 200 || !res5.headers.has('location'), 'Authenticated route is accessible with Bearer token')
  } catch (err) {
    console.error('Error during middleware preservation tests:', err)
    testFailures++
  }

  console.log('\n--- Test Case 2: Bug Condition & API Proxy ---')
  // ----------------------------------------------------
  // Test Case 2: Bug Condition & API Proxy (Property 1)
  // ----------------------------------------------------
  const routeHandlerPath = path.join(__dirname, 'src/app/api/v1/[...path]/route.ts')
  const routeHandlerExists = fs.existsSync(routeHandlerPath)

  if (!routeHandlerExists) {
    console.log('ℹ️ Route handler file src/app/api/v1/[...path]/route.ts does not exist.')
    console.log('Checking next.config.js for rewrites configuration...')
    
    // Check if next.config.js exists and contains hardcoded url
    const configPath = path.join(__dirname, 'next.config.js')
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8')
      const hasHardcodedUrl = configContent.includes('http://localhost:3001')
      assert(hasHardcodedUrl, 'next.config.js has hardcoded backend rewrite (localhost:3001)')
    }
    
    // Set BACKEND_API_URL to something else and simulate failure to route dynamically
    process.env.BACKEND_API_URL = 'http://api.staging.com'
    console.log(`Setting BACKEND_API_URL = ${process.env.BACKEND_API_URL}`)
    console.log('Since route handler is missing, Next.js rewrite would statically route to http://localhost:3001 instead.')
    assert(false, `Bug confirmed: Missing route handler means dynamic BACKEND_API_URL (${process.env.BACKEND_API_URL}) cannot be proxied`)
  } else {
    console.log('Route handler file exists! Importing and testing handlers...')
    try {
      const routeModule = await import('./src/app/api/v1/[...path]/route')
      
      const testHosts = ['http://api.staging.com', 'http://api.production.com']
      for (const host of testHosts) {
        process.env.BACKEND_API_URL = host
        console.log(`\nTesting with BACKEND_API_URL = ${host}`)
        
        lastFetchUrl = null
        lastFetchOptions = null
        
        // Construct standard POST request to login route
        const requestBody = { email: 'admin@marketplace.com', password: 'password123' }
        const req = new NextRequest(`http://localhost:3003/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'cookie': 'session=abc',
            'authorization': 'Bearer dummy-token'
          },
          body: JSON.stringify(requestBody)
        })
        
        // Call POST handler
        const params = { path: ['auth', 'login'] }
        const res = await routeModule.POST(req, { params })
        
        // Assertions for proxy URL forwarding
        assert(
          lastFetchUrl === `${host}/api/v1/auth/login`,
          `Request was correctly proxied to: ${lastFetchUrl}`
        )
        
        // Assertions for request headers forwarding
        assert(
          lastFetchOptions?.headers?.get('content-type') === 'application/json',
          'Request content-type header was forwarded'
        )
        assert(
          lastFetchOptions?.headers?.get('authorization') === 'Bearer dummy-token',
          'Request authorization header was forwarded'
        )
        assert(
          lastFetchOptions?.headers?.get('cookie') === 'session=abc',
          'Request cookie header was forwarded'
        )
        
        // Assertions for request body forwarding
        assert(
          lastFetchOptions?.body === JSON.stringify(requestBody),
          'Request body payload was forwarded'
        )
        
        // Assertions for response cookie forwarding
        const responseCookies = res.headers.getSetCookie()
        assert(
          responseCookies.some(c => c.includes('access_token=mock_jwt_token_from_backend')),
          'Response includes access_token cookie from backend'
        )
        assert(
          responseCookies.some(c => c.includes('another_cookie=hello')),
          'Response includes other cookies from backend'
        )
        
        // Assertions for response status forwarding
        assert(
          res.status === 200,
          `Response status was forwarded: ${res.status}`
        )
      }
    } catch (err) {
      console.error('Error during route handler verification:', err)
      testFailures++
    }
  }

  console.log('\n=== Test Suite Execution Finished ===')
  if (testFailures > 0) {
    console.error(`❌ Total failures: ${testFailures}`)
    process.exit(1)
  } else {
    console.log('✅ All tests completed successfully.')
    process.exit(0)
  }
}

runTests().catch(err => {
  console.error('Unhandled test execution error:', err)
  process.exit(1)
})
