// Temporarily disabled for testing - re-enable after setting up GitHub OAuth
// import { handlers } from "@/auth"

// export const { GET, POST } = handlers

import { NextResponse } from 'next/server';

// Return a simple message while auth is disabled
export async function GET() {
  return NextResponse.json({
    message: 'Authentication is temporarily disabled for testing. Please set up GitHub OAuth credentials to enable authentication.'
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Authentication is temporarily disabled for testing. Please set up GitHub OAuth credentials to enable authentication.'
  });
}
