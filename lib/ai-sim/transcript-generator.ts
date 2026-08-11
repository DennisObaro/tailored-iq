import type { TranscriptLine } from "@/lib/types";

interface TranscriptContext {
  expertFirstName: string;
  challenge: string;
  category?: string;
}

export function generateTranscript(ctx: TranscriptContext): {
  transcript: TranscriptLine[];
  extractedInsights: string[];
  durationSeconds: number;
} {
  const transcript: TranscriptLine[] = [
    { speaker: "expert", text: `Thanks for the context — walk me through where this stands today.`, timestampSec: 0 },
    { speaker: "client", text: ctx.challenge, timestampSec: 15 },
    {
      speaker: "expert",
      text: `That's a pattern I've seen before. The underlying issue is usually more structural than it first appears.`,
      timestampSec: 42,
    },
    {
      speaker: "client",
      text: `That matches what we're seeing. What would you focus on first?`,
      timestampSec: 68,
    },
    {
      speaker: "expert",
      text: `I'd start with the smallest change that tests the theory, rather than a full redesign — you'll learn faster and build the case for anything bigger.`,
      timestampSec: 90,
    },
    {
      speaker: "client",
      text: `That's more actionable than what we had planned. What should we watch out for?`,
      timestampSec: 121,
    },
    {
      speaker: "expert",
      text: `Mainly — don't roll this out broadly before you've tested it on a small scale. That's where most attempts like this go wrong.`,
      timestampSec: 145,
    },
  ];

  const extractedInsights = [
    `${ctx.expertFirstName} recommended starting with the smallest change that tests the underlying theory, rather than a full redesign.`,
    `Avoid rolling out broadly before testing on a small scale — that's the most common failure mode for this kind of challenge.`,
  ];

  return { transcript, extractedInsights, durationSeconds: 1080 };
}
