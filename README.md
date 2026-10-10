# moon

Study pages for Japanese learners, built around Sailor Moon songs. Each song page plays along with the song's YouTube video and shows the lyrics line by line, with furigana over the kanji and an English translation beside each line. The line being sung is highlighted as it plays.

## What's here

- `index.html`: a menu of songs, loaded from `songs.json`
- `songs.json`: the song list. Each entry has the folder name (`slug`), the `youtube` video id, and optionally an `offset` and an `aspect` (see below)
- one folder per song, each with its own `index.html` and a timed `.srt`
- `player.js`: the playback controls (back, play and pause, loop, volume), built on the YouTube IFrame Player API
- `build.md`: the spec the song pages were generated from, which turns a YouTube video plus an SRT into an interactive lyrics page

Songs: Heart Moving, Kirari, Moonlight Densetsu, Princess Moon, Otome no Policy, Tuxedo Mirage, Moon Pride, Makenai.

## Running it

The menu loads `songs.json` with `fetch`, so it needs to be served rather than opened from disk:

```bash
python3 -m http.server
```

Then open http://localhost:8000. The videos are YouTube embeds, so you need to be online, and the pages have to be served over `http` (opening the files straight from disk makes YouTube refuse the embed).

## Videos

No video files are stored in the repo. Each page embeds a YouTube upload as its background, and the lyric highlighting follows that player's clock.

The `.srt` timings were made against a specific TV-size cut, so each upload has to match that cut. Two optional fields in `songs.json` handle the differences:

- `offset`: seconds the upload runs later than the cut the `.srt` was timed against (YouTube time = `.srt` time + `offset`). A negative value means the upload starts a little into the cut.
- `aspect`: the upload's width divided by its height (default 16/9), so a 4:3 video fills the background without black bars.

If an upload is taken down, swap in another and re-measure its offset.

## Why the full lyrics

The point is learning from the whole song. Following a lyric line by line, with the reading and the meaning beside it, is how the pages teach, and a partial excerpt would undercut that.

## Adding a song

Put a timed `.srt` in a new folder, add an entry to `songs.json` with the folder name and the YouTube id of a matching upload (plus `offset` and `aspect` if they differ), and build the page from `build.md`. `todo.md` lists the songs planned next.
