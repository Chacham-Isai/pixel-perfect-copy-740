

## Plan: Enlarge nav logo + add watermark pattern to landing pages

### 1. Index page (public marketing page) — `src/pages/Index.tsx`
- Increase nav logo from `h-14` to `h-20`
- Add the logo-transparent.png as a repeating watermark background across the entire page at very low opacity (~0.03-0.04), using a fixed position overlay with `pointer-events-none`

### 2. Public landing page — `src/pages/PublicLandingPage.tsx`
- Import `logo-transparent.png` as a fallback watermark
- Add the same watermark pattern overlay (fixed, full-screen, low opacity ~0.03) behind all content
- If agency has a `logo_url`, use that for the watermark instead of the default logo

### 3. Sidebar logo — `src/components/AppSidebar.tsx`
- Increase sidebar logo from `h-12` to `h-16` for consistency

### Technical details
- The watermark will be a CSS `background-image` with `repeat` tiling on a fixed-position div covering the viewport
- Opacity set to 0.03-0.04 so it's visible but doesn't interfere with readability
- `pointer-events-none` and `select-none` ensure it doesn't block interactions
- Z-index set to 0, content stays above it

