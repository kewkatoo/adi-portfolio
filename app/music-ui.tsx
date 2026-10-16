"use client";

import { useEffect, useRef, useState } from "react";
import { getAnalyser } from "./sound";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Little bouncing equalizer bars. */
export function Eq({ bars = 4, className = "" }: { bars?: number; className?: string }) {
  return <span className={`eq ${className}`} aria-hidden="true">{Array.from({ length: bars }, (_, i) => <i key={i} />)}</span>;
}

/** Y2K starfield: a few sparkles twinkling around the edges of the page. Fixed values so server and client agree. */
const SPARKLES = [
  { x: 6, y: 18, size: 14, delay: 0 }, { x: 14, y: 62, size: 10, delay: -1.2 }, { x: 9, y: 86, size: 18, delay: -2.1 },
  { x: 22, y: 34, size: 8, delay: -0.6 }, { x: 80, y: 14, size: 12, delay: -1.7 }, { x: 91, y: 40, size: 18, delay: -0.3 },
  { x: 86, y: 72, size: 10, delay: -2.4 }, { x: 74, y: 90, size: 14, delay: -1 },
];
export function Sparkles() {
  return <div className="sparkles" aria-hidden="true">
    {SPARKLES.map((s, i) => <span key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: `${s.size}px`, animationDelay: `${s.delay}s` }}>{i % 3 === 2 ? "✧" : "✦"}</span>)}
  </div>;
}

/**
 * Full-width spectrum bars pinned to the bottom of the viewport. They breathe gently on
 * their own and jump to life with real frequency data whenever a track plays.
 */
export function Visualizer({ bars = 64 }: { bars?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodes = Array.from(ref.current?.children ?? []) as HTMLElement[];
    if (!nodes.length || prefersReducedMotion()) return;
    const levels = new Float32Array(nodes.length);
    const centre = (nodes.length - 1) / 2;
    let data: Uint8Array<ArrayBuffer> | null = null;
    let raf = 0;
    const tick = (t: number) => {
      const analyser = getAnalyser();
      if (analyser) {
        if (!data) data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
      }
      nodes.forEach((node, i) => {
        // Mirrored: bass sits in the middle, highs fan out to the edges.
        const spread = Math.abs(i - centre) / centre;
        const idle = 0.1 + 0.06 * Math.sin(t / 900 + i * 0.42) + 0.04 * Math.sin(t / 1600 - i * 0.18);
        const live = data ? data[Math.min(data.length - 1, 2 + Math.floor(spread ** 1.4 * 70))] / 255 : 0;
        levels[i] += (Math.max(idle, live * (1 - spread * 0.35)) - levels[i]) * 0.16;
        node.style.transform = `scaleY(${levels[i].toFixed(3)})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="visualizer" ref={ref} aria-hidden="true">{Array.from({ length: bars }, (_, i) => <span key={i} />)}</div>;
}

/* ─── Currently listening (Spotify via Discord, through Lanyard) ─── */

type SpotifyPresence = { track_id: string | null; song: string; artist: string; album: string; album_art_url: string | null; timestamps: { start: number; end: number } };
type Presence = { listening_to_spotify?: boolean; spotify?: SpotifyPresence | null };

const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

type LastPlayed = { song: string; artist: string; image: string | null; url: string | null; at: string };

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
};

/**
 * Live "currently listening to" card. Subscribes to Lanyard's WebSocket, which mirrors the
 * Spotify activity on a Discord profile, so it updates the moment the song changes.
 * Requires the Discord account to be in the Lanyard server (discord.gg/lanyard).
 * When nothing is playing it shows the last song: the one that just stopped if this page saw it,
 * otherwise the latest stream from stats.fm.
 */
export function NowListening({ discordId }: { discordId?: string }) {
  const [track, setTrack] = useState<SpotifyPresence | null>(null);
  const [last, setLast] = useState<LastPlayed | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const current = useRef<SpotifyPresence | null>(null);

  useEffect(() => {
    if (!discordId) return;
    if (!/^\d{17,20}$/.test(discordId)) {
      console.warn(`NowListening: "${discordId}" isn't a Discord user ID. Use the numeric ID (Developer Mode → right-click your profile → Copy User ID), not your username.`);
      return;
    }
    let socket: WebSocket | null = null;
    let heartbeat = 0;
    let retry = 0;
    let disposed = false;
    const apply = (presence: Presence) => {
      const next = presence?.listening_to_spotify && presence.spotify ? presence.spotify : null;
      const previous = current.current;
      // A song just stopped while we were watching: remember it as the last played.
      if (!next && previous) setLast({ song: previous.song, artist: previous.artist, image: previous.album_art_url, url: previous.track_id ? `https://open.spotify.com/track/${previous.track_id}` : null, at: new Date().toISOString() });
      current.current = next;
      setTrack(next);
    };
    const connect = () => {
      socket = new WebSocket("wss://api.lanyard.rest/socket");
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.op === 1) {
          heartbeat = window.setInterval(() => socket?.send(JSON.stringify({ op: 3 })), message.d.heartbeat_interval);
          socket?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } }));
        } else if (message.op === 0 && (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE")) {
          apply(message.d);
        }
      };
      // Reconnect quietly if the socket drops (sleep, network change, server restart).
      socket.onclose = () => { window.clearInterval(heartbeat); if (!disposed) retry = window.setTimeout(connect, 5000); };
    };
    connect();
    return () => { disposed = true; window.clearInterval(heartbeat); window.clearTimeout(retry); socket?.close(); };
  }, [discordId]);

  // Whenever nothing is playing, fetch the latest stream from stats.fm (keeping whichever is newer).
  useEffect(() => {
    if (track) return;
    let cancelled = false;
    // Outside production, ?statsfm=<user> on the page previews any public profile.
    const preview = process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search).get("statsfm") : null;
    fetch(`/api/last-played${preview ? `?user=${encodeURIComponent(preview)}` : ""}`)
      .then((response) => response.json())
      .then(({ track: latest }: { track: LastPlayed | null }) => {
        if (cancelled || !latest) return;
        setLast((seen) => (seen && new Date(seen.at) >= new Date(latest.at) ? seen : latest));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [track]);

  // Tick once a second: the progress bar while playing, the "x min ago" label otherwise.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), track ? 1000 : 30000);
    return () => window.clearInterval(timer);
  }, [track]);

  const shown = track
    ? { song: track.song, artist: track.artist, image: track.album_art_url, url: track.track_id ? `https://open.spotify.com/track/${track.track_id}` : null }
    : last;
  const total = track ? track.timestamps.end - track.timestamps.start : 0;
  const elapsed = track ? Math.min(total, Math.max(0, now - track.timestamps.start)) : 0;
  const url = shown?.url ?? undefined;

  return <div className={`listening ${track ? "live" : "idle"}`}>
    <a className="listen-art" href={url} target="_blank" rel="noreferrer" aria-label={shown ? `${shown.song} cover` : "No album"}>
      {shown?.image ? <img src={shown.image} alt="" /> : <span className="listen-disc" />}
    </a>
    <div className="listen-body">
      <span className="listen-status">{track ? <><Eq bars={3} /> listening on spotify</> : last ? `last played · ${ago(last.at)}` : "not listening right now"}</span>
      <b>{shown ? shown.song : "silence, for now"}</b>
      <span className="listen-artist">{shown ? shown.artist : "check back in a bit"}</span>
      {track && <div className="listen-progress"><i style={{ width: `${total ? (elapsed / total) * 100 : 0}%` }} /><small>{clock(elapsed)}</small><small>{clock(total)}</small></div>}
    </div>
    {url
      ? <a className="listen-play" href={url} target="_blank" rel="noreferrer" aria-label={`Play ${shown?.song} on Spotify`}>▶</a>
      : <span className="listen-play" aria-hidden="true">▶</span>}
  </div>;
}
