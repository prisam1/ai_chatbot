## AI Landing Page Generator

## Live - https://ai-chatbot-puce-nine-71.vercel.app/

Project Name: AI Landing Page Generator (Chatbot)
Overview:
A full-stack AI-powered chatbot application designed to facilitate interactive conversations between users and an artificial intelligence model. It provides secure user authentication, stores conversation history, and is built for scalability and performance. And to generate (landing page) HTML pages as per user requirement.

## 🚀 Features

- ✨ AI prompt-to-HTML landing page generator
- 🧠 Supports Gemini (Google) APIs
- 🔐 Auth system with Google OAuth and Credentials (NextAuth.js)
- 📜 Full chat history with message persistence (Prisma + Supabase)
- 💾 Download generated pages as `.html`
- 🔁 Session-aware login/logout with redirection
- 🔍 Live preview of generated HTML pages
- 🧩 Modular code with custom hooks and services
- 🎯 Vercel-compatible deployment


## 🧰 Tech Stack

| Tech             | Usage                                     |
|------------------|--------------------------------------------|
| Next.js          | App framework (App Router)                |
| TypeScript       | Type safety                                |
| Tailwind CSS     | Styling and layout                         |
| Prisma           | ORM                                        |
| Supabase         | PostgreSQL database                        |
| NextAuth.js      | Auth system with Google/Credentials        |
| OpenAI/Gemini    | LLM support for HTML generation            |
| Vercel           | Production deployment   
| SchadCN          | Component Based UI


# Steps to setup project
 
# git clone https://github.com/prisam1/ai_chatbot
cd ai_chatbot
Install NPM packages:

Bash 
## OR yarn install
## OR npm install
Environment Variables
Create a .env file in the root of your project and add the environment variables.
 
npx prisma generate
Apply Database Migrations:

This command will apply any pending database schema changes defined in prisma/migrations to your connected Supabase database.
 
Example:
Once the application is running, navigate to http://localhost:3000.
Register/Login: Create a new account or log in using existing credentials.
Start Chatting: Begin a new conversation with the AI to generate Landing Page.
Live Preview: Live preview of generated HTML page.
Download: Download Landing page.
View History: Access your past conversations.
 

# Contact
# Name - Pritam Kumar Samaddar
# Project Link: https://github.com/prisam1/ai_chatbot
# live link : https://ai-chatbot-puce-nine-71.vercel.app