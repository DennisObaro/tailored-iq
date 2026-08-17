"use client";

import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils/format";

export function CallControls({ elapsedSeconds, onEndCall }: { elapsedSeconds: number; onEndCall: () => void }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  return (
    <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4">
      <span className="font-mono text-sm text-gray-400" aria-live="polite">
        {formatDuration(elapsedSeconds)}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
        >
          {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setVideoOff((v) => !v)}
          aria-pressed={videoOff}
          aria-label={videoOff ? "Turn camera on" : "Turn camera off"}
        >
          {videoOff ? <VideoOff className="size-4" /> : <Video className="size-4" />}
        </Button>
        <Button variant="danger" size="icon" onClick={onEndCall} aria-label="End call">
          <PhoneOff className="size-4" />
        </Button>
      </div>
      <div className="w-16" aria-hidden />
    </div>
  );
}
