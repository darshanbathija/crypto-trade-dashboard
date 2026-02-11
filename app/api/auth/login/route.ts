import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Static credentials
const STATIC_USERNAME = 'darshan';
const STATIC_PASSWORD = 'Vauld@123';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Check static credentials
    if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
      // Set a secure cookie for authentication
      cookies().set('auth-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
