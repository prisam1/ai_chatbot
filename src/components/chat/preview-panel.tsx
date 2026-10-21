"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Copy, Download, Eye, Link2, Link2Off, Maximize2, Minimize2, Monitor, Smartphone, Tablet, RotateCcw, Loader2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/message";
import { cn } from "@/lib/utils";

type Device = "desktop" | "tablet" | "mobile";
type Tab = "preview" | "code";

const DEVICES: { id: Device; label: string; width: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", width: "100%", icon: Monitor },
  { id: "tablet", label: "Tablet", width: "768px", icon: Tablet },
  { id: "mobile", label: "Mobile", width: "390px", icon: Smartphone },
];

interface PreviewPanelProps {
  page?: Message;
  version: number;
  generating: boolean;
  sharing: boolean;
  onShare: (id: string, shared: boolean) => Promise<string | null | undefined>;
  className?: string;
}

// Links inside the preview open in a new tab instead of inside the iframe
function withBaseTarget(html: string) {
  const base = '<base target="_blank">';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (tag) => tag + base) : base + html;
}

const toolbarBtn = "h-8 px-2 text-xs";

export function PreviewPanel({ page, version, generating, sharing, onShare, className }: PreviewPanelProps) {
  const [device, setDevice] = useState<Device>("desktop");
  const [tab, setTab] = useState<Tab>("preview");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const draft = page ? drafts[page.id] : undefined;
  const html = draft ?? page?.content ?? "";
  const edited = !!page && draft !== undefined && draft !== page.content;

  // Typing in the editor doesn't reload the iframe on every keystroke
  const deferredHtml = useDeferredValue(html);
  const srcDoc = useMemo(() => (deferredHtml ? withBaseTarget(deferredHtml) : ""), [deferredHtml]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch {
      toast.error("Fullscreen isn't available in this browser.");
    }
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Could not copy. Your browser blocked clipboard access.");
    }
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-page-v${version}${edited ? "-edited" : ""}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async () => {
    if (!page) return;
    const shareId = page.shareId ?? (await onShare(page.id, true));
    if (!shareId) return;
    await copy(`${window.location.origin}/p/${shareId}`, edited ? "Link copied. It shows the saved version, not your edits." : "Share link copied to clipboard.");
  };

  const unshare = async () => {
    if (page && (await onShare(page.id, false)) === null) toast.success("Link disabled. It no longer works.");
  };

  if (!page) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-white backdrop-blur", className)}>
        {generating ? <Loader2 className="h-10 w-10 animate-spin" /> : <LayoutTemplate className="h-10 w-10" />}
        <h2 className="text-lg font-semibold">{generating ? "Building your first page..." : "Your live preview appears here"}</h2>
        <p className="max-w-sm text-sm text-white/80">
          {generating ? "This usually takes 15 to 40 seconds." : "Generate a page, then switch devices, edit the code, download it or share a link."}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/60 p-2">
        <div className="flex rounded-md border bg-background p-0.5">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs font-medium", tab === t ? "bg-purple-700 text-white" : "text-muted-foreground hover:text-foreground")}
            >
              {t === "preview" ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
              {t === "preview" ? "Preview" : "Code"}
            </button>
          ))}
        </div>

        {tab === "preview" && (
          <div className="hidden rounded-md border bg-background p-0.5 sm:flex">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                aria-label={d.label}
                title={d.label}
                className={cn("rounded px-2 py-1", device === d.id ? "bg-purple-700 text-white" : "text-muted-foreground hover:text-foreground")}
              >
                <d.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}

        <span className="px-1 text-xs font-medium text-muted-foreground">
          v{version}{edited && " · edited"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {edited && (
            <Button variant="ghost" className={toolbarBtn} onClick={() => setDrafts((d) => {
              const next = { ...d };
              delete next[page.id];
              return next;
            })} title="Discard your code edits">
              <RotateCcw /> Reset
            </Button>
          )}
          <Button variant="ghost" className={toolbarBtn} onClick={() => copy(html, "HTML copied to clipboard.")} title="Copy HTML">
            <Copy /> <span className="hidden lg:inline">Copy</span>
          </Button>
          <Button variant="ghost" className={toolbarBtn} onClick={download} title="Download HTML">
            <Download /> <span className="hidden lg:inline">Download</span>
          </Button>
          <Button variant="ghost" className={toolbarBtn} onClick={share} disabled={sharing} title={page.shareId ? "Copy share link" : "Create a public share link"}>
            {sharing ? <Loader2 className="animate-spin" /> : <Link2 />} <span className="hidden lg:inline">{page.shareId ? "Copy link" : "Share"}</span>
          </Button>
          {page.shareId && (
            <Button variant="ghost" className={toolbarBtn} onClick={unshare} disabled={sharing} title="Disable share link">
              <Link2Off className="text-destructive" />
            </Button>
          )}
          <Button variant="ghost" className={toolbarBtn} onClick={toggleFullscreen} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>

      {tab === "preview" ? (
        <div className="flex flex-1 justify-center overflow-auto bg-muted/40">
          {/* No allow-same-origin: generated code can't touch this app, its cookies or its APIs */}
          <iframe
            title="Live Preview"
            srcDoc={srcDoc}
            style={{ width: DEVICES.find((d) => d.id === device)?.width }}
            className={cn("h-full min-h-[60vh] max-w-full bg-white transition-[width] duration-300", device !== "desktop" && "border-x shadow-lg")}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <textarea
          value={html}
          onChange={(e) => setDrafts((d) => ({ ...d, [page.id]: e.target.value }))}
          spellCheck={false}
          aria-label="HTML code editor"
          className="min-h-[60vh] flex-1 resize-none bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-100 outline-none"
          wrap="off"
        />
      )}
    </div>
  );
}
