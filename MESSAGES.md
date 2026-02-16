# PokerList - Message Catalog

Guidelines: LLM generates these based on templates below. Tone is casual, friendly, brief. "Pokerbot" is the persona.

---

## Category 1: Onboarding

### 1.1 Welcome Message (First Contact)
Sent when a player is first added to the system.

```
You're on the list for Jon and Matt's poker game! Our pokerbot will notify you here when a game opens up. Unsubscribe at any time by saying "STOP".
```

---

## Category 2: Game Invitations

### 2.1 Standard Game Invite
Sent when inviting a player to a game.

```
Poker game next Tuesday (March 11), 7pm, at the Mux office (Market & 2nd). Want a spot?
```

**Variables:**
- Day of week + date
- Time
- Location (standard - same each time)

*Note: RSVP deadline not included in message (tracked internally).*

### 2.2 Last-Minute Invite
Sent when a spot opens within 24 hours of game.

```
Last-minute spot for poker tonight. <time> at <location>. Interested?
```

**Variables:**
- Time
- Location

### 2.3 Re-Invite (Spot Opened)
Sent when checking back with someone who previously timed out or was skipped.

```
Checking back: interested in playing?
```

---

## Category 3: RSVP Responses

### 3.1 Yes Confirmation
Sent when player confirms attendance.

```
Great, you're in. See you March 11. <time_block>

Entry instructions: <entry_instructions>

(Reply with any questions and Pokerbot will do its best.)
```

**Variables:**
- Date
- Time block (arbitrary text set by admin, e.g., "Arrive 6:30-7; cards at 7")
- Entry instructions (standard text, same each time)

### 3.2 No Acknowledgment
Sent when player declines.

```
Thanks. Another time!
```

### 3.3 Timeout
**Silent.** No message sent when deadline passes. Player is auto-declined internally.

---

## Category 4: Day-of Confirmation (8:15am)

### 4.1 Morning Check-in
Sent at 8:15am on game day to all confirmed players.

```
Still in for poker tonight? Confirming headcount.
```

### 4.2 Morning Yes Response
When they confirm they're still coming. Accept: "yes", "y", "👍", etc.

```
👍
```
*Or no response needed - just acknowledge receipt.*

### 4.3 Morning No Response
When they drop out day-of.

```
Thanks for letting us know. Another time!
```

---

## Category 5: Opt-Out

### 5.1 Opt-Out Confirmation
Sent when player replies STOP.

```
Got it - you won't receive any more messages.
```

---

## Category 6: Admin-Initiated

### 6.1 Game Cancelled
**Admin writes custom message.** No template - human composes.

---

## Not Needed

- **Welcome back** (re-adding opted-out player) - Not implemented

---

## Summary Table

| Message | Trigger | Auto/Admin |
|---------|---------|------------|
| Welcome | Player added to system | Auto |
| Standard invite | Game created, player in queue | Auto |
| Last-minute invite | Spot opens <24hrs before game | Auto |
| Re-invite | Spot opens, checking back | Auto |
| Yes confirmation | Player says YES | Auto |
| No acknowledgment | Player says NO | Auto |
| Timeout | Deadline passes, no response | Silent |
| Morning check-in | 8:15am game day | Auto |
| Morning yes | Player confirms day-of | Auto |
| Morning no | Player drops day-of | Auto |
| Opt-out | Player says STOP | Auto |
| Game cancelled | Admin cancels game | Admin writes |

---

*Last updated: Feb 15, 2025*
