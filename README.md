# moon

Study pages for Japanese learners, built around Sailor Moon songs. Each song page plays along with its video and shows the lyrics line by line, with furigana over the kanji and an English translation beside each line. The line being sung is highlighted as it plays.

## What's here

- `index.html`: a menu of songs, loaded from `songs.json`
- one folder per song, each with its own `index.html`, a timed `.srt`, and the video
- `player.js`: the playback controls (back, play and pause, loop, volume)
- `build.md`: the spec the song pages were generated from, which turns a video plus an SRT into an interactive lyrics page

Songs: Heart Moving, Kirari, Moonlight Densetsu, Princess Moon, Otome no Policy, Tuxedo Mirage, Moon Pride, Makenai.

## Running it

The menu loads `songs.json` with `fetch`, so it needs to be served rather than opened from disk:

```bash
python3 -m http.server
```

Then open http://localhost:8000.

## Why the full lyrics

The point is learning from the whole song. Following a lyric line by line, with the reading and the meaning beside it, is how the pages teach, and a partial excerpt would undercut that.

## Adding a song

Put the video and a timed `.srt` in a new folder, add the folder name to `songs.json`, and build the page from `build.md`. `todo.md` lists the songs planned next.
