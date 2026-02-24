import { NextResponse } from 'next/server';
import { sendInvitationsForGame } from '@/lib/invitation/flow';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log('API send-invitations: START for game:', id);

  try {
    const sentCount = await sendInvitationsForGame(id);
    console.log('API send-invitations: COMPLETE, sentCount:', sentCount);
    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error('API send-invitations: ERROR:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
