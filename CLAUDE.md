# Project Context: KAJE

This is a modern Next.js 16+ project utilizing the App Router, React 19, and Tailwind CSS v4.

## 🛠 Tech Stack
- **Framework**: Next.js 16.2.9 (App Router)
- **Frontend**: React 19.2.4, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI Primitives, Lucide React for icons
- **State Management**: Zustand
- **Backend/Auth**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Payments**: Razorpay
- **Emails**: Resend & React Email
- **Media Management**: Cloudinary (`next-cloudinary`)
- **Notifications**: Sonner, React Hot Toast

## 📂 Project Structure
- `/app` - Next.js App Router (Pages, Layouts, API routes).
- `/actions` - Server Actions for data mutations and backend logic.
- `/components` - Reusable UI components.
- `/store` - Zustand global state stores.
- `/hooks` - Custom React hooks.
- `/lib` - Utility functions, helpers, and shared logic.
- `/types` - TypeScript type definitions and interfaces.
- `/supabase` - Supabase client initialization and database helpers.
- `/emails` - React Email templates for transactional emails.
- `/public` - Static assets like images and fonts.

## ⚠️ Key Rules & AI Instructions
1. **Next.js 16+ Nuances**: This project uses Next.js 16.2.9. APIs, conventions, and file structure may differ from your training data. Heed deprecation notices.
2. **React 19**: Features from React 19 (like hooks, actions, new form capabilities) should be leveraged where appropriate.
3. **Tailwind v4**: This project uses Tailwind CSS v4. Be aware of its newer, simpler configuration paradigm (often CSS-based rather than `tailwind.config.js`).
4. **Data Fetching & Mutations**: Favor Next.js Server Actions (stored in `/actions`) for mutations instead of traditional API routes.
5. **Authentication**: Handled via Supabase SSR. Ensure secure server-side fetching when dealing with user data.
6. **Reference AGENTS.md**: For specific rule enforcements (like the Next.js guide rules), refer to `AGENTS.md`.
