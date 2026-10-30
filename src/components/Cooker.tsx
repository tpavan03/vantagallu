import type { VoiceStatus } from "../domain/types";

/** A cooking vessel, rather than an unrelated microphone or AI sparkle. */
export function CookerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 19h20v6c0 6-4 9-10 9s-10-3-10-9v-6Z"
        fill="currentColor"
        fillOpacity=".15"
      />
      <g
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 19h20v6c0 6-4 9-10 9s-10-3-10-9v-6ZM10 22H6v5h5m19-5h4v5h-5M8 16h24M17 12h6" />
        <path
          className="cooker-steam"
          d="M16 8c-3-3 3-3 0-6m8 6c-3-3 3-3 0-6"
        />
      </g>
    </svg>
  );
}

export function CookerWordmark() {
  return (
    <span className="cooker-wordmark" role="img" aria-label="COOKer">
      <span aria-hidden="true" className="cooker-cook">
        COOK
      </span>
      <span aria-hidden="true" className="cooker-er">
        er
      </span>
    </span>
  );
}

const states: Record<VoiceStatus, { label: string; description: string }> = {
  idle: {
    label: "Here when you need a hand",
    description:
      "Tell me what changed. We’ll work with what’s already in your pan.",
  },
  connecting: {
    label: "Connecting voice…",
    description: "Opening your live cooking conversation.",
  },
  listening: {
    label: "Listening to you",
    description: "Speak naturally. You can interrupt or pause at any time.",
  },
  speaking: {
    label: "Speaking with you",
    description: "You can interrupt me. Your cooking sets the pace.",
  },
  reconnecting: {
    label: "Reconnecting voice…",
    description: "Your confirmed steps are kept. Waiting for the connection.",
  },
  error: {
    label: "Voice needs another try",
    description: "Your cooking is kept. Use Talk to retry, or keep typing.",
  },
};

export default function Cooker({
  status,
  error,
  transcript,
  signedIn,
  available,
  online,
  expanded = false,
}: {
  status: VoiceStatus;
  error?: string | null;
  transcript?: string;
  signedIn: boolean;
  available: boolean;
  online: boolean;
  expanded?: boolean;
}) {
  const state = states[status];
  const idleDescription = !online
    ? "You’re offline. Your recipe stays available; voice needs a connection."
    : !signedIn
      ? "Sign in to talk with COOKer. You can keep following your recipe here."
      : !available
        ? "Voice isn’t connected yet. Your recipe controls are still available."
        : state.description;
  return (
    <section
      className={`cooker-companion${expanded ? " cooker-expanded" : ""}`}
      data-voice-state={status}
      aria-label="COOKer cooking companion"
    >
      <div className="cooker-orb" aria-hidden="true">
        <span className="cooker-orb-shell" />
        <span className="cooker-orb-inner" />
        <CookerIcon />
      </div>
      <div className="cooker-copy">
        <div className="cooker-identity">
          <CookerWordmark />
          <span>Your cooking companion</span>
        </div>
        <div
          className="cooker-state"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <strong>{state.label}</strong>
          <p className={error ? "cooker-error-copy" : ""}>
            {error || (status === "idle" ? idleDescription : state.description)}
          </p>
        </div>
        {transcript && (
          <p className="cooker-transcript">Heard so far: {transcript}</p>
        )}
      </div>
    </section>
  );
}
