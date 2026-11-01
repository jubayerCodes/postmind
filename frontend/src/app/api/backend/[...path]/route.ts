import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl(): string {
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL.replace(/\/+$/, '');
  }
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL.replace(/\/+$/, '');
  }
  // Default to Docker internal service name if running in containerized environment
  return 'http://backend:5000';
}

async function handleProxy(
  request: NextRequest,
  params: { path: string[] },
) {
  const backendBase = getBackendBaseUrl();
  const subPath = (params.path || []).join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${backendBase}/${subPath}${search}`;

  // Forward incoming headers (omit host and content-length)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'content-length') {
      headers.set(key, value);
    }
  });

  // Prepare body for mutation methods
  const method = request.method;
  let body: BodyInit | undefined = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 0) {
      body = Buffer.from(buffer);
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      // @ts-expect-error duplex is required for streaming body in Node fetch
      duplex: 'half',
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    // If connection to http://backend:5000 failed and we might be running on host (localhost:5000)
    if (backendBase === 'http://backend:5000' && (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED')) {
      try {
        const fallbackUrl = `http://localhost:5000/${subPath}${search}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          method,
          headers,
          body,
          // @ts-expect-error duplex required
          duplex: 'half',
          cache: 'no-store',
        });
        const fallbackHeaders = new Headers();
        fallbackResponse.headers.forEach((value, key) => {
          fallbackHeaders.set(key, value);
        });
        const fallbackBody = await fallbackResponse.arrayBuffer();
        return new NextResponse(fallbackBody, {
          status: fallbackResponse.status,
          statusText: fallbackResponse.statusText,
          headers: fallbackHeaders,
        });
      } catch (fallbackErr) {
        console.warn(
          `[Backend Proxy] Unable to connect to backend at ${backendBase} or http://localhost:5000:`,
          fallbackErr,
        );
      }
    }

    console.warn(`[Backend Proxy] Failed to proxy ${method} ${targetUrl}:`, err.message || err);
    return NextResponse.json(
      {
        statusCode: 502,
        message: `Backend service is unreachable at ${backendBase}. Please ensure postmind-backend container is running.`,
        error: 'Bad Gateway',
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
