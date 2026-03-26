# DRAWMATRIX: A Professional Collaborative CAD Tool

## Online Realtime Drawing Tool

## Technologies

- Next.js: A React framework for server-side rendering (SSR) and static site generation (SSG), ensuring a performant and SEO-friendly application.
- TypeScript: Enhances code readability, maintainability, and type safety with strong typing and static type checking.
- Tailwind CSS: A utility-first CSS framework for rapid and responsive UI development.
- Shadcn UI: A UI component library that might provide pre-built components for common UI elements, potentially streamlining the development process.
- Zustand: A lightweight state management solution for managing application state in a centralized and reactive manner.

## Installation

- Clone the repository: git clone `https://github.com/kovid2580-blip/DrawMatrix-web-autocad-engine-.git`
- Install dependencies: `npm install` (or `bun install`)

## Development

- Start the development server: `npm run dev` (or `bun dev`)
- The application will be accessible at `http://localhost:3000` (default port)

## Collaboration & Deployment

To use the tool with others, you must deploy it online:

### 1. Frontend (Next.js)
- **Host**: [Vercel](https://vercel.com/) (recommended).
- Copy all environment variables from `.env.local` to Vercel's Dashboard.

### 2. Signaling Server (Socket.io)
- **Host**: [Railway](https://railway.app/) or [Render](https://render.com/).
- Deploy the `/server` folder.
- Update the client’s `SOCKET_URL` to point to your public server.

## Google Colab Integration

If you are using a separate **CAD Engine** on Google Colab:
1. Run your Colab notebook and expose the Flask/FastAPI server via `ngrok`.
2. Copy the ngrok URL.
3. Add it to `.env.local` (or Vercel environmental variables):
   `NEXT_PUBLIC_CAD_ENGINE_URL=https://your-ngrok-id.ngrok-free.app`
4. The system will now have the hooks to call your external AI/CAD engine.
