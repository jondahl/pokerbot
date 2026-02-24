import { NextResponse } from 'next/server';
import { sendInvitationsForGame } from '@/lib/invitation/flow';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log('=== API send-invitations START ===');
  console.log('Game ID:', id);

  try {
    console.log('Calling sendInvitationsForGame...');
    const sentCount = await sendInvitationsForGame(id);
    console.log('sendInvitationsForGame returned:', sentCount);
    console.log('=== API send-invitations COMPLETE ===');
    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error('=== API send-invitations ERROR ===');
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
