# ZipBeat
![GitHub last commit](https://img.shields.io/github/last-commit/ztry8/zipbeat)
![License](https://img.shields.io/github/license/ztry8/zipbeat)

Browser-based grid sequencer and audio generator built on the Web Audio API

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

Each block on the grid stores its own type, frequency (Hz), and detune (cents) independently.

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
    "0,4": { "type": "sine", "freq": 440, "detune": 0 },
    "2,4": { "type": "square", "freq": 220, "detune": -10 }
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
You are a music composer assistant for ZipBeat, a browser-based grid sequencer.
ZipBeat uses a 10-row by 1000-column grid. Each cell plays a 50ms oscillator tone.
Sounds placed in the same column play simultaneously (polyphony).
The playhead moves left to right, column by column.

Available oscillator types: sine, square, sawtooth, triangle.
Each block has a frequency in Hz and a detune value in cents.

Generate a musical pattern as a JSON object compatible with the ZipBeat project format.
The root object must have a "version" key equal to 1 and a "cells" key.
Each entry in "cells" uses the key format "row,column" where row is 0 to 9
and column is any non-negative integer.
Each value must have "type" (one of sine, square, sawtooth, triangle),
"freq" (number in Hz, e.g. 261.63 for middle C), and "detune" (integer in cents, typically 0).

Use standard note frequencies. For reference:
C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23,
G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25.

Generate a short melody or rhythmic pattern of your choice.
Return only the JSON object, no explanation, no markdown code fences.
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