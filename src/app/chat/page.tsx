'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2, Sparkles, Zap } from 'lucide-react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useChat } from '../hooks/useChat';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Composer } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import { PreviewPanel } from '@/components/chat/preview-panel';
import { GenerationOptions, generationOptionsSchema, promptSchema } from '@/lib/validation';

const OPTIONS_KEY = 'pageforge:options';

function loadOptions(): GenerationOptions {
  try {
    const parsed = generationOptionsSchema.safeParse(JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? '{}'));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export default function Chat() {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<GenerationOptions>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    messages, usage, generateLandingPage, cancel, enhancePrompt, clearHistory, deleteVersion, setShared,
    loading: isGenerating, enhancing, historyLoading, clearing, sharing,
  } = useChat();

  const pages = useMemo(() => messages.filter((m) => m.role === 'assistant'), [messages]);
  const previewMessage = pages.find((m) => m.id === selectedId) ?? pages.at(-1);
  const lastPrompt = messages.findLast((m) => m.role === 'user' && !m.id.startsWith('temp-'))?.content;

  // Restore the user's last style choices
  useEffect(() => setOptions(loadOptions()), []);

  const updateOptions = (next: GenerationOptions) => {
    setOptions(next);
    try {
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(next));
    } catch { /* storage blocked, keep in memory only */ }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      toast.error("You have been logged out or your session has expired.", { id: 'session-expired' });
    }
  }, [status, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  // Esc stops a running generation
  useEffect(() => {
    if (!isGenerating) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isGenerating, cancel]);

  const submit = async (text: string) => {
    if (isGenerating) return;
    const parsed = promptSchema.safeParse({ prompt: text, options });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid prompt');
      return;
    }

    setInput('');
    const page = await generateLandingPage(parsed.data.prompt, parsed.data.options);
    if (page) setSelectedId(page.id);
    // Give the prompt back so the user can retry
    else setInput((current) => current || parsed.data.prompt);
  };

  const handleEnhance = async () => {
    const enhanced = await enhancePrompt(input);
    if (enhanced) {
      setInput(enhanced);
      toast.success('Prompt enhanced. Review it and hit send.');
    }
  };

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut({ callbackUrl: "/auth/login" });
    toast.success("Successfully logged out!");
  };

  const handleClear = async () => {
    if (isGenerating) cancel();
    if (await clearHistory()) {
      setSelectedId(null);
      setIsClearModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (await deleteVersion(deleteId) && selectedId === deleteId) setSelectedId(null);
    setDeleteId(null);
  };

  const usageLeft = usage ? Math.max(usage.limit - usage.used, 0) : null;
  const email = session?.user?.email ?? '';

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      <header className="flex items-center justify-between gap-2 border-b border-white/20 px-3 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-inner">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-extrabold tracking-tight text-white md:text-2xl">
              PageForge <span className="bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="hidden text-xs text-white/80 md:block">Describe it. We&apos;ll build it.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {usage && (
            <div
              className="hidden items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white sm:flex"
              title={`${usage.used} of ${usage.limit} generations used in the last 24 hours`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{usageLeft} left today</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/30">
                <div className="h-full bg-white" style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }} />
              </div>
            </div>
          )}
          {email && (
            <div
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold uppercase text-purple-700 md:flex"
              title={email}
            >
              {email[0]}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setIsClearModalOpen(true)}
            disabled={messages.length === 0 || clearing}
            aria-label="Clear history"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline">Clear</span>
          </Button>
          <Button variant="destructive" onClick={() => setIsLogoutModalOpen(true)}>
            <LogOut color='white' className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      <ConfirmDialog
        open={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        title="Confirm Logout"
        description="Are you sure you want to log out? Your current session will be ended."
        confirmLabel="Logout"
        onConfirm={handleLogout}
      />
      <ConfirmDialog
        open={isClearModalOpen}
        onOpenChange={setIsClearModalOpen}
        title="Clear Chat History"
        description="This permanently deletes all your prompts, generated pages and share links."
        confirmLabel={clearing ? "Clearing..." : "Clear"}
        onConfirm={handleClear}
        loading={clearing}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Version"
        description="This deletes this page version and its prompt. Any share link for it stops working."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      <main className="grid flex-1 gap-3 p-2 md:grid-cols-[minmax(340px,2fr)_3fr] md:p-4">
        <section className="flex h-[75dvh] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur md:h-[calc(100dvh-100px)]">
          <MessageList
            ref={scrollRef}
            messages={messages}
            pages={pages}
            previewId={previewMessage?.id}
            onSelect={setSelectedId}
            onDelete={setDeleteId}
            onStarter={setInput}
            generating={isGenerating}
            loading={historyLoading}
          />
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={() => submit(input)}
            onCancel={cancel}
            onEnhance={handleEnhance}
            onRegenerate={lastPrompt ? () => submit(lastPrompt) : undefined}
            options={options}
            onOptionsChange={updateOptions}
            generating={isGenerating}
            enhancing={enhancing}
            hasPage={pages.length > 0}
          />
        </section>

        <PreviewPanel
          page={previewMessage}
          version={previewMessage ? pages.indexOf(previewMessage) + 1 : 0}
          generating={isGenerating}
          sharing={sharing}
          onShare={setShared}
          className="order-first h-[75dvh] md:order-none md:h-[calc(100dvh-100px)]"
        />
      </main>
    </div>
  );
}
