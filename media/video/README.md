# Prastav videos (source)

Animated videos rendered from HTML timelines. Not part of the website build.

- `demo.html` — 32 s website demo (1920×1080). Published at `public/demo/prastav-demo.mp4`.
- `promo.html` — 57 s promo for social media. Vertical 9:16 (`promo.html#v`, 1080×1920) and square 1:1 (1080×1080). No price shown; scene 9 says "Consultant-grade proposals, priced for NGO budgets."

## Re-render
1. In this folder: `npm init -y && npm i @fontsource/archivo @fontsource/noto-sans-devanagari playwright` (Chromium must be available).
2. Frames: `node frames.js` (demo) or `node pframes.js` (promo, both formats).
3. Music is synthesised (original, no licence needed); see the Python snippets in the session notes, or replace with any royalty-free track.
4. Encode: `ffmpeg -framerate 30 -i frames/f%04d.jpg -i music.m4a -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart -c:a aac -shortest out.mp4`

Each HTML file exposes `render(t)` (t in seconds) so every frame is deterministic.
