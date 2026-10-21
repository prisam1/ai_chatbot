<<<<<<< HEAD
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Download, LogOut, Copy, Square, Trash2, Eye, Loader2 } from 'lucide-react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useChat } from '../hooks/useChat';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PROMPT_MAX, promptSchema } from '@/lib/validation';
import { Message } from '@/types/message';

// Links inside the preview open in a new tab instead of inside the iframe
function withBaseTarget(html: string) {
  const base = '<base target="_blank">';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (tag) => tag + base) : base + html;
}

function formatSize(text: string) {
  const kb = new Blob([text]).size / 1024;
  return kb < 1 ? '<1 KB' : `${kb.toFixed(1)} KB`;
}

export default function Chat() {
  const [input, setInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { status } = useSession();
  const router = useRouter();

  const { messages, generateLandingPage, cancel, clearHistory, loading: isGenerating, historyLoading, clearing } = useChat();

  const pages = useMemo(() => messages.filter((m) => m.role === 'assistant'), [messages]);
  const previewMessage = pages.find((m) => m.id === selectedId) ?? pages.at(-1);
  const previewHtml = useMemo(() => (previewMessage ? withBaseTarget(previewMessage.content) : ''), [previewMessage]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      toast.error("You have been logged out or your session has expired.", { id: 'session-expired' });
    }
  }, [status, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    const parsed = promptSchema.safeParse({ prompt: input });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid prompt');
      return;
    }

    const { prompt } = parsed.data;
    setInput('');
    setSelectedId(null);
    const ok = await generateLandingPage(prompt);
    // Give the prompt back so the user can retry
    if (!ok) setInput((current) => current || prompt);
  };

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut({ callbackUrl: "/auth/login" });
    toast.success("Successfully logged out!");
  };

  const handleClear = async () => {
    if (isGenerating) cancel();
    const ok = await clearHistory();
    if (ok) {
      setSelectedId(null);
      setIsClearModalOpen(false);
    }
  };

  const copyHtml = async (html: string) => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success('HTML copied to clipboard.');
    } catch {
      toast.error('Could not copy. Your browser blocked clipboard access.');
    }
  };

  const downloadFile = (msg: Message | undefined) => {
    if (!msg) return;
    const blob = new Blob([msg.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-${pages.indexOf(msg) + 1}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Card className="flex min-h-screen md:py-6 py-4 border-none rounded-none bg-gradient-to-r from-blue-500 to-purple-600">
      <CardHeader className="flex flex-row justify-between md:py-4 py-0 items-center border-b gap-2">
        <h1 className="md:text-2xl font-bold text-white">AI Landing Page Generator</h1>

        <div className="flex gap-2">
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
          description="This permanently deletes all your prompts and generated pages."
          confirmLabel={clearing ? "Clearing..." : "Clear"}
          onConfirm={handleClear}
          loading={clearing}
        />
      </CardHeader>

      {/*User & bot message */}
      <CardContent className="md:grid flex flex-col-reverse md:grid-cols-2 p-0 md:pr-4">
        <div className="flex flex-col">
          <div
            className="h-[calc(100vh-210px)] md:px-4 px-2 space-y-2 overflow-y-auto scroll-hidden"
            ref={scrollRef}
            aria-live="polite"
          >
            {historyLoading && (
              <div className="flex justify-center py-8 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`p-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? (
                  <div className="inline-block bg-muted px-3 py-2 max-w-2xl text-sm whitespace-pre-wrap break-words text-left rounded-bl-lg rounded-tl-lg rounded-br-lg shadow-md">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`inline-flex flex-wrap items-center gap-2 bg-muted px-3 py-2 rounded-lg shadow-md text-sm ${previewMessage?.id === msg.id ? 'ring-2 ring-purple-700' : ''}`}>
                    <span className="font-medium">Landing page</span>
                    <span className="text-muted-foreground text-xs">{formatSize(msg.content)}</span>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedId(msg.id)} aria-label="Preview">
                      <Eye /> Preview
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => copyHtml(msg.content)} aria-label="Copy HTML">
                      <Copy /> Copy
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => downloadFile(msg)} aria-label="Download HTML">
                      <Download />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="p-1 text-left">
                <div className="inline-flex items-center gap-2 bg-muted px-3 py-2 rounded-lg shadow-md text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating your page...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-2 py-3 border-t">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your landing page..."
                className="placeholder:text-white text-white pr-16"
                maxLength={PROMPT_MAX}
                disabled={isGenerating}
                aria-label="Describe your landing page"
              />
              {input.length > PROMPT_MAX * 0.8 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/80">
                  {input.length}/{PROMPT_MAX}
                </span>
              )}
            </div>
            {isGenerating ? (
              <Button type="button" onClick={cancel} size="icon" variant="destructive" aria-label="Stop generating">
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()} size="icon" aria-label="Send">
                <Send className="w-4 h-4" />
              </Button>
            )}

            {/*Download Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadFile(previewMessage)}
              disabled={!previewMessage}
              size="icon"
              aria-label="Download current page"
            >
              <Download className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {!historyLoading && pages.length === 0 && !isGenerating && (
          <Card className="border-l p-0 md:m-0 m-2">
            <CardHeader className="p-4">
              <h2 className="text-xl font-semibold">
                Start by asking for a landing page, e.g., &quot;Create a modern hero section for a tech startup.&quot;
              </h2>
            </CardHeader>
          </Card>
        )}

        {/*Live Preview */}
        {isGenerating && !previewMessage && (
          <Card className="border-l p-0 md:m-0 m-2">
            <CardHeader className="p-4">
              <h2 className="text-xl font-semibold">Generating...</h2>
            </CardHeader>
          </Card>
        )}

        {previewMessage && (
          <Card className="border-l p-0 m-0 overflow-hidden">
            {/* No allow-same-origin: generated code can't touch this app, its cookies or its APIs */}
            <iframe
              title="Live Preview"
              srcDoc={previewHtml}
              className="w-full h-full min-h-[80vh] rounded-xl"
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
            />
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
=======
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Download, LogOut, Copy } from 'lucide-react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useChat } from '../hooks/useChat';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function Chat() {


  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { status } = useSession();
  const router = useRouter();

  const { loading: isGenerating, generateLandingPage } = useChat()

  const latestMessage = messages.findLast((m) => m.role === 'bot');


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      toast.error("You have been logged out or your session has expired.");
    }
  }, [status, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  useEffect(() => {
    if (iframeRef.current && latestMessage) {
      const withBase = latestMessage.content.replace(
        /<head(.*?)>/i,
        `<head$1><base target="_blank">`
      );
      iframeRef.current.srcdoc = withBase;
    }
  }, [latestMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);

    const chatResponse = await generateLandingPage({ prompt: input });

    if (chatResponse && chatResponse.html) {
      setMessages((prev) => [...prev, { role: 'bot', content: chatResponse.html }]);
    }
    setInput('');
  };

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut({ callbackUrl: "/auth/login" });
    toast.success("Successfully logged out!");
  };


  const downloadFile = () => {
    if (!latestMessage) return;
    const blob = new Blob([latestMessage.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-landing.html';
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <Card className="flex min-h-screen md:py-6 py-4 border-none rounded-none bg-gradient-to-r from-blue-500 to-purple-600">
      <CardHeader className="flex flex-row justify-between md:p
        y-4 py-0 items-center border-b">
        <h1 className="md:text-2xl font-bold text-white">AI Landing Page Generator</h1>

        {/*Logout button & Modal */}
        <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut
                color='white'
                className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </DialogTrigger>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle className='text-left'>Confirm Logout</DialogTitle>
              <DialogDescription className='text-left mt-2'>
                Are you sure you want to log out? Your current session will be ended.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='flex flex-row justify-between'>
              <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className='text-amber-50'
                variant="destructive"
                onClick={handleLogout}>
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>


      {/*User & bot message */}
      <CardContent className={`md:grid flex flex-col-reverse ${"md:grid-cols-2"} p-0 md:pr-4`}>
        <div className="flex flex-col ">
          <div
            className="h-[calc(100vh-210px)] md:px-4 px-2 space-y-2 overflow-scroll scroll-hidden"
            ref={scrollRef as React.RefObject<HTMLDivElement>}
          >

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`relative group p-1${msg.role === 'user' ? ' text-right ' : ' text-left'}`}
              >
                <div className={`${msg.role === 'user' ? ' rounded-bl-lg rounded-tl-lg rounded-br-lg ' : 'rounded-lg scroll-hidden'} inline-block bg-muted px-3 py-2  max-w-2xl text-sm whitespace-pre-wrap overflow-auto max-h-60 shadow-md`}>
                  {msg.content}
                </div>

                {/*Copy Button */}
                {msg.role === 'bot' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-1 md:ml-2 -ml-20 text-center hover:bg-gray-300 transition"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                  >
                    <Copy />
                    Copy
                  </Button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-2 py-3 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your landing page..."
              className="flex-1 placeholder:text-white"
            />
            <Button type="submit" disabled={isGenerating} size="icon">
              <Send className="w-4 h-4" />
            </Button>

            {/*Download Button */}
            <Button
              type="button"
              variant="outline"
              onClick={downloadFile}
              disabled={!latestMessage}
              size="icon"
            >
              <Download className="w-4 h-4" />
            </Button>
          </form>
        </div>


        {messages.length === 0 && !isGenerating && (
          <Card className="border-l p-0 md:m-0 m-2">
            <CardHeader className="p-4">
              <h2 className="text-xl font-semibold">
                Start by asking for a landing page, e.g., &quot;Create a modern hero section for a tech startup.&quot;
              </h2>
            </CardHeader>
          </Card>
        )}

        {/*Live Preview */}
        {isGenerating && (
          <Card className="border-l p-0 md:m-0 m-2">
            <CardHeader className="p-4">
              <h2 className="text-xl font-semibold">Generating...</h2>
            </CardHeader>

          </Card>
        )}

        {iframeRef && !isGenerating && messages.length !== 0 && (

          <Card
            className="border-l p-0 m-0">
            <iframe
              ref={iframeRef}
              title="Live Preview"
              className="w-full h-full min-h-[80vh] rounded-xl overflow-scroll scroll-hidden"
              sandbox="allow-scripts allow-same-origin"
            />
          </Card>
        )
        }
      </CardContent>
    </Card >
  );
}
>>>>>>> b7dcbffb548d66e4c4d3b906336f226f7135f874
