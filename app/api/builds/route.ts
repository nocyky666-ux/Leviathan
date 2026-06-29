import { NextRequest, NextResponse } from 'next/server'
import { getBuildsForSession } from '@/lib/supabase'
import { isValidSessionId } from '@/lib/security'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (!sessionId || !isValidSessionId(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }

  try {
    const builds = await getBuildsForSession(sessionId, 50)
    return NextResponse.json({ builds })
  } catch (err) {
    console.error('[API /builds] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 })
  }
}
