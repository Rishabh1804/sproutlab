#!/usr/bin/env python3
"""Soundtrack for the frozen first-birthday invite — 10.0 s.

A music-box rendition of "Twinkle, Twinkle, Little Star" (public-domain
melody), with a magical ascending glissando timed to the name reveal at
t=2.6s, a soft closing chime at t=7.3s, and a low sustained pad for warmth.
Pure numpy synthesis — no samples, nothing licensed.

Usage: python3 make-audio.py out.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 10.0
N = int(SR * DUR)
t_axis = np.arange(N) / SR
mix = np.zeros(N)

NOTE = {
    'C4': 261.63, 'E4': 329.63, 'G4': 392.00,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.26, 'F5': 698.46,
    'G5': 783.99, 'A5': 880.00, 'C6': 1046.50, 'D6': 1174.66,
    'E6': 1318.51, 'G6': 1567.98, 'A6': 1760.00, 'C7': 2093.00,
}


def music_box(freq, start, amp=0.5, decay=0.95, partials=None):
    """A celesta-ish struck tone: fast attack, exponential ring-out."""
    if partials is None:
        partials = [(1.0, 1.0), (2.0, 0.28), (3.01, 0.12), (5.4, 0.045)]
    i0 = int(start * SR)
    if i0 >= N:
        return
    length = min(N - i0, int(SR * decay * 5))
    tt = np.arange(length) / SR
    env = np.exp(-tt / decay) * (1 - np.exp(-tt / 0.004))
    tone = np.zeros(length)
    for mult, pamp in partials:
        # tiny detune pair for a chorused shimmer
        tone += pamp * np.sin(2 * np.pi * freq * mult * tt)
        tone += pamp * 0.35 * np.sin(2 * np.pi * freq * mult * 1.003 * tt)
    mix[i0:i0 + length] += amp * env * tone


# --- melody: first strain of Twinkle Twinkle, C major, music-box register ---
STEP = 0.62
melody = [
    ('C5', 1.0), ('C5', 1.0), ('G5', 1.0), ('G5', 1.0),
    ('A5', 1.0), ('A5', 1.0), ('G5', 2.0),
    ('F5', 1.0), ('F5', 1.0), ('E5', 1.0), ('E5', 1.0),
    ('D5', 1.0), ('D5', 1.0), ('C5', 2.0),
]
t = 0.30
for name, beats in melody:
    music_box(NOTE[name], t, amp=0.42, decay=1.05 if beats > 1 else 0.9)
    # soft octave halo on the long notes
    if beats > 1:
        music_box(NOTE[name] * 2, t, amp=0.10, decay=1.2)
    t += STEP * beats

# --- magical glissando at the gust / name reveal (t = 2.55s) ---
gliss = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7']
for i, name in enumerate(gliss):
    music_box(NOTE[name], 2.55 + i * 0.055, amp=0.16 - i * 0.012, decay=1.3)

# --- closing chime at "See you there!" (t = 7.30s) ---
music_box(NOTE['E6'], 7.32, amp=0.14, decay=1.6)
music_box(NOTE['C6'], 7.40, amp=0.12, decay=1.8)
music_box(NOTE['G6'], 7.52, amp=0.09, decay=1.9)

# --- low pad: C major, barely-there warmth ---
pad_env = np.minimum(1, t_axis / 1.6) * np.clip((DUR - 0.4 - t_axis) / 1.8, 0, 1)
trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.23 * t_axis)
for name, a in [('C4', 0.030), ('E4', 0.020), ('G4', 0.024)]:
    mix += a * pad_env * trem * np.sin(2 * np.pi * NOTE[name] * t_axis)

# --- gentle icy air: filtered noise swell under the gust (2.4–3.1s) ---
rng = np.random.default_rng(20250904)
noise = rng.standard_normal(N)
# one-pole lowpass, then bandpass-ish by subtracting a heavier lowpass
lp1 = np.zeros(N)
lp2 = np.zeros(N)
a1, a2 = 0.12, 0.02
prev1 = prev2 = 0.0
for i in range(N):
    prev1 += a1 * (noise[i] - prev1)
    prev2 += a2 * (noise[i] - prev2)
    lp1[i] = prev1
    lp2[i] = prev2
air = lp1 - lp2
gust_env = np.exp(-0.5 * ((t_axis - 2.72) / 0.22) ** 2) * 0.10
mix += air * gust_env

# --- simple sparkling reverb: three feedback delays ---
wet = np.copy(mix)
for delay_s, gain in [(0.089, 0.32), (0.131, 0.26), (0.211, 0.20)]:
    d = int(delay_s * SR)
    for i in range(d, N):
        wet[i] += wet[i - d] * gain
mix = 0.78 * mix + 0.22 * wet

# --- final fade and normalize ---
fade = np.clip((DUR - t_axis) / 0.7, 0, 1)
mix *= fade
mix = mix / np.max(np.abs(mix)) * 0.82

out = (mix * 32767).astype(np.int16)
path = sys.argv[1] if len(sys.argv) > 1 else 'audio.wav'
with wave.open(path, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print(f'wrote {path}: {DUR}s @ {SR}Hz, peak {np.max(np.abs(mix)):.2f}')
