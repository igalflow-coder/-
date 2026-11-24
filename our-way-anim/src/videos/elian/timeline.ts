// Timeline of "The Second Mirror" (Our Way, Elian short). Times in seconds.
// Narration: take 3 (ElevenLabs Starter, commercial licence; voice Jason, script v2), placed at VOICE_AT; line times from the pauses in the recording.
export const FPS = 30;
export const DUR = 63;
export const TOTAL = DUR * FPS;

export type Line = { a: number; b: number; text: string };
export const LINES: Line[] = [
  { a: 0.33, b: 5.21, text: "My name is Elian. I'm an archivist, and I write to you from the year 2140." },
  { a: 5.77, b: 7.35, text: "This is letter number one." },
  { a: 8.41, b: 13.32, text: "You are living, right now, inside the most quoted chapter of our history books." },
  { a: 13.85, b: 15.58, text: "And most of you haven't even noticed." },
  { a: 16.6, b: 20.7, text: "On November 30th, 2022, a chat window opened to the public." },
  { a: 21.33, b: 24.91, text: "No parade. No speech. Just a box where you could type." },
  { a: 25.64, b: 29.6, text: "Within about two months, an estimated hundred million people had tried it." },
  { a: 30.1, b: 34.11, text: "They asked it for poems, for code, for the email they were too afraid to write." },
  { a: 34.69, b: 38.05, text: "And somewhere, a lonely person talked to it all night long." },
  { a: 38.83, b: 39.98, text: "Maybe one of them was you." },
  { a: 41.33, b: 43.24, text: "We call that day the Second Mirror." },
  { a: 43.75, b: 45.59, text: "The first mirror showed you your face." },
  { a: 46, b: 47.85, text: "This one showed you your words." },
  { a: 48.54, b: 55.19, text: "In my next letter: the keyboard we keep in a glass case in our museum... and why our children can't stop staring at it." },
  { a: 55.88, b: 58.5, text: "See you in the future. You're already on your way." },
];
/** lines shown as gold titles instead of captions */
export const TITLE_LINES = [10, 14];

/** Shot edges (s). */
export const EDGES = [0, 5.55, 13.6, 16.2, 20.95, 25.1, 29.9, 34.5, 40.7, 47.9, 55.2, 63];
/** where the voice starts in the film (s) */
export const VOICE_AT = 0.3;
/** Beats inside shots (s). */
export const BEAT = {
  flapOpen: [5.85, 7.45] as [number, number],
  circle: [17.0, 18.5] as [number, number],
  windows: [25.5, 29.4] as [number, number],
  face: [43.8, 45.2] as [number, number],
  words: [46.0, 47.9] as [number, number],
  flapClose: [55.25, 55.75] as [number, number],
  sealLand: 55.85,
};

/** Caption chunks (1-3 words) spread over each line by word length. Re-fit from word timings later. */
export const chunks = (lines: Line[]) => {
  const out: { a: number; b: number; text: string }[] = [];
  for (const l of lines) {
    const words = l.text.split(" ");
    const groups: string[] = [];
    let cur: string[] = [];
    for (const w of words) {
      cur.push(w);
      const len = cur.join(" ").length;
      if (cur.length >= 3 || len >= 13 || /[.,!?]$/.test(w)) { groups.push(cur.join(" ")); cur = []; }
    }
    if (cur.length) groups.push(cur.join(" "));
    const total = groups.reduce((s, g) => s + g.length + 3, 0);
    let t = l.a;
    for (const g of groups) {
      const d = ((g.length + 3) / total) * (l.b - l.a);
      out.push({ a: t, b: t + d, text: g.toUpperCase() });
      t += d;
    }
  }
  return out;
};
