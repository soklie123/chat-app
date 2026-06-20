/**
 * Tailwind v4 note:
 * All theme tokens (colors, radius, shadows, animations, fonts) now live
 * in styles/globals.css inside the @theme block — v4 reads CSS directly
 * and does NOT merge this file's `content`/`theme.extend` automatically.
 *
 * This file is kept only because @tailwindcss/postcss still looks for it
 * if present, and it's a safe place for plugin registration later
 * (e.g. @tailwindcss/typography). If you don't add a v4 plugin, you can
 * delete this file entirely — globals.css alone is enough.
 */
module.exports = {
  plugins: [],
};