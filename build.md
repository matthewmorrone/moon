# Build Specification (Schema-Style): Interactive Lyrics Page from Video + SRT

## -1. Scope & Assumptions

- Single-file deliverable: exactly one `index.html` with inline `<style>` and `<script>`. No external JS. The only allowed external resource is the fonts URL in §2.5.
- Runtime: modern desktop and mobile Chromium/WebKit/Gecko browsers. No Node.js or server APIs.
- Inputs are provided to the LLM as strings or uploaded files; the LLM must inline SRT strings per §12.1 or read an uploaded SRT and inline it.
- Language-agnostic baseline: if language-specific analysers are unavailable, use the deterministic segmentation rules in §8 and Appendix A.
- Failure policy: if any normative check fails (e.g., zero cues or zero rows), the model must not emit `index.html` and must answer exactly `I dont know`.

**Exactly follow these rules. No interpretation. If uncertain, respond exactly `I dont know`.**  
**Inputs available to the LLM:** a video file (`video_src`), an SRT file (`srt`), an optional SRT path (`srt_path`), and optionally a translation SRT (`translation_srt`) and `annotations`.

---

## 0. Goal and Parity Targets

### Rules
```
0.1 Layout & behavior parity:
     - Two-column lyric rows (source left, translation right).
     - Time-synced active-row highlighting.
     - Cross-highlighting between aligned word groups/phrases.
     - Tooltips with linguistic metadata.
     - Full-bleed background video with dark overlay.
     - On-page playback controls.

0.2 Keyboard controls:
     - Space / Enter / NumpadEnter → toggle play/pause.
     - ArrowRight / ArrowLeft → seek to next/previous row start-time.
     - ArrowUp → toggle mute.
     - ArrowDown → toggle loop.
     - Key "S" / "s" → toggle scroll-follow.
     - Key "F" / "f" → toggle furigana visibility.

0.3 Interaction affordances:
     - Clicking a lyric row seeks video to that row's start-time and resumes playback.
     - Currently playing row is visually distinct.
     - Hovering any source group or translation phrase highlights its aligned counterpart and shows a tooltip.
```
---

## 1. Inputs (Schema)

### Schema
```
video_src: string              # Path/URL to MP4 (H.264/AAC).
srt: string                    # UTF-8 SRT (source language).
srt_path (optional): string    # Filesystem-style path to SRT (e.g., tuxedo-mirage/tuxedo-mirage.srt)
translation_srt (optional): string    # UTF-8 SRT, 1:1 aligned by cue index.
annotations (optional): dict[string -> {
    kanji?: string,
    kana?: string,
    romaji?: string,
    meaning: string,
    grammar: string,
    lyric_note?: string
}]
title (optional): string       # Page title; ruby allowed.
theme (optional): dict         # CSS token overrides, names in §6.
```
---

### 1.A SRT Resolution Order (Normative)

When both a video and an SRT are provided by name/path (e.g., `tuxedo-mirage/tuxedo-mirage.srt`), the builder must inline the SRT **contents** and must not attempt any runtime file I/O.

**Resolution priority**
1) If `srt` (string) is provided → use it directly.  
2) Else if an uploaded SRT file is provided and its path equals `/<slug>/<slug>.srt` (case-insensitive on extension) where `<slug>` is derived from the song/video name → use that file’s **contents**.  
3) Else if `srt_path` is provided → resolve to the uploaded file with that exact path and use its **contents**.  
4) Else → respond exactly `I dont know`.

**Prohibitions**
- Do not reference the SRT by path in the emitted HTML.  
- Do not use `fetch`, file reads, or dynamic loading at runtime; the SRT must be **inlined** per §12.1.

---

## 2. Output Artifacts

### Rules
```
2.1 Produce a single self-contained index.html with inline <style> and <script>.
2.2 No Node.js, require(), or server APIs allowed. No file reads, no fetch from disk.
     - Inline all SRT and translation content as string constants in <script>.
2.3 DOM skeleton (ids/classes are normative):
     - .video-background → <video id="bg-video" src="{{VIDEO_SRC}}" autoplay muted playsinline preload="metadata">
     - .video-overlay
     - .container → <h1>, .controls, #lyrics-body
     - #lyrics-body contains multiple .lyric-row
2.4 Controls use inline SVG icons (no external icon font).
2.5 If using web fonts, use exactly this stylesheet URL (mandatory, no exceptions):
     https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Prata:wght@400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap
2.6 Autoplay & gesture fallback: Implement `ensurePlayback()` that calls `video.play()` and, if the promise rejects, sets `needsUserGesture=true`; on the first user gesture (`click|keydown|touchstart`) call `video.play()` again and clear the flag.
```
---

## 3. Deterministic Processing Rules

### Rules
```
3.1 Parse SRT strictly → cues: {index, start, end, text}. Normalize times to float seconds with millisecond precision.
3.2 If translation_srt exists, align by cue index (1:1). Else, translate each cue to a single concise sentence.
3.3 Do not merge or reorder cues relative to SRT input. Preserve count equality with SRT.
3.4 Whitespace handling:
     - Trim leading/trailing spaces per cue.
     - Preserve punctuation.
     - Join multi-line cue text with a single space.
3.5 Readings/romanization (CJK):
     - If source contains kanji, render readings with <ruby>KANJI<rt>KANA</rt></ruby>.
     - Provide romaji in tooltip fields.
     - Non-CJK: no ruby; kana/romaji empty.
3.6 Word grouping & alignment:
     - Must implement actual deterministic segmentation:
       At minimum split by whitespace and punctuation, do not leave TODO stubs.
     - Produce translation phrase for each group. Never leave all phrases "[...]".
     - Assign stable group_id = "{line_idx}-{pair_idx}" (1-based).
     - No unpaired items; enforce exact 1:1 per row (see §9.6).
     - Minimum segmentation: if no language-specific segmenter is available, split by whitespace and Japanese punctuation (、。・「」『』!?—…) then merge obvious multi-token phrases (noun+particle, verb+aux).
3.7 Tooltip data:
     - Populate with real values:
       - data-meaning: if unknown, copy original text.
       - data-grammar: if unknown, "Unclassified".
       - data-kanji/kana/romaji: fill if relevant; else empty.
     - Do not leave all fields empty by default.
     - Non-empty tooltips: in every row, at least one group must have non-empty data-meaning and data-grammar.
3.8 Accessibility:
     - Every control has aria-label.
     - Do not suppress focus outlines; they must be visible.
3.9 Defaults:
     - Start muted (video.muted = true).
     - Scroll-follow ON by default.
     - Loop OFF by default.
     - Furigana ON (visible) by default.
3.10 Title ticking:
     - Update document.title live as "(M:SS) - <title>" (minutes without leading zero; seconds 00–59 zero-padded).
```
---

### 3.A SRT Grammar (Normative)

- A cue is: an integer index line, a timestamp range line, then 1..N text lines, then a blank line.
- Timestamp format: `HH:MM:SS,mmm --> HH:MM:SS,mmm` (2-digit HH allowed to exceed 23). Surrounding spaces permitted.
- Normalize Windows CRLF and Mac CR to LF before parsing.
- Join multi-line text with a single space.
- Reject cues whose end ≤ start.
- Parsing regex (for each timestamp token): `^(\d{2}):(\d{2}):(\d{2}),(\d{3})$` (anchored). Convert to seconds as `h*3600 + m*60 + s + ms/1000` with millisecond precision.
- If any cue fails to parse, skip that cue; do not stop processing others. If zero valid cues remain, the build is invalid (see §12.9).

---

## 4. Data Model (In-Memory)

### Structures
```
line.index: int         # 1-based cue index
line.start: float       # seconds
line.end: float         # seconds; must satisfy end > start

line.source_groups[]: array of {
  text_html: string     # may include <ruby>…</ruby>
  tooltip: {
    kanji?: string,
    kana?: string,
    romaji?: string,
    meaning: string,    # concise gloss
    grammar: string,    # e.g., Noun, Godan verb, Particle
    lyric_note?: string
  }
  group_id: string      # "{line.index}-{k}"
}

line.translation_phrases[]: array of {
  text: string
  group_id: string      # matches one source group_id
}

Constraint: len(source_groups) == len(translation_phrases) for every line.
```
---

## 5. DOM Construction

### Rules
```
5.1 Create one .lyric-row per cue with:
     data-start-time="{line.start.toFixed(3)}"
     data-end-time="{line.end.toFixed(3)}"

5.2 Children:
     <p class="japanese-line">
       <span class="word-group" data-group-id="X-Y">
         <span class="word-tooltip"
               data-meaning="…"
               data-grammar="…"
               data-kanji="…"
               data-kana="…"
               data-romaji="…"
               data-lyric-note="…">
           {{SOURCE_TEXT_HTML}}
         </span>
       </span>
       … (repeat per group)
     </p>

     <p class="translation-line">
       <span class="translation-phrase" data-group-id="X-Y">
         {{TRANSLATION_PHRASE}}
       </span>
       … (repeat per phrase)
     </p>

5.3 Equal counts per row (enforced by §3.6 / §9.6).
5.4 <h1> shows the page title; ruby allowed in title text if relevant.
5.5 Translation content policy: The .translation-line must not duplicate the source script as a default; if a reliable translation cannot be produced for a specific group, use "[...]" for that group only (do not mirror the entire source cue).
```
---

## 6. Styling (CSS Tokens, Layout, Micro-Rules)

### CSS variables (define defaults; allow override via `theme`)
```
--controls-bg
--controls-hover
--controls-active
--text-light
--text-dark
--text-muted
--bg-dark-translucent
--border-color
```

### Layout & micro-rules
```
6.1 Background video:
     - .video-background is fixed; <video id="bg-video"> uses object-fit: cover; width/height: 100vw/100vh.

6.2 Overlay:
     - .video-overlay sits above video; semi-opaque dark to improve text contrast.

6.3 Container:
     - Centered, max-width ≈ 1200px.
     - Translucent background, rounded corners, drop shadow.
     - Vertical scroll area height: clamp to (viewport height - outer margins).
     - Hide native scrollbar visually if styling requires; ensure scroll remains usable.

6.4 Lyrics grid:
     - Each .lyric-row uses CSS grid with grid-template-columns: 1fr 1fr and a column gap.

6.5 Highlighting:
     - .lyric-row.highlight-line adjusts background and text colors for legibility.
     - Ensure <rt> text in <ruby> maintains sufficient contrast in both normal and highlighted states.
     - Cross-hover classes:
       - .highlight-jp-group on source group.
       - .highlight-en-phrase on translation phrase.

6.6 Tooltips:
     - Absolutely positioned floating panel near target.
     - Attempt to render above; if insufficient space, render below.
     - Clamp horizontally to viewport; subtle border and shadow.

6.7 Controls:
     - Circular buttons, clear hover and active states (use tokens).
     - Visible focus ring for keyboard users.
     - Icons must visibly change between active/inactive states (distinct inline SVGs).
     - Buttons must have a minimum hit size of 40px (width/height) and contain an inline `<svg>` with explicit `width` and `height` attributes.
     - Ensure visibility via CSS: `button.control-btn svg { display: inline-block; vertical-align: middle; }`.

6.8 Coarse-pointer devices:
     - Disable CSS transitions/animations that hinder performance.

6.9 Furigana toggle:
     - Define `.hide-furigana ruby rt { display: none; }`
     - Tooltips must continue to display kana/romaji even when furigana are hidden.
     - Toggling must not collapse spacing or break alignment.
```
---

## 7. Behavior and Event Logic (JavaScript)

### Initialization & cached refs
```
7.1 On DOMContentLoaded:
     - Cache: video, playPauseBtn, loopBtn, muteBtn, scrollLockBtn,
              furiganaBtn, container, lyricsBody, lyricRows,
              all .word-group and .translation-phrase spans.
     - State: isScrollFollowing = true; currentRowIndex = -1; pointerIsCoarse = matchMedia('(pointer: coarse)').matches
     - Set video.muted = true; set loopBtn .active if video.loop true (default false).
     - Render initial icons for play/pause, loop, mute, scroll-follow, furigana.
     - Set initial button SVGs via the normative `icons` mapping (see §16):
       - `playPauseBtn.innerHTML = video.paused ? icons.play : icons.pause`
       - `muteBtn.innerHTML = video.muted ? icons.volumeOff : icons.volumeOn`
       - `loopBtn.innerHTML = video.loop ? icons.loop : icons.loop`  # same glyph; active state shown via `.active`
       - `scrollLockBtn.innerHTML = isScrollFollowing ? icons.scrollFollow : icons.scrollLocked`
       - `furiganaBtn.innerHTML = icons.furigana`
     - Ensure each control button has `aria-pressed` reflecting its state after icon initialization.
     - If no explicit title is provided, set `<h1>` and `document.title` base to the video file name (strip extension); still apply §3.10 ticking.
7.1.1 Playback bootstrap: Implement ensurePlayback() and attach one-time listeners for click, keydown, and touchstart on document to trigger ensurePlayback() if needsUserGesture is true. Remove these listeners once playback succeeds.
```

### Playback controls
```
7.2 togglePlayPause():
     - If video.paused: if video.muted and the user action is explicit play, unmute; then video.play().catch(() => needsUserGesture = true).
     - Else video.pause().
     - updatePlayPauseIcon() after state change.
7.2.1 Promise-safe play: All calls to video.play() are handled with .catch(() => needsUserGesture = true).
7.2.a Icon updates:
  - `updatePlayPauseIcon()` MUST set `playPauseBtn.innerHTML` to `icons.play` when paused and `icons.pause` when playing.
  - `updateMuteIcon()` MUST set `muteBtn.innerHTML` to `icons.volumeOff` when muted and `icons.volumeOn` when unmuted.
  - `updateScrollLockIcon()` MUST set `scrollLockBtn.innerHTML` to `icons.scrollFollow` when following and `icons.scrollLocked` when locked.
```

### Other toggles
```
7.3 Mute & loop:
     - toggle mute → updateMuteIcon().
     - toggle loop → video.loop = !video.loop; reflect .active state.

7.4 Scroll-follow:
     - Toggle isScrollFollowing; updateScrollLockIcon().

7.5 Furigana toggle:
     - Clicking furiganaBtn toggles class .hide-furigana on <body>.
     - Update furiganaBtn .active state.
     - Does not affect tooltips (kana/romaji remain visible).
7.5.1 Furigana spacing invariant: Hiding <rt> must not alter base text width or remove <ruby>.
7.5.2 Mandatory implementations: The final HTML must not contain any "TODO" text or unimplemented stubs.
```

### Time synchronization (with throttling)
```
7.6 Listener strategy:
     - If pointerIsCoarse: attach a throttled handler around 'timeupdate' that runs ≥ every 200ms.
     - Else: handle every 'timeupdate' event.

7.7 updateTime():
     - Update document.title to "(M:SS) - <title>" (see §3.10).
     - Determine active row: currentTime ∈ [start, end). If overlaps exist, choose the last row whose start ≤ currentTime.
     - Add .highlight-line to active row; remove from previously active.
     - If active row changed && isScrollFollowing:
         element.scrollIntoView({ behavior: pointerIsCoarse ? 'auto' : 'smooth', block: 'center' }).
```

### Interaction & keyboard
```
7.8 Row click:
     - On click of .lyric-row: seek video.currentTime = Number(dataset.startTime); ensurePlayback().

7.9 Keyboard:
     - Space/Enter/NumpadEnter → togglePlay/Pause
     - ArrowRight → seek to next row's start; ArrowLeft → previous row's start
     - ArrowUp → toggle mute
     - ArrowDown → toggle loop
     - 'S' or 's' → toggle isScrollFollowing
     - 'F' or 'f' → toggle furigana visibility

7.10 Cross-highlighting:
     - Hover on .word-group → add .highlight-jp-group to it and .highlight-en-phrase to the matching translation phrase (same data-group-id).
     - Hover on .translation-phrase → add .highlight-en-phrase and the paired source gets .highlight-jp-group; also show that group's tooltip.

7.11 Tooltip behavior:
     - Show on mouseenter; hide on mouseleave.
     - Position above if space, else below; clamp within viewport width.
```
---

## 8. Grouping & Alignment Procedure

### Procedure
```
8.1 Tokenize source text into semantic groups suitable for alignment (e.g., idioms; verb+aux; noun+particle).
8.2 Translation granularity (Japanese): Create phrase-level translations aligned 1:1 with source groups (not token-level glosses). Do not copy the source token as translation by default; if unsure for a group, output "[...]".
8.3 Assign group_id sequentially in source order: "{line_idx}-{k}" with k starting at 1.
8.4 Render:
     - Source groups in source order.
     - Translation phrases in target order.
     - Both carry the identical group_id.
8.5 Japanese-specific:
     - Wrap kanji within source groups using <ruby>…<rt>kana</rt></ruby>.
     - Tooltip fields per group: data-kanji (kanji-only or empty), data-kana, data-romaji, data-meaning, data-grammar, optional data-lyric-note.
8.5.1 Readings derivation rules:
     a) If a group contains kanji, attempt kana via internal knowledge; if uncertain, leave data-kana empty (do not copy kanji as kana).
     b) Only generate data-romaji from kana; if kana unknown, leave romaji empty.
     c) Never set data-kana or data-romaji equal to the original kanji string.
     d) data-meaning is a concise English gloss; do not copy the Japanese token unless unknown.

8.5.2 Minimal Japanese grouping heuristics
  - Merge particle with its head: `[名詞]+(は|が|を|に|へ|で|と|より|から|まで|の)`.
  - Merge verb + auxiliary (ます/ない/たい/た/ている/させる/られる/よう/そう/らしい/かもしれない).
  - Merge fixed expressions (e.g., ありがとう, お願いします) as single groups.
  - Do not split emoji or ASCII runs; treat contiguous ASCII as one group.
8.6 Non-CJK:
     - Omit ruby.
     - Still populate data-meaning and data-grammar succinctly.
8.7 Presentation-only:
     - The furigana visibility toggle does not affect segmentation, grouping, or group_id assignment; it only changes <rt> visibility.
```
---

## 9. Edge Cases & Normalization

### Rules
```
9.1 Skip cues that are empty or punctuation-only after trimming.
9.2 If (end - start) < 0.3s: render row; do not auto-scroll unless it becomes active.
9.3 Overlapping cue times: active row is the last cue whose start ≤ currentTime.
9.4 If you cannot confidently translate a group: set translation phrase text to "[...]". 
     - Do not output all phrases as "[...]". 
     - Default fallback: copy original text.
9.5 Unknown metadata: 
     - data-meaning = original text if unknown.
     - data-grammar = "Unclassified".
     - Other attributes left empty if not relevant.
9.6 Enforce 1:1 group/phrase count per row:
     - If mismatch, adjust translation side only (split or merge phrases) to match source segmentation; do not change source segmentation.
```
---

## 10. Acceptance Tests (Self-Check)

### Checklist
```
10.1 Play video; verify active row highlights on time and auto-scrolls to center.
10.2 Click any three rows; verify seeks occur and playback resumes.
10.3 Hover a source group; exactly one translation phrase highlights; tooltip appears with metadata.
10.4 Hover a translation phrase; the paired source group highlights; tooltip appears.
10.5 Toggle mute, loop, scroll-follow; visual states persist correctly.
10.6 Keyboard shortcuts perform as specified in §7.9.
10.7 Narrow/mobile viewport: stacked layout remains legible; transitions disabled on coarse pointers; no layout breakage.
10.8 Toggling the furigana control hides/shows all <rt> elements without changing alignment, selection, or tooltip content; the button’s visual state reflects the current mode.
10.9 Verify no Node.js or external API calls exist.
10.10 Verify every lyric row has at least one group/phrase with non-empty tooltip values.
10.11 Verify translations are not uniformly “[...]”.
10.12 Verify furigana toggle preserves alignment and text flow.
10.13 First-gesture playback: With ‘autoplay muted playsinline’, playback begins when allowed; if blocked, the first user gesture starts playback (no console errors).
10.14 Visible icons: Each control renders an inline SVG; toggling states swaps to a distinct SVG.
10.15 Translation integrity: In ≥80% of cues, translation phrases differ from the source script (not copied wholesale).
10.16 Reading validity: For groups containing kanji, <rt> is not equal to the kanji string; kana/romaji are empty only when unknown.
10.17 No stubs: The output contains no “TODO” strings and no unimplemented functions.
10.18 Lyrics body population: `#lyrics-body` contains ≥1 `.lyric-row` after build; otherwise the build is invalid.
10.19 Icons visible: Each control button has non-empty `innerHTML` containing an `<svg>` on initial render; toggling updates to a distinct `<svg>`.
10.20 SRT inlining from path: If only `srt_path` or an uploaded file path like `/<slug>/<slug>.srt` is given, the final HTML still inlines the SRT text and contains **no** <link>/<source>/<track> or JS fetch calls to `.srt`.
```
---

## 11. Minimal HTML Skeleton (Normative IDs/Classes)

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>{{PAGE_TITLE}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Prata:wght@400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <style>/* Implement §6 */</style>
</head>
<body>
  <div class="video-background">
    <video id="bg-video" src="{{VIDEO_SRC}}" autoplay muted playsinline preload="metadata"></video>
  </div>
  <div class="video-overlay"></div>

  <div class="container">
    <h1>{{TITLE_HTML}}</h1>

    <div class="controls main-controls">
      <button id="play-pause-btn" class="control-btn" aria-label="Play/Pause"></button>
      <button id="loop-btn" class="control-btn" aria-label="Toggle Loop"></button>
      <button id="mute-btn" class="control-btn" aria-label="Mute/Unmute"></button>
      <button id="scroll-lock-btn" class="control-btn active" aria-label="Toggle Scroll Lock"></button>
      <button id="furigana-btn" class="control-btn" aria-label="Toggle Furigana"></button>
    </div>

    <div id="lyrics-body" class="lyrics-grid">
      {{LYRIC_ROWS_HTML}}
    </div>
  </div>

  <script>/* Implement §7 */</script>
</body>
</html>
```
---

## 12. Build Algorithm (Exact Order)

### Steps
```
12.1 Resolve and inline SRT: per §1.A, select the SRT **contents** (string) from `srt` → uploaded file at `/<slug>/<slug>.srt` → `srt_path`. Insert that content into a JavaScript string constant inside <script>. Do the same for translation_srt if provided. Never reference file paths or perform runtime fetches.
12.2 Parse the SRT string(s) into arrays of cues [{index, start, end, text}] with millisecond precision; normalize to float seconds.
12.3 If translation_srt exists, align by cue index; else, create a translation string for each cue (one concise sentence).
12.4 For each cue:
     a) Deterministically segment source text into source_groups (≥ whitespace/punctuation split).
     b) Create translation_phrases 1:1 with source_groups; if unknown, copy source text instead of leaving "[...]".
     c) Assign group_id sequentially in source order: "{line_idx}-{k}".
     d) Build row DOM HTML per §11 with required data-* attributes and tooltips (fallbacks per §3.7 and §9.5).
12.5 Concatenate all rows and insert into #lyrics-body.
12.6 Render <h1> from title (ruby allowed); set video src.
12.6.a If `title` is empty or missing, derive a base title from the video file name (strip extension) and use that for `<h1>` and initial `document.title`.
12.7 Attach CSS from §6 and JS behaviors from §7 (controls, timeupdate, keyboard, cross-highlighting, tooltips, furigana toggle).
12.8 Run acceptance tests in §10; if any fail, fix and re-emit index.html.
12.9 Validate output: ensure `document.querySelectorAll('#lyrics-body .lyric-row').length >= 1`. If zero, the build is invalid; do not emit the file.
```
---

## 13. Non-Goals
```
13.1 Do not run Whisper or any ASR.
13.2 Do not import external JS/CSS beyond the single fonts link in §2.5.
13.3 Do not alter SRT timings.
13.4 Do not add/remove cues relative to SRT.
13.5 Do not use Node.js APIs, require(), fs, or fetch local files; everything must be inline.
```
---

## 14. Device Considerations
```
14.1 Detect coarse pointer via window.matchMedia('(pointer: coarse)').matches.
14.2 On coarse pointers: throttle timeupdate handling to ≥200ms; disable CSS transitions/animations for performance.
14.3 All controls must be operable via keyboard and remote D-pads (tab focus + Enter/Space); visible focus rings are mandatory.
```
---

## 15. Delivery Format
```
15.1 Deliver a single complete index.html (self-contained).
15.2 IDs/classes and data-* attributes must match this spec exactly.
15.3 Speak neutrally without filler sounds, breaths, dramatization, or emotional affect.
```
---

## 16. Icon Set (Normative)

The following inline SVGs **must** be used for controls. Swap them on state change as per §6.7 and §10.14.

```js
const icons = {
    play: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    loop: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`,
    volumeOn: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    volumeOff: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
    scrollFollow: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15l-5-5h3V9h4v3h3l-5 5z"/></svg>`,
    scrollLocked: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
    furigana: `<svg width="24" height="24" viewBox="0 0 225 225" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g id="#ffffffff"></g><g id="#000000ff"><path fill="#000000" opacity="1.00" d=" M 75.22 19.24 C 81.08 18.14 87.40 19.30 92.39 22.61 C 100.91 27.97 105.12 39.30 102.07 48.90 C 99.33 58.40 89.97 65.64 80.01 65.48 C 72.15 65.72 64.26 61.61 60.10 54.91 C 55.60 48.11 55.11 38.89 58.82 31.65 C 62.01 25.29 68.24 20.60 75.22 19.24 Z" /><path fill="#000000" opacity="1.00" d=" M 139.54 19.58 C 152.69 15.69 167.51 26.05 168.44 39.71 C 170.43 52.76 159.09 65.58 145.95 65.49 C 133.49 66.28 122.15 55.37 121.92 43.00 C 121.37 32.34 129.13 22.01 139.54 19.58 Z" /><path fill="#000000" opacity="1.00" d=" M 103.17 75.01 C 109.39 75.00 115.61 74.99 121.84 75.01 C 121.82 81.27 121.84 87.54 121.83 93.81 C 140.58 93.81 159.32 93.82 178.07 93.80 C 178.08 99.99 178.07 106.18 178.08 112.37 C 172.08 112.31 166.07 112.41 160.07 112.31 C 155.95 131.30 142.43 146.25 128.64 159.12 C 143.83 171.15 158.85 183.40 174.14 195.30 C 170.35 200.29 166.23 205.02 162.53 210.08 C 146.48 197.02 130.16 184.28 114.11 171.21 C 97.97 184.21 81.84 197.21 65.57 210.04 C 61.78 205.12 58.01 200.15 53.96 195.44 C 69.34 183.49 84.41 171.12 99.66 159.00 C 87.92 148.43 77.26 136.24 70.39 121.90 C 77.58 121.90 84.77 121.91 91.97 121.90 C 98.15 131.21 105.68 139.58 114.00 147.04 C 124.67 137.24 135.03 126.12 140.17 112.34 C 109.09 112.38 78.01 112.32 46.92 112.37 C 46.93 106.18 46.92 99.99 46.93 93.80 C 65.67 93.82 84.42 93.81 103.17 93.81 C 103.17 87.54 103.17 81.27 103.17 75.01 Z" /></g></svg>`
};
```
---

## Appendix A — Reference Algorithms (Normative)

A.1 `timeToSeconds(hh, mm, ss, mmm)` → `Number`
```
- Input strings must be 2,2,2,3 digits respectively; return `h*3600 + m*60 + s + mmm/1000`.
- Must be precise to milliseconds (use integer math, divide at end).
```

A.2 `parseSrt(srtString)` → `Array<Cue>`
```
- Normalize newlines to `\n`.
- Split on blank lines.
- For each block, parse `index`, `start`, `end`, then join remaining lines with one space as `text`.
- Enforce §3.A timestamp regex; skip invalid blocks.
- Return an array of cues sorted by `start`. Do not reindex.
```

A.3 `ensurePlayback(video)` (promise-safe)
```
- Try `video.play()`. On rejection, set global `needsUserGesture = true`.
- Attach one-time listeners to `document` for `click|keydown|touchstart` to retry `video.play()`; on success, clear the flag and remove listeners.
```

A.4 `throttle(fn, ms)`
```
- Ensure `fn` executes at most once per `ms`. Use a timestamp guard; do not rely on setTimeout drift alone.
```

A.5 `escapeHtml(s)`
```
- Replace `&`, `<`, `>`, '\"', and `'` with HTML entities when injecting plain text.
```

## 17. Conformance Checklist (Pre-Emit, Normative)

Before emitting `index.html`, verify each item. If any item fails, do not emit the file and respond exactly `I dont know`.

**Inputs & Parsing**
- [ ] SRT provided as string or uploaded file and inlined per §12.1.
- [ ] `parseSrt` returns ≥ 1 valid cue (§3.A). Invalid cues are skipped; zero valid cues invalidates the build (§12.9).
- [ ] For each cue, `end > start` and times normalized to seconds with ms precision (§3.1, §3.A).

**DOM & Structure**
- [ ] DOM skeleton matches §2.3 and §11 exactly (ids/classes/data-* are present).
- [ ] `#lyrics-body` contains ≥ 1 `.lyric-row` (§12.9, §10.18).
- [ ] Each row has equal counts of `.word-group` and `.translation-phrase` with matching `data-group-id` (§3.6, §5.3).

**Styling & Controls**
- [ ] Controls exist and are keyboard focusable with visible focus rings (§6.7).
- [ ] Each control button `innerHTML` contains an inline `<svg>` icon on initial render (§6.7, §7.1). Icons visibly change on state toggles (§7.2.a, §10.19).
- [ ] Buttons meet 40px minimum hit-size and SVGs have explicit width/height (§6.7).

**Behavior**
- [ ] Video element has `autoplay muted playsinline preload="metadata"` (§2.6) and `ensurePlayback()` is implemented (§7.1.1).
- [ ] Time sync highlights exactly one active row; scroll-follow works (§7.6–§7.7).
- [ ] Row click seeks to the row start and resumes playback (§7.8).
- [ ] Keyboard shortcuts work: Space/Enter/NumpadEnter, Arrows, S/F (§7.9).
- [ ] Furigana toggle hides `<rt>` only; tooltips still show kana/romaji (§6.9, §7.5.1).

**Content Integrity**
- [ ] Translation phrases are not wholesale copies of source; `[...]` only per unknown group (§5.5, §8.2, §9.4, §10.15).
- [ ] At least one group per row has non-empty `data-meaning` and `data-grammar` (§3.7, §10.10).
- [ ] For kanji groups, `<rt>` is kana (or empty); do not duplicate kanji into kana/romaji (§8.5.1, §10.16).

**Quality & Compliance**
- [ ] No `TODO` strings or unimplemented stubs remain (§7.5.2, §10.17).
- [ ] No Node.js/server APIs; no external JS; only the fonts URL in §2.5 is used (§2.1–§2.5, §13.5).
- [ ] Accessibility attributes present: `aria-label` on controls; `aria-pressed` reflects state (§3.8, §7.1).
- [ ] Document title updates to `(M:SS) - <title>` while playing; base title set from `title` or video filename (§3.10, §7.1, §12.6.a).
