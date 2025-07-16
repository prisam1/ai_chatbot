import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {

  const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(
      `Generate a complete responsive HTML + CSS landing page for: "${prompt}". Return only full valid HTML document.`
    );

    let content = result.response.text();
 
    content = content
    .replace(/^```html\s*/i, '')
    .replace(/```$/, '') 


    return NextResponse.json({ html: content });
  } catch (err) {
    console.error('[API_CHAT_ERROR]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
 