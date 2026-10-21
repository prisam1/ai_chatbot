"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Send, Square, Wand2, Loader2, Palette, LayoutList, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REFINE_SUGGESTIONS, SECTIONS, STYLE_PRESETS, SectionId, StyleId } from "@/lib/presets";
import { GenerationOptions, PROMPT_MAX } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onEnhance: () => void;
  onRegenerate?: () => void;
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
  generating: boolean;
  enhancing: boolean;
  hasPage: boolean;
}

const chip = "shrink-0 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/25 disabled:opacity-50";

export function Composer({
  value, onChange, onSubmit, onCancel, onEnhance, onRegenerate,
  options, onOptionsChange, generating, enhancing, hasPage,
}: ComposerProps) {
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = generating || enhancing;

  // Grow with the text, up to max-h
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const toggleSection = (id: SectionId) => {
    const current = options.sections ?? [];
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    onOptionsChange({ ...options, sections: next.length ? next : undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy) onSubmit();
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!busy) onSubmit(); }}
      className="space-y-2 border-t border-white/20 p-3"
    >
      {hasPage && (
        <div className="flex gap-2 overflow-x-auto scroll-hidden">
          {onRegenerate && (
            <button type="button" className={cn(chip, "flex items-center gap-1")} onClick={onRegenerate} disabled={busy}>
              <RotateCcw className="h-3 w-3" /> Regenerate
            </button>
          )}
          {REFINE_SUGGESTIONS.map((s) => (
            <button key={s} type="button" className={chip} onClick={() => onChange(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/50 bg-white/15 shadow-lg backdrop-blur-md transition focus-within:border-white focus-within:bg-white/20 focus-within:ring-2 focus-within:ring-white/60">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasPage ? "Describe a change, e.g. make the buttons rounded..." : "Describe your landing page..."}
          maxLength={PROMPT_MAX}
          disabled={generating}
          aria-label="Describe your landing page"
          className="block max-h-40 w-full resize-none bg-transparent px-3 pt-3 text-sm font-medium text-white caret-white outline-none placeholder:text-white/80 selection:bg-white/30 disabled:opacity-60 md:text-base"
        />

        <div className="flex flex-wrap items-center gap-2 px-2 pb-2 pt-1">
          <select
            value={options.style ?? ""}
            onChange={(e) => onOptionsChange({ ...options, style: (e.target.value || undefined) as StyleId | undefined })}
            disabled={busy}
            aria-label="Design style"
            className="h-8 rounded-md border border-white/40 bg-white/10 px-2 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-white/60"
          >
            <option value="" className="text-black">Any style</option>
            {STYLE_PRESETS.map((s) => (
              <option key={s.id} value={s.id} className="text-black">{s.label}</option>
            ))}
          </select>

          <div className="flex h-8 items-center gap-1 rounded-md border border-white/40 bg-white/10 px-2">
            <Palette className="h-3.5 w-3.5 text-white" />
            <input
              type="color"
              value={options.accent ?? "#7c3aed"}
              onChange={(e) => onOptionsChange({ ...options, accent: e.target.value })}
              disabled={busy}
              aria-label="Accent colour"
              className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            {options.accent ? (
              <button type="button" onClick={() => onOptionsChange({ ...options, accent: undefined })} aria-label="Clear accent colour" className="text-white/80 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="text-xs text-white/80">Auto</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSectionsOpen((o) => !o)}
            aria-expanded={sectionsOpen}
            className={cn("flex h-8 items-center gap-1 rounded-md border border-white/40 px-2 text-xs font-medium text-white", sectionsOpen ? "bg-white/30" : "bg-white/10")}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Sections{options.sections?.length ? ` (${options.sections.length})` : ""}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {value.length > PROMPT_MAX * 0.8 && (
              <span className="text-xs text-white/80">{value.length}/{PROMPT_MAX}</span>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onEnhance}
              disabled={busy || value.trim().length < 3}
              title="Let AI turn your idea into a detailed brief"
            >
              {enhancing ? <Loader2 className="animate-spin" /> : <Wand2 />}
              <span className="hidden sm:inline">Enhance</span>
            </Button>
            {generating ? (
              <Button type="button" onClick={onCancel} size="icon" variant="destructive" aria-label="Stop generating" title="Stop (Esc)">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!value.trim() || enhancing} size="icon" aria-label="Send" title="Send (Enter)">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {sectionsOpen && (
          <div className="flex flex-wrap gap-2 border-t border-white/20 px-3 py-2">
            {SECTIONS.map((s) => {
              const active = options.sections?.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSection(s.id)}
                  aria-pressed={active}
                  className={cn(chip, active && "border-white bg-white text-purple-700 hover:bg-white")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="hidden text-[11px] text-white/70 md:block">
        Enter to send · Shift + Enter for a new line · Esc to stop
      </p>
    </form>
  );
}
