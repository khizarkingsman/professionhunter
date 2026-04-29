import {NextResponse} from 'next/server';
import {professions} from '@/lib/data';

export async function GET() {
  return NextResponse.json(professions);
}
