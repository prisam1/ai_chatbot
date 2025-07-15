'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, LogOut } from 'lucide-react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function Chat() {


  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  const latestMessage = messages.findLast((m) => m.role === 'bot');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router]);


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
    setIsGenerating(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();
      if (res.ok && data.html) {
        setMessages((prev) => [...prev, { role: 'bot', content: data.html }]);
      } else {
        console.error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Request failed', err);
    } finally {
      setIsGenerating(false);
      setInput('');
    }
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
    <div className="h-screen flex flex-col">
      <Card className="flex-1 overflow-hidden border-none rounded-none bg-gradient-to-r from-blue-500 to-purple-600">
        <CardHeader className="flex flex-row justify-between px-4 py-2 border-b">
          <h1 className="text-2xl font-bold">AI Landing Page Generator</h1>
          <Button
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardHeader>

        {/*User & bot message */}
        <CardContent className={`grid ${"md:grid-cols-2"}  h-full p-0`}>
          <div className="flex flex-col h-full">

            <ScrollArea
              className="h-[calc(100vh-210px)] px-4 space-y-2 pr-2">

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`relative group p-1 text-${msg.role === 'user' ? 'right' : 'left'}`}
                >
                  <div className="inline-block bg-muted  px-3 py-2 rounded-lg max-w-2xl text-sm whitespace-pre-wrap overflow-auto max-h-60">
                    {msg.content.length > 100 && msg.role === 'bot'
                      ? msg.content
                      : msg.content}
                  </div>

                  {/*Copy Button */}
                  {msg.role === 'bot' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-1 ml-2 hover:bg-gray-300  transition"
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                    >
                      Copy
                    </Button>
                  )}
                </div>
              ))}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-2 py-3 border-t">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your landing page..."
                className="flex-1"
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
            <Card className="border-l p-0">
              <CardHeader className="p-4">
                <h2 className="text-xl font-semibold">Start by asking for a landing page, e.g., "Create a modern hero section for a tech startup."</h2>
              </CardHeader>

            </Card>
          )}

          {/*Live Preview */}
          {isGenerating && (
            <Card className="border-l p-0 ">
              <CardHeader className="p-4">
                <h2 className="text-xl font-semibold">Generating...</h2>
              </CardHeader>

            </Card>
          )}

          {iframeRef && !isGenerating && messages.length !== 0 && (
            <Card className="border-l p-0 ">
              <iframe
                ref={iframeRef}
                title="Live Preview"
                className="w-full h-full min-h-[500px] rounded-xl border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </Card>)}

        </CardContent>
      </Card>
    </div>
  );
}
