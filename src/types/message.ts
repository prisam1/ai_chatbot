export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    shareId?: string | null;
  }

export interface Usage {
    used: number;
    limit: number;
  }
