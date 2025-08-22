Follow the binding specification in build.md to generate a lyric page for <SONG_TITLE>. 

- Resolve and inline the SRT per §1.A: if `srt` string is provided, use it; else if an uploaded file matches `<slug>/<slug>.srt`, use its contents; else if `srt_path` is given, resolve that file and use its contents. Inline the text inside the HTML as required by §12.1. 
- Produce a single self-contained `index.html` with inline CSS/JS, no external JS.
- Exactly obey every rule in the spec. This is a binding contract, not a suggestion. 
- Do not output TODOs, placeholders, or empty icons. 
- If any rule cannot be satisfied, output exactly `I don't know`.