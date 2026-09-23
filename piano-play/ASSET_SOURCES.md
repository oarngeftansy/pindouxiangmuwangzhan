# Piano Play asset sources

## 诀别书 / Juebie Shu

Preferred source for the shippable rhythm level:

- Source page: https://www.midishow.com/en/midi/214327.html
- Listed title: 诀别书
- Upload: Happy_665865, 2025-03-20
- License on source page: CC0 / Public Domain
- Format: Standard MIDI Type 0
- Listed duration: 01:03
- Listed tempo: 120 BPM
- Instrument: Acoustic Grand Piano
- Repository target path: `piano-play/assets/juebie-shu.mid`

The binary is intentionally not copied into this repository by automation because the source site's
download endpoint is access-controlled in the current environment. When an authorized copy is placed
at the target path, `src/main.js` automatically loads it and `src/midi-chart.js` extracts a melody
line and builds the six-lane rhythm chart. Until then the UI labels the built-in chart as a preview.

Do not replace this with an unverified full-song MIDI merely because it is longer. Verify the source
license/permission and inspect the generated melody before shipping.
