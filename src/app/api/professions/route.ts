import {NextRequest, NextResponse} from 'next/server';
import {professions} from '@/lib/data';
import {withRateLimit} from '@/lib/server-rate-limiter';

export async function GET(req: NextRequest) {
  // Apply public-tier rate limiting (moderate: 30 req/min per IP)
  const limited = withRateLimit(req, 'public');
  if (limited) return limited;

  return NextResponse.json(professions);
}
