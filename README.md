# ZipBeat
![GitHub last commit](https://img.shields.io/github/last-commit/ztry8/zipbeat)
![License](https://img.shields.io/github/license/ztry8/zipbeat)

## Browser-based grid sequencer and audio generator built on the Web Audio API

## About

ZipBeat is a static, dependency-free beat sequencer that runs entirely in the browser.    
No server, no install, no account required.

The sequencer uses a 10-row by 1000-column grid where each cell represents a 50ms oscillator tone.     
Sounds placed in the same column play simultaneously, allowing chords and layered textures.      
The playhead moves left to right and can be dragged to any position with the mouse.

Projects are saved and loaded as JSON files.      
Audio can be exported to OGG or WebM using the MediaRecorder API.

## Oscillator types

| Type | Character |
|---|---|
| Sine | Clean, pure tone |
| Square | Harsh, pixel-like sound |
| Sawtooth | Sharp, synthesizer-like |
| Triangle | Softer than square |

Each block on the grid stores its own type, note, frequency (Hz), and volume independently.

## Controls

| Action | How |
|---|---|
| Place or remove a block | Left click on the grid |
| Play or pause | Space or the Play button |
| Stop and return | Stop button |
| Jump to start | Start button |
| Move playhead | Click and drag the playhead line |
| Save project | Save button, downloads `.json` |
| Load project | Load button, opens file picker |
| Export audio | Export Audio button, opens settings modal |
| Clear grid | Clear button |
| Draw blocks | Left click and drag |
| Erase blocks | Right click or right click and drag |
| Toggle loop | Loop button |

## Export options

The export modal allows configuring the output before rendering:

| Option | Values |
|---|---|
| Format | OGG/Opus, WebM/Opus, WebM |
| Bitrate | 64, 96, 128, 192, 256, 320 kbps |
| Block duration | 50, 75, 100, 150 ms |

Export is performed entirely in the browser using the Web Audio API and MediaRecorder.     
No data is sent to any server.

## Project file format

Projects are saved as `.json` files with the following structure:

```json
{
  "version": 1,
  "cells": {
    "0,4": { "type": "sine", "freq": 440, "note": "A4", "vol": 0.18 },
    "2,4": { "type": "square", "freq": 261.63, "note": "C4", "vol": 0.18 }
  }
}
```

Each key in `cells` is `"row,column"` (zero-indexed).

## Browser support

Requires a modern browser with Web Audio API and MediaRecorder support.     
Tested on Chrome 120+, Firefox 121+, and Safari 17+.

## AI music prompt

The following prompt can be used with any AI chatbot to generate      
musical ideas, patterns, or compositions suited for ZipBeat.

---

**Prompt:**

```
You are a music composer for ZipBeat, a browser-based chiptune sequencer.

Grid: 10 rows, 1000 columns. Each column plays simultaneously — that's one moment in time.
Playhead moves left to right. Each cell is a 50ms oscillator tone.

Output format — JSON object:
{
  "version": 1,
  "cells": {
    "row,col": { "type": "...", "freq": 0.0, "note": "...", "vol": 0.18 }
  }
}

Rules:
- row: 0–9 (use different rows for different instruments/voices)
- col: 0+ (time position)
- type: sine | square | sawtooth | triangle
- freq: Hz (C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88, C5=523.25)
- note: human-readable label matching freq (e.g. "A4")
- vol: 0.0–1.0 (use lower vol for background layers, e.g. 0.08–0.12)

Suggestions:
- Use square/triangle for melody, sine for bass, sawtooth for pads
- Layer voices across rows for richer texture
- Repeat patterns every 16–32 cols for a loop-friendly result
- Keep col range tight (0–63 max) for a short loop

Return only the JSON. No explanation, no markdown fences.
```

---

## Building and hosting

ZipBeat is pure static HTML. No build step is required.       
To host it, place the files on any static file server or open `index.html` directly in a browser.

```
git clone https://github.com/Ztry8/zipbeat.git
cd zipbeat
```

Then open `index.html` in your browser.
