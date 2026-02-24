import { NextResponse } from 'next/server';
import { sendInvitationsForGame } from '@/lib/invitation/flow';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TEST: Return hardcoded value to verify API route works
  console.log('API TEST - gameId:', id, '- returning hardcoded 999');

  // Temporarily bypass sendInvitationsForGame to test
  // const sentCount = await sendInvitationsForGame(id);
  const sentCount = 999;

  return NextResponse.json({ success: true, sentCount });
}
