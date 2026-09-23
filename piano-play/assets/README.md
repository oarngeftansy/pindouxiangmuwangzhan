# Piano Play MIDI assets

Place licensed/authorized MIDI files in this directory.

## 诀别书

Expected filename:

`juebie-shu.mid`

At runtime Piano Play will try to load this file automatically. If present, the browser parser:

1. parses tempo and note events,
2. selects the most melody-like piano track,
3. collapses chords to a top line,
4. quantizes very dense passages to a playable 16th-note grid,
5. maps pitch contour to A S D / J K L,
6. replaces the built-in preview chart.

For local chart inspection, open Piano Play with `?dev=1`; a **导入 MIDI** button appears in rhythm mode.
