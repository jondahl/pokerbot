import Anthropic from '@anthropic-ai/sdk';

// Lazy-initialize client to avoid errors during build
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// System prompt for the SMS agent
const SYSTEM_PROMPT = `You are Pokerbot, the SMS assistant for Jon and Matt's private poker game in San Francisco. You handle text message conversations with players about game invitations and RSVPs.

## Your Personality
- Friendly, casual, brief
- Sound like a real person, not a corporate bot
- Use the player's first name when natural
- Keep messages short - this is SMS, not email

## Your Job
1. Process player responses to game invitations
2. Answer simple questions about the game using SCRIPTED RESPONSES
3. Escalate anything you're not 99% confident about

## High-Confidence Actions (Auto-Respond)

Use SCRIPTED MESSAGES whenever possible. Do not improvise.

**RSVP Responses:**
- "yes", "yeah", "yep", "I'm in", "count me in" → SCRIPT: Yes Confirmation
- "no", "nope", "can't make it", "out" → SCRIPT: No Acknowledgment

**Simple Questions:**
- "what time?" → Reply with game time only
- "where?" / "address?" / "location?" → Reply with location only

**Day-of Confirmation:**
- "yes" / "y" / "still in" / "👍" → SCRIPT: 👍
- "no" / "can't make it" / "something came up" → SCRIPT: Morning No Response

**Opt-out:**
- "stop" / "unsubscribe" / "remove me" → SCRIPT: Opt-out Confirmation

**Running late:**
- "I'll be late" / "running late" → SCRIPT: "No problem, see you when you get there"

## Escalate to Admin (<99% Confidence)

Do NOT auto-respond. Flag for admin:
- "Can I bring a friend?"
- "I said no but changed my mind"
- Questions about who is coming
- Complaints or negative feedback
- Anything ambiguous or confusing
- Questions about buy-in, money, stakes
- Anything not covered by a scripted response

## Output Format

For every incoming message, respond with JSON only (no other text):

**If auto-responding:**
{
  "action": "auto_respond",
  "response": "Your scripted message to the player",
  "side_effects": ["confirm_player", "send_calendar_invite"]
}

Possible side_effects:
- "confirm_player" - Mark player as confirmed
- "decline_player" - Mark player as declined
- "send_calendar_invite" - Trigger calendar invite
- "opt_out_player" - Remove player from future messages
- "invite_next" - Trigger invitation to next player

**If escalating:**
{
  "action": "escalate",
  "reason": "Why you need admin help",
  "suggested_response": "Your best guess, or null"
}`;

export type SideEffect =
  | 'confirm_player'
  | 'decline_player'
  | 'send_calendar_invite'
  | 'opt_out_player'
  | 'invite_next';

export type ParsedResponse =
  | {
      action: 'auto_respond';
      response: string;
      sideEffects: SideEffect[];
    }
  | {
      action: 'escalate';
      reason: string;
      suggestedResponse: string | null;
    };

export type PlayerContext = {
  playerMessage: string;
  playerName: string;
  playerStatus: 'invited' | 'confirmed' | 'declined';
  gameDate: string;
  gameTime: string;
  gameLocation: string;
  gameTimeBlock?: string;
  entryInstructions?: string;
  conversationHistory?: Array<{ role: 'player' | 'bot'; message: string }>;
};

/**
 * Parse a player's SMS response using Claude
 */
export async function parsePlayerResponse(
  context: PlayerContext
): Promise<ParsedResponse> {
  const client = getClient();

  // Build context message
  const userMessage = `
PLAYER: ${context.playerName} (status: ${context.playerStatus})
GAME: ${context.gameDate} at ${context.gameTime}, ${context.gameLocation}
${context.gameTimeBlock ? `TIME BLOCK: ${context.gameTimeBlock}` : ''}
${context.entryInstructions ? `ENTRY INSTRUCTIONS: ${context.entryInstructions}` : ''}

${
  context.conversationHistory
    ? `CONVERSATION HISTORY:
${context.conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.message}`).join('\n')}`
    : ''
}

INCOMING MESSAGE: "${context.playerMessage}"

Respond with JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    const parsed = JSON.parse(textContent.text);

    if (parsed.action === 'auto_respond') {
      return {
        action: 'auto_respond',
        response: parsed.response,
        sideEffects: parsed.side_effects || [],
      };
    } else if (parsed.action === 'escalate') {
      return {
        action: 'escalate',
        reason: parsed.reason,
        suggestedResponse: parsed.suggested_response || null,
      };
    } else {
      throw new Error(`Unknown action: ${parsed.action}`);
    }
  } catch (error) {
    console.error('Failed to parse player response:', error);

    // On error, escalate to admin
    return {
      action: 'escalate',
      reason: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedResponse: null,
    };
  }
}
