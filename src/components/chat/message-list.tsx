"use client";

import { forwardRef, useEffect, useState } from "react";
import { Eye, Loader2, Trash2, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STARTER_PROMPTS } from "@/lib/presets";
import { Message } from "@/types/message";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  pages: Message[];
  previewId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onStarter: (prompt: string) => void;
  generating: boolean;
  loading: boolean;
}

const STEPS = [
  { after: 0, label: "Understanding your idea" },
  { after: 5, label: "Designing the layout" },
  { after: 15, label: "Writing HTML & CSS" },
  { after: 35, label: "Polishing the details" },
];

export function formatSize(text: string) {
  const kb = new Blob([text]).size / 1024;
  return kb < 1 ? "<1 KB" : `${kb.toFixed(1)} KB`;
}

function GeneratingIndicator() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const step = STEPS.findLast((s) => seconds >= s.after) ?? STEPS[0];

  return (
    <div className="p-1 text-left">
      <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-md">
        <Loader2 className="h-4 w-4 animate-spin text-purple-700" />
        <span>{step.label}...</span>
        <span className="tabular-nums text-xs text-muted-foreground">{seconds}s</span>
      </div>
    </div>
  );
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  { messages, pages, previewId, onSelect, onDelete, onStarter, generating, loading },
  ref
) {
  return (
    <div ref={ref} className="flex-1 space-y-2 overflow-y-auto px-2 py-3 scroll-hidden md:px-4" aria-live="polite">
      {loading && (
        <div className="flex justify-center py-8 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && messages.length === 0 && !generating && (
        <div className="space-y-4 py-4 text-white">
          <div className="text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8" />
            <h2 className="text-lg font-semibold">What are we building today?</h2>
            <p className="text-sm text-white/80">Pick an idea or describe your own below.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onStarter(p)}
                className="rounded-lg border border-white/30 bg-white/10 p-3 text-left text-sm transition hover:bg-white/20"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => {
        if (msg.role === "user") {
          return (
            <div key={msg.id} className="p-1 text-right">
              <div className="inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-l-lg rounded-br-lg bg-white px-3 py-2 text-left text-sm shadow-md">
                {msg.content}
              </div>
            </div>
          );
        }

        const version = pages.indexOf(msg) + 1;
        const active = previewId === msg.id;
        return (
          <div key={msg.id} className="p-1 text-left">
            <div className={cn("inline-flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-md", active && "ring-2 ring-purple-700")}>
              <span className="rounded bg-purple-700 px-1.5 py-0.5 text-xs font-semibold text-white">v{version}</span>
              <span className="font-medium">Landing page</span>
              <span className="text-xs text-muted-foreground">
                {formatSize(msg.content)} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {msg.shareId && <Link2 className="h-3.5 w-3.5 text-purple-700" aria-label="Shared" />}
              <Button variant="secondary" size="sm" onClick={() => onSelect(msg.id)} disabled={active}>
                <Eye /> {active ? "Viewing" : "Preview"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(msg.id)} aria-label={`Delete version ${version}`} disabled={generating}>
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}

      {generating && <GeneratingIndicator />}
    </div>
  );
});
