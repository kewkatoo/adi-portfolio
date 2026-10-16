// One shared Web Audio graph: song players feed a single analyser, which the background
// visualizer reads from. Created lazily on the first play, since browsers block audio until then.

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
const wired = new WeakSet<HTMLMediaElement>();

function engine() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyser.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, analyser: analyser! };
}

export const getAnalyser = () => analyser;

/** Route an <audio> element through the graph so the visualizer reacts to it. */
export function routeMedia(element: HTMLMediaElement) {
  const graph = engine();
  if (!graph || wired.has(element)) return;
  try {
    graph.ctx.createMediaElementSource(element).connect(graph.analyser);
    wired.add(element);
  } catch { /* already wired or unsupported — playback still works without the visualizer */ }
}
