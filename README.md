# Zeene

A monthly zine app for friend groups. Create questions together, answer anonymously throughout the month, then read the compiled zine with everyone's responses.

## What it does

- **Sign up & group management** — Create or join a group with an invite code
- **Set your vibe** — Choose your display name on first login
- **Question garden** — Add and browse questions with category filtering (Fun, Deep, Rec, Life, Hot Take, Goals)
- **Answer anonymously** — Respond to questions throughout the month with colorful sticky note-style cards
- **Read the zine** — Flip through a beautifully designed monthly journal with a cover page showing all group members, month/year, and member avatars
- **Profile management** — Update display name and sign out anytime

## How to run locally

### Prerequisites
- Node.js (v16+)
- npm

### Setup

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd zeene
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the root (copy from `.env.example` if available)
   - Add your Supabase project credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Run the dev server
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5173`

## How to deploy

### GitHub Pages deployment

1. Ensure your repository is on GitHub
2. Configure your GitHub Pages settings to deploy from the `gh-pages` branch
3. Deploy the app
   ```bash
   npm run deploy
   ```

The app will be built and deployed to your GitHub Pages URL.

## Tech Stack

- **Frontend Framework** — Vite (vanilla JavaScript)
- **Styling** — CSS Grid, CSS Flexbox, CSS Variables, responsive design
- **Backend & Auth** — Supabase (PostgreSQL database, email/password auth)
- **API** — Supabase REST API with PostgREST
- **Deployment** — GitHub Pages
- **Fonts** — Neco (serif), Nunito (sans-serif), Fontshare

## Project Structure

```
zeene/
├── src/
│   ├── auth.js          — Login/signup screen
│   ├── group.js         — Create/join group
│   ├── profile.js       — Set display name on first login
│   ├── garden.js        — Question gallery with filtering
│   ├── answers.js       — Answer form and sticky notes
│   ├── zine.js          — Zine reader with cover and spreads
│   ├── nav.js           — Top navigation bar
│   ├── profilePanel.js  — Profile dropdown panel
│   ├── supabase.js      — Supabase client setup
│   ├── style.css        — All styling
│   └── main.js          — App entry point
├── index.html           — HTML entry point
├── vite.config.js       — Vite configuration
└── package.json         — Dependencies and scripts
```

## Database Schema

The app uses PostgreSQL tables in Supabase:
- `profiles` — user display names
- `groups` — group info and invite codes
- `group_members` — group membership
- `questions` — questions added to the garden (with category)
- `answers` — answers to questions (sticky notes)

## Color Palette

- Forest: `#2E5C2A` (dark green, primary)
- Meadow: `#6AAE63` (medium green)
- Moss: `#1A3318` (very dark green)
- Mint: `#EEF5EB` (light mint, backgrounds)
- Rose: `#D4789A` (dusty pink)
- Wisteria: `#8C6B9E` (purple)
- Card colors: `#EEE8B8`, `#EEC8D4`, `#D8CCE8`, `#C8DFB8`, `#F0D8C0`, `#C0D8EE`

## License

MIT
