# Zeene Roadmap

## Done ✅

- **Auth** — Email/password signup and login with Supabase
- **Display name setup** — Set name on first login, update anytime in profile
- **Create/join group** — Generate invite codes, join with code
- **Question garden** — Browse and add questions with category filtering (Fun, Deep, Rec, Life, Hot Take, Goals)
- **Answers** — Colorful sticky note interface for answering questions
- **Zine journal reader** — Page-turn animation, swipe support, navigate between spreads
- **Cover page** — Group name, member avatars with initials, month/year, question count
- **Top navigation** — Fixed nav with Zeene logo, group name, profile button
- **Profile panel** — Slide-out panel to update display name and sign out
- **GitHub Pages deployment** — Automatic builds and deployment

## In Progress 🚀

- **Garden card grid with categories** — Responsive 3-column grid (2 tablet, 1 mobile) with colorful cards, rotation effects, and category filtering pills

## Up Next 📋

- **Copy invite code button** — One-click copy to clipboard for easy sharing
- **Journal right page shows next question** — Instead of "no more answers," show the first answer from the next question
- **Garden empty state** — Better visual for when no questions match the filter or category

## Backlog 💭

- **AI question generator** — Generate category-appropriate starter questions
- **Default questions per category** — Seed new groups with questions for each category
- **Auto-save answers** — Save draft answers as users type
- **Real page flip animation** — 3D perspective flip instead of fade animation
- **Past issues shelf** — Browse and read previous months' zines
- **Member avatars in nav** — Show small avatars of group members in the top nav
- **Mobile polish** — Optimize touch targets, spacing, and interactions for mobile
- **Leaderboard/stats** — See who answered the most questions, most creative answers, etc.
- **Search questions** — Find specific questions by text or category
- **Export zine** — Download or print zine as PDF

## Known Bugs 🐛

- **Right page of journal shows "no more answers" instead of next question content** — When a question has more than 6 answers, the right page should show the first answer(s) from the next question, not a static message. Fix in `src/zine.js` `renderPage()` function.
