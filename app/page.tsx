"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { Eq, NowListening, Sparkles, Visualizer } from "./music-ui";
import { Loader, PageWipe, WIPE_MS } from "./loader";
import { MusicStats } from "./music-stats";
import { routeMedia } from "./sound";

type Section = "home" | "work" | "about" | "resume" | "contact";
type Category = "dev" | "music" | "ui/ux";

const SECTIONS: Section[] = ["home", "work", "about", "resume", "contact"];
const CATEGORIES: Category[] = ["dev", "music", "ui/ux"];
const NAME = "Aditya Achary";
const EMAIL = "aditya.achary0909@gmail.com";
const AVATAR = "/avatar.webp";

const projects: { no: string; year: string; title: string; type: string; desc: string; tags: string[]; tone: string; visual: string; image?: string; url: string; category: Category }[] = [
  { no: "01", year: "2026", title: "AI Adaptive Learning Platform", type: "ai systems / agents", desc: "A stateful learning engine that turns performance signals into an endlessly adaptive curriculum.", tags: ["React", "FastAPI", "LangGraph", "Gemini"], tone: "violet", visual: "◌", image: "/projects/learning-platform.webp", url: "https://github.com/kewkatoo/Tiered-Learning-CBSEXII", category: "dev" },
  { no: "02", year: "2025—26", title: "Intelligent Prosthetic Hand", type: "computer vision / edge ai", desc: "A compact CvT-SLA-GGCNN model and real-time vision pipeline for more capable grasp control.", tags: ["PyTorch", "OpenCV", "GGCNN", "Webcam"], tone: "lilac", visual: "⌁", image: "/projects/prosthetic-hand.webp", url: "https://github.com/kewkatoo/modified-ggcnn-grasping", category: "dev" },
  { no: "03", year: "2025", title: "Smart Helmet", type: "multimodal safety / adas", desc: "30 FPS edge intelligence combining object detection, depth, GPS and sensor telemetry.", tags: ["YOLOv8", "Depth Anything", "CUDA", "ESP32"], tone: "plum", visual: "⊙", image: "/projects/smart-helmet.webp", url: "https://github.com/kewkatoo/smart-helmet", category: "dev" },
  { no: "04", year: "2026", title: "A Memory Lane", type: "keepsake site / storytelling", desc: "A keepsake website celebrating 48 years together — a soft, tap-to-begin walk through memories with ambient sound and a light/dark mode.", tags: ["Web Design", "Storytelling", "Motion"], tone: "lilac", visual: "✿", image: "/projects/memory-lane.webp", url: "https://mombday-six.vercel.app/", category: "ui/ux" },
  { no: "05", year: "2026", title: "Anvita Dey — Portfolio", type: "portfolio site / editorial", desc: "A calm, editorial portfolio for a robotics & AI engineer — serif type, an organic photo frame and a light/dark mode.", tags: ["Portfolio", "Web Design", "UI/UX"], tone: "violet", visual: "✧", image: "/projects/anvita-portfolio.webp", url: "https://anvita-portfolio.vercel.app/", category: "ui/ux" },
  { no: "06", year: "2026", title: "Raji's Creative Studio", type: "shop site / handmade", desc: "A soft, slow-made storefront for handcrafted clay, thread and porcelain charms — serif headlines, blush tones and a bestsellers shelf.", tags: ["E-commerce", "Web Design", "UI/UX"], tone: "lilac", visual: "❀", image: "/projects/rajis-creative-studio.webp", url: "https://rcs-portfolio.vercel.app/", category: "ui/ux" },
  { no: "08", year: "2026", title: "SETU", type: "wearable / accessibility", desc: "A wearable that listens for sirens, horns and calls and turns them into instant, understandable alerts — a bridge between hearing and knowing. ESP32 + Edge Impulse, with a live dashboard.", tags: ["ESP32", "Edge Impulse", "Dashboard", "UI/UX"], tone: "violet", visual: "≋", image: "/projects/setu.webp", url: "https://setu-kewka2.vercel.app/", category: "ui/ux" },
  { no: "07", year: "2026", title: "This Portfolio", type: "personal site / y2k", desc: "The site you're on — a purple, Y2K-tinged portfolio with a live Spotify card, listening stats, a playable tracklist and smooth page transitions.", tags: ["Next.js", "React", "Web Audio", "UI/UX"], tone: "violet", visual: "✦", image: "/projects/this-portfolio.webp", url: "", category: "ui/ux" },
];

const songs: { no: string; title: string; genre: string; year: string; cover?: string; src: string }[] = [
  { no: "01", title: "when she turned my garden golden", genre: "ghibli · piano recital", year: "2025", cover: "/covers/when-she-turned-my-garden-golden.webp", src: "/audio/when-she-turned-my-garden-golden.wav" },
  { no: "02", title: "kiseki no hikari", genre: "j-pop", year: "2025", cover: "/covers/kiseki-no-hikari.webp", src: "/audio/kiseki-no-hikari.wav" },
  { no: "03", title: "stronger than you know (remix)", genre: "progressive house", year: "2024", cover: "/covers/stronger-than-you-know-remix.webp", src: "/audio/stronger-than-you-know-remix.wav" },
  { no: "04", title: "all my love – coldplay (remix)", genre: "festival edm", year: "2025", cover: "/covers/all-my-love-remix.webp", src: "/audio/all-my-love-remix.wav" },
];

const workCopy: Record<Category, { title: string; sub: string }> = {
  dev: { title: "writing & dev projects", sub: "things i have worked real hard on" },
  music: { title: "music & sound", sub: "transmissions from between the commits" },
  "ui/ux": { title: "ui/ux & interfaces", sub: "pixels, flows and the occasional obsession" },
};

// The home carousel: what's newest / in progress. Add or reorder freely.
const highlights = [
  ...projects.filter((p) => p.category === "dev").map((p) => ({ title: p.title, type: p.type, tone: p.tone, visual: p.visual, image: p.image?.replace(".webp", "-photo.webp"), href: p.url, external: true })),
  { title: songs[0].title, type: `music / ${songs[0].genre}`, tone: "music", visual: "♫", image: songs[0].cover, href: "#work", external: false },
];

// About-page timeline, styled like a "my experience" list: logo, name, role, a "my work" toggle, dates on the right.
type Entry = { logo: string; logoBg: "white" | "purple"; org: string; role: string; note?: string; when: string; where?: string; details: string[] };
const experience: Entry[] = [
  {
    logo: "/logos/corizo.png", logoBg: "white", org: "corizo", role: "business development associate", when: "jun 2026 – jul 2026", where: "bengaluru, karnataka",
    details: [
      "managed multi-stage lead pipelines, tracking prospects from first touch through to conversion",
      "analyzed customer conversion patterns to surface funnel drop-off points and high-intent segments",
      "monitored sales KPIs — conversion rate, pipeline velocity and engagement — to measure performance",
      "turned data-driven insights into optimized lead-engagement strategies that improved conversion",
    ],
  },
  {
    logo: "/logos/ashok-leyland.png", logoBg: "white", org: "ashok leyland", role: "data analyst", when: "apr 2025 – may 2025", where: "chennai, tamil nadu",
    details: [
      "processed, cleaned and analyzed large operational datasets using python and sql",
      "built interactive power bi dashboards for kpi tracking and visualization",
      "translated analytical findings into actionable insights that supported business decisions",
    ],
  },
];
const education: Entry[] = [
  { logo: "/logos/amrita.png", logoBg: "white", org: "amrita vishwa vidyapeetham", role: "b.tech · electronics & computer engineering", note: "cgpa: 8.14", when: "oct 2022 – aug 2026", where: "amritapuri, kerala", details: [] },
];
// Certificates: rendered from the PDFs in public/certs. Each opens in the viewer with its official verification link.
const certifications = [
  { slug: "google-ai-professional", title: "Google AI Professional Certificate", issuer: "Google · Coursera", date: "aug 2026", url: "https://coursera.org/verify/professional-cert/3UE3R06GHSOU" },
  { slug: "ai-for-app-deployment", title: "AI for App Deployment", issuer: "Google · Coursera", date: "aug 2026", url: "https://coursera.org/verify/89GBTDZTC5D4" },
  { slug: "generative-ai-intro", title: "Generative AI: Introduction and Applications", issuer: "IBM · Coursera", date: "aug 2026", url: "https://coursera.org/verify/D8DXFKZNR6TP" },
  { slug: "prompt-engineering-basics", title: "Generative AI: Prompt Engineering Basics", issuer: "IBM · Coursera", date: "sep 2026", url: "https://coursera.org/verify/JCQ4SIA2YUH0" },
  { slug: "ai-agents-rag-langchain", title: "Fundamentals of AI Agents Using RAG and LangChain", issuer: "IBM · Coursera", date: "sep 2026", url: "https://coursera.org/verify/7E8ORR40A0VX" },
  { slug: "python-data-science-ai", title: "Python for Data Science, AI & Development", issuer: "IBM · Coursera", date: "sep 2026", url: "https://coursera.org/verify/CINIQ3M9PRPS" },
];
const skills = ["Python", "PyTorch", "TensorFlow", "LangChain", "LangGraph", "RAG", "Computer Vision", "OpenCV", "YOLO", "FastAPI", "SQL", "Pandas", "MongoDB", "Azure", "Docker", "Git", "React", "Node.js", "C++", "R", "Figma"];
const studio = ["Music Production", "EDM", "Piano", "DJing — in progress"];


const ICONS = {
  linkedin: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" /></svg>,
  email: <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="3" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></g></svg>,
  github: <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>,
  instagram: <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /></g><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" /></svg>,
  youtube: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" /></svg>,
  facebook: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.09 1.85-5.98 5.86-5.98.4 0 .96.04 1.47.1.38.04.76.11 1.14.2v3.32a8.6 8.6 0 0 0-1.39-.05c-.7 0-1.26.1-1.67.31-.29.14-.52.36-.68.62-.26.42-.38 1-.38 1.75v1.3h3.92l-.67 3.67h-3.25v8.24C19.4 23.24 24 18.18 24 12.04c0-6.63-5.37-12-12-12S0 5.41 0 12.04c0 5.22 3.33 9.66 8.1 11.65Z" /></svg>,
};

const contactLinks = [
  { label: "LinkedIn", icon: ICONS.linkedin, url: "https://www.linkedin.com/in/aditya-achary/" },
  { label: "Email", icon: ICONS.email, url: `mailto:${EMAIL}?subject=Portfolio%20Enquiry` },
  { label: "GitHub", icon: ICONS.github, url: "https://github.com/kewkatoo" },
];

const socials = [
  { label: "Instagram @kewkatoo", icon: ICONS.instagram, url: "https://www.instagram.com/kewkatoo/" },
  { label: "Instagram @dull.scythe_", icon: ICONS.instagram, url: "https://www.instagram.com/dull.scythe_" },
  { label: "YouTube @kewkatoo", icon: ICONS.youtube, url: "https://www.youtube.com/@kewkatoo" },
  { label: "Facebook aditya.achary", icon: ICONS.facebook, url: "https://www.facebook.com/aditya.achary/" },
];

const STAR = "M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z";

// Placeholder mark for the nav logo slot — swap this for your own SVG.
function StarMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>;
}

/** The illustrated portrait, cropped to its purple circle. */
// Contact-page easter egg: a sound that plays only when the portrait is clicked.
let faceSound: HTMLAudioElement | null = null;
const playFaceSound = () => {
  faceSound ??= new Audio("/sfx/face-click.mp3");
  faceSound.muted = false;
  faceSound.volume = 1;
  faceSound.currentTime = 0;
  void faceSound.play().catch(() => {});
};

function Pfp({ className = "", blush = false }: { className?: string; blush?: boolean }) {
  return <div className={`pfp ${className} ${blush ? "blushable" : ""}`} onClick={blush ? playFaceSound : undefined}>
    <img src={AVATAR} alt={NAME} />
    {/* Easter egg: hovering/tapping the face blushes the cheeks. Positions are the cheeks on the cropped portrait. */}
    {blush && <><span className="blush" style={{ left: "45.5%", top: "64.7%" }} aria-hidden="true" /><span className="blush" style={{ left: "71.2%", top: "63.7%" }} aria-hidden="true" /></>}
  </div>;
}

/** Name/headline arched over the portrait, like a retro sticker. */
function Badge({ text, id, blush = false, className = "" }: { text: string; id: string; blush?: boolean; className?: string }) {
  return <div className={`badge ${className}`}>
    <svg className="badge-arch" viewBox="0 0 400 400" aria-hidden="true">
      <defs><path id={id} d="M 58 215 A 142 142 0 0 1 342 215" /></defs>
      <text><textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{text}</textPath></text>
    </svg>
    <Pfp className="badge-pfp" blush={blush} />
    <span className="sparkle s1">✦</span><span className="sparkle s2">✦</span><span className="sparkle s3">✧</span>
  </div>;
}

/** Section heading in the inspo style: small, lowercase, centred, with a Y2K sparkle. */
function Heading({ title, sub }: { title: string; sub?: string }) {
  return <div className="heading"><h2>{title}<span className="spark" aria-hidden="true">✦</span></h2>{sub && <p>{sub}</p>}</div>;
}

/** A timeline row: logo, name, role, an expandable "my work" note, and dates / place on the right. */
function TimelineRow({ entry, label = "my work" }: { entry: Entry; label?: string }) {
  const [open, setOpen] = useState(false);
  return <div className={`tl-row ${open ? "open" : ""}`}>
    <span className={`tl-logo ${entry.logoBg}`}><img src={entry.logo} alt={`${entry.org} logo`} /></span>
    <div className="tl-body">
      <b>{entry.org}</b>
      <span className="tl-role">{entry.role}</span>
      {entry.note && <span className="tl-note">{entry.note}</span>}
      {entry.details.length > 0 && <>
        <button type="button" className="tl-toggle" aria-expanded={open} onClick={() => setOpen(!open)}><i aria-hidden="true">▸</i>{label}</button>
        <div className="tl-details"><ul>{entry.details.map((line) => <li key={line}>{line}</li>)}</ul></div>
      </>}
    </div>
    <div className="tl-when"><span>{entry.when}</span>{entry.where && <small>{entry.where}</small>}</div>
  </div>;
}

const SPEAKER = "M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z";
/** Play/pause, a seek bar you can drag anywhere, timestamps, mute and a volume slider. */
function SongControls({ playing, current, duration, volume, muted, onToggle, onSeek, onVolume, onMute }: {
  playing: boolean; current: number; duration: number; volume: number; muted: boolean;
  onToggle: () => void; onSeek: (seconds: number) => void; onVolume: (level: number) => void; onMute: () => void;
}) {
  const ready = Number.isFinite(duration) && duration > 0;
  const level = muted ? 0 : volume;
  return <div className="player">
    <button type="button" className="player-btn" aria-label={playing ? "Pause" : "Play"} onClick={onToggle}>{playing ? "Ⅱ" : "▶"}</button>
    <span className="player-time">{formatTime(current)}</span>
    <input type="range" className="slider seek" aria-label="Seek" min={0} max={ready ? duration : 1} step={0.1} value={ready ? Math.min(current, duration) : 0} disabled={!ready}
      onChange={(e) => onSeek(Number(e.target.value))} style={{ "--fill": `${ready ? (current / duration) * 100 : 0}%` } as React.CSSProperties} />
    <span className="player-time">{formatTime(duration)}</span>
    <button type="button" className="player-btn ghost" aria-label={level === 0 ? "Unmute" : "Mute"} onClick={onMute}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={SPEAKER} fill="currentColor" />
        {level === 0
          ? <path d="m15 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          : <path d={level > 0.5 ? "M14.5 9a4 4 0 0 1 0 6M17 6.5a7.5 7.5 0 0 1 0 11" : "M14.5 9a4 4 0 0 1 0 6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />}
      </svg>
    </button>
    <input type="range" className="slider volume" aria-label="Volume" min={0} max={1} step={0.01} value={level}
      onChange={(e) => onVolume(Number(e.target.value))} style={{ "--fill": `${level * 100}%` } as React.CSSProperties} />
  </div>;
}

const formatTime = (s: number) => Number.isFinite(s) ? `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "--:--";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Home() {
  // `section`/`category` are what was asked for; `view` is what's on screen. The gap between
  // them is the crossfade: the old view fades out, the page resets, then the new one rises in.
  const [section, setSection] = useState<Section>("home");
  const [category, setCategory] = useState<Category>("dev");
  const [view, setView] = useState<{ section: Section; category: Category }>({ section: "home", category: "dev" });
  const [wipe, setWipe] = useState<"idle" | "cover" | "reveal">("idle");
  // Top bar wipes downward, the bottom dock wipes upward. Set by whichever bar was clicked.
  const [wipeDir, setWipeDir] = useState<"down" | "up">("up");
  const nextWipeDir = useRef<"down" | "up" | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [lastPlayed, setLastPlayed] = useState(0);
  // Per-song position/length, plus one shared volume for every track.
  const [times, setTimes] = useState<Record<number, { current: number; duration: number }>>({});
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  // Intro: "playing" shows the hello loader, "revealing" while it lifts away, then "done".
  const [intro, setIntro] = useState<"playing" | "revealing" | "done">("playing");
  const revealIntro = useCallback(() => setIntro("revealing"), []);
  const finishIntro = useCallback(() => setIntro("done"), []);
  // Full-screen image viewer for the resume and certificates; downloading is an explicit button inside it.
  const [viewer, setViewer] = useState<{ src: string; title: string; pdf: string; fileName: string; verify?: string } | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({});
  const lenisRef = useRef<Lenis | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => { const hash = window.location.hash.slice(1) as Section; return SECTIONS.includes(hash) ? hash : "home"; };
    const initial = read();
    setSection(initial);
    setView((current) => ({ ...current, section: initial }));
    const sync = () => setSection(read());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085 });
    lenisRef.current = lenis;
    return () => { lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    if (view.section === section && (section !== "work" || view.category === category)) return;
    // Page switch: the paper bars sweep up over the page, the new page is swapped in underneath,
    // then the bars carry on upward to reveal it.
    const reduced = reducedMotion();
    // Other links (e.g. "see all work") follow the bar that owns the destination.
    setWipeDir(nextWipeDir.current ?? (section === "work" ? "up" : "down"));
    nextWipeDir.current = null;
    if (!reduced) setWipe("cover");
    const timer = window.setTimeout(() => {
      setView({ section, category });
      if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
      if (!reduced) setWipe("reveal");
    }, reduced ? 0 : WIPE_MS);
    return () => window.clearTimeout(timer);
  }, [section, category, view]);

  useEffect(() => {
    if (wipe !== "reveal") return;
    const timer = window.setTimeout(() => setWipe("idle"), WIPE_MS);
    return () => window.clearTimeout(timer);
  }, [wipe]);


  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => { if (audio) { audio.volume = volume; audio.muted = muted; } });
  }, [volume, muted]);

  // Songs whose length loaded before hydration never fire loadedmetadata for us, so read it once on mount.
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([index, audio]) => { if (audio && audio.readyState >= 1) syncTime(Number(index), audio); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setViewer(null); };
    window.addEventListener("keydown", onKey);
    lenisRef.current?.stop();
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); lenisRef.current?.start(); document.body.style.overflow = ""; };
  }, [viewer]);

  // No scrolling underneath the intro.
  useEffect(() => {
    if (intro === "done") return;
    lenisRef.current?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => { lenisRef.current?.start(); document.documentElement.style.overflow = ""; };
  }, [intro]);

  const pickCategory = (next: Category) => { nextWipeDir.current = "up"; setCategory(next); window.location.hash = "work"; };
  const slide = (direction: 1 | -1) => {
    const track = carouselRef.current;
    if (track) track.scrollBy({ left: direction * (track.clientWidth / 2 + 8), behavior: "smooth" });
  };
  const toggleSong = async (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;
    if (playing === index) { audio.pause(); setPlaying(null); return; }
    Object.values(audioRefs.current).forEach((item) => item?.pause());
    routeMedia(audio);
    try { await audio.play(); setPlaying(index); setLastPlayed(index); } catch { setPlaying(null); }
  };
  const syncTime = (index: number, audio: HTMLAudioElement) => setTimes((all) => ({ ...all, [index]: { current: audio.currentTime, duration: audio.duration } }));
  const seek = (index: number, seconds: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;
    audio.currentTime = seconds;
    syncTime(index, audio);
  };
  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactStatus("sending...");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      setContactStatus(response.ok ? "message sent ✓ — talk soon" : "could not send — try email ↗");
      if (response.ok) { form.reset(); setMessageLength(0); }
    } catch { setContactStatus("could not send — try email ↗"); }
  };

  const navLink = (target: Section) => <a href={`#${target}`} className={`navlink ${section === target ? "active" : ""}`} aria-current={section === target ? "page" : undefined}>{target}<span className="nav-eq"><Eq bars={3} /></span></a>;
  const visibleProjects = projects.filter((project) => project.category === view.category);
  const entryCount = view.category === "music" ? songs.length : visibleProjects.length;
  const meterLevel = Math.min(24, Math.ceil(messageLength / 10));

  return <>
    <div className="noise" />
    <Sparkles />
    <Visualizer />

    <header className="topnav">
      <nav className="topnav-inner" aria-label="Primary" onClickCapture={() => { nextWipeDir.current = "down"; }}>
        {navLink("home")}
        {navLink("about")}
        <a href="#home" className="nav-logo" aria-label={`${NAME} — home`}><StarMark /></a>
        {navLink("resume")}
        {navLink("contact")}
      </nav>
    </header>

    <main className={`stage ${intro === "playing" ? "intro-hold" : ""}`}>
      {view.section === "home" && <section className="page" key="home">
        <p className="kicker">track 01 · home</p>
        <Badge text={NAME} id="name-arc" />
        <h1 className="sr-only">{NAME} — AI Engineer, Data Analyst, Music Producer</h1>
        <p className="intro">i&apos;m an ai engineer, data analyst and music producer. i build intelligent end to end systems from edge devices to agentic ai and make edm after dark. electronics &amp; computer engineering graduate and working my way towards musician on the side :3</p>

        <div className="block">
          <Heading title="highlights!" sub="recent projects & things i'm working on" />
          <div className="carousel">
            <button type="button" className="carousel-arrow" aria-label="Previous" onClick={() => slide(-1)}>‹</button>
            <div className="carousel-track" ref={carouselRef}>
              {highlights.map((item) => <a key={item.title} className="highlight" href={item.href} {...(item.external ? { target: "_blank", rel: "noreferrer" } : { onClick: () => setCategory("music") })}>
                <span className={`art tone-${item.tone}`}>{item.image ? <img src={item.image} alt="" loading="lazy" /> : <><span className="art-grid" /><span className="art-symbol">{item.visual}</span></>}</span>
                <span className="highlight-text"><b>{item.title}</b><small>{item.type}</small></span>
              </a>)}
            </div>
            <button type="button" className="carousel-arrow" aria-label="Next" onClick={() => slide(1)}>›</button>
          </div>
          <div className="center"><a className="text-link" href="#work">see all work ↗</a></div>
        </div>

        <div className="block">
          <Heading title="currently listening to" />
          <NowListening discordId={process.env.NEXT_PUBLIC_DISCORD_ID} />
        </div>
      </section>}

      {view.section === "work" && <section className="page" key={`work-${view.category}`}>
        <Heading title={workCopy[view.category].title} sub={workCopy[view.category].sub} />
        {view.category === "music" && <div className="listen-top"><NowListening discordId={process.env.NEXT_PUBLIC_DISCORD_ID} /></div>}
        {view.category === "music" && <div className="block"><Heading title="my tracks" /></div>}
        <div className="list">
          {view.category === "music" && songs.map((song, i) => <div className={`work-row song ${playing === i ? "playing" : ""}`} key={song.no} style={{ "--n": i } as React.CSSProperties}>
            <button type="button" className="record" aria-label={`${playing === i ? "Pause" : "Play"} ${song.title}`} onClick={() => toggleSong(i)}>
              <span className="record-disc"><span className={`record-label ${song.cover ? "has-cover" : ""}`} style={song.cover ? { backgroundImage: `url("${song.cover}")` } : undefined} /></span><span className="record-icon">{playing === i ? "Ⅱ" : "▶"}</span>
            </button>
            <div className="row-body">
              <b>{song.title}</b><span className="genre">{song.genre}</span>
              <SongControls
                playing={playing === i}
                current={times[i]?.current ?? 0}
                duration={times[i]?.duration ?? NaN}
                volume={volume}
                muted={muted}
                onToggle={() => toggleSong(i)}
                onSeek={(seconds) => seek(i, seconds)}
                onVolume={(level) => { setVolume(level); setMuted(level === 0); }}
                onMute={() => setMuted(!muted)}
              />
            </div>
            <span className="row-when">{song.year}</span>
          </div>)}

          {view.category !== "music" && visibleProjects.map((project, i) => { const RowTag = project.url ? "a" : "div"; return <RowTag className={`work-row ${project.url ? "" : "soon"}`} key={project.no} {...(project.url ? { href: project.url, target: "_blank", rel: "noreferrer" } : {})} style={{ "--n": i } as React.CSSProperties}>
            <span className={`art small tone-${project.tone}`} aria-hidden="true">{project.image ? <img src={project.image} alt="" loading="lazy" /> : <><span className="art-grid" /><span className="art-symbol">{project.visual}</span></>}</span>
            <div className="row-body">
              <b>{project.title} {project.url ? <em>↗</em> : <small className="soon-tag">link coming soon</small>}</b><span>{project.desc}</span>
              <div className="chips">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <span className="row-when">{project.year}</span>
          </RowTag>; })}

          {entryCount === 0 && <div className="empty">
            <p>case studies in the works — check back soon, or <a className="text-link" href="#contact">ask me about them ↗</a></p>
          </div>}
        </div>
        {view.category === "music" && <MusicStats />}
      </section>}

      {view.section === "about" && <section className="page" key="about">
        <Pfp className="pfp-small" />
        <p className="kicker">track 02 · about</p>
        <div className="block first">
          <Heading title="about me" />
          <div className="prose">
            <p>i engineer the space between data and possibility. from edge devices to agentic systems, i build tools that feel less like software and more like a new sense.</p>
            <p>off the clock i produce edm, play piano, and i&apos;m working my way toward the decks as a dj. turns out models and mixes both come down to signal, timing and feel.</p>
          </div>
        </div>
        <div className="block"><Heading title="skills" /><div className="chips center">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
        <div className="block"><Heading title="my experience" />{experience.map((entry) => <TimelineRow key={entry.org} entry={entry} />)}</div>
        <div className="block"><Heading title="my education" />{education.map((entry) => <TimelineRow key={entry.org} entry={entry} label="details" />)}</div>
        <div className="block"><Heading title="music" /><div className="chips center studio">{studio.map((item) => <span key={item}>{item}</span>)}</div></div>
      </section>}

      {view.section === "resume" && <section className="page" key="resume">
        <p className="kicker">track 03 · resume</p>
        <Heading title="resume" sub="the setlist, on paper" />
        <button type="button" className="resume-sheet" aria-label="View resume" onClick={() => setViewer({ src: "/resume-preview.webp", title: "resume", pdf: "/resume.pdf", fileName: "Aditya_Achary_Resume.pdf" })}>
          <img src="/resume-preview.webp" alt="Aditya Achary's resume" />
        </button>
        <div className="actions">
          <a className="btn btn-primary" href="/resume.pdf" download="Aditya_Achary_Resume.pdf">download resume ↓</a>
        </div>

        <div className="block">
          <Heading title="certifications" sub="courses i've completed along the way" />
          <div className="cert-grid">{certifications.map((cert, i) => <button type="button" key={cert.slug} className="cert" aria-label={`View ${cert.title} certificate`} style={{ "--n": i } as React.CSSProperties}
            onClick={() => setViewer({ src: `/certs/${cert.slug}.webp`, title: cert.title, pdf: `/certs/${cert.slug}.pdf`, fileName: `${cert.slug}.pdf`, verify: cert.url.startsWith("http") ? cert.url : undefined })}>
            <span className="cert-img"><img src={`/certs/${cert.slug}.webp`} alt={`${cert.title} certificate`} loading="lazy" /></span>
            <b>{cert.title}</b>
            <small>{cert.issuer} · {cert.date}</small>
          </button>)}</div>
        </div>
      </section>}

      {view.section === "contact" && <section className="page" key="contact">
        <p className="kicker">track 04 · contact</p>
        <Badge text="Wanna Contact?" id="contact-arc" blush className="tight" />
        <h2 className="touch">touch me</h2>
        <p className="touch-sub">if you wanna get in touch, feel free to connect with me over your preferred ways and i will get back to you :)</p>
        <div className="icon-row outline">{contactLinks.map((link) => <a className="icon-btn" key={link.label} href={link.url} aria-label={link.label} title={link.label} {...(link.url.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>{link.icon}</a>)}</div>

        <div className="block">
          <Heading title="send a message" />
          <form className="contact-form" onSubmit={submitContact} onInput={(e) => setMessageLength(String(new FormData(e.currentTarget).get("message") ?? "").length)}>
            <div className="form-row">
              <label><span>name</span><input name="name" type="text" placeholder="your name" required /></label>
              <label><span>email</span><input name="email" type="email" placeholder="you@example.com" required /></label>
            </div>
            <label><span>message</span><textarea name="message" placeholder="tell me what you're thinking..." rows={4} required /></label>
            <div className="meter" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} className={i < meterLevel ? "on" : ""} />)}</div>
            <button type="submit" className="btn btn-primary">send message ↗</button>
            {contactStatus && <p className="form-status" role="status">{contactStatus}</p>}
          </form>
        </div>

        <div className="block">
          <Heading title="elsewhere" />
          <div className="icon-row">{socials.map((social) => <a className="icon-btn" key={social.label} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>{social.icon}</a>)}</div>
          <p className="footer-note">© 2026 {NAME.toLowerCase()} · <a href={`mailto:${EMAIL}?subject=Portfolio%20Enquiry`}>{EMAIL}</a></p>
        </div>
      </section>}
    </main>

    {/* Audio lives outside the sections so playback survives switching pages. */}
    {songs.map((song, i) => <audio key={song.no} ref={(element) => { audioRefs.current[i] = element; }} src={song.src} preload="metadata" onEnded={() => setPlaying(null)} onLoadedMetadata={(e) => syncTime(i, e.currentTarget)} onTimeUpdate={(e) => syncTime(i, e.currentTarget)} />)}

    <div className={`now-playing ${playing !== null ? "show" : ""}`} aria-hidden={playing === null}>
      <Eq /><span>{songs[lastPlayed].title}</span>
      <button type="button" aria-label="Pause" tabIndex={playing === null ? -1 : 0} onClick={() => playing !== null && toggleSong(playing)}>Ⅱ</button>
    </div>

    <nav className={`dock ${section === "work" ? "" : "idle"}`} aria-label="Work categories" style={{ "--i": CATEGORIES.indexOf(category) } as React.CSSProperties}>
      <span className="dock-indicator" aria-hidden="true" />
      {CATEGORIES.map((item) => <button type="button" key={item} className={section === "work" && category === item ? "active" : ""} aria-pressed={section === "work" && category === item} onClick={() => pickCategory(item)}>{item}{item === "music" && playing !== null && <Eq bars={3} />}</button>)}
    </nav>

    {viewer && <div className="viewer" role="dialog" aria-modal="true" aria-label={viewer.title} data-lenis-prevent onClick={() => setViewer(null)}>
      <div className="viewer-bar" onClick={(e) => e.stopPropagation()}>
        <span>{viewer.title}</span>
        <div>
          {viewer.verify && <a className="btn" href={viewer.verify} target="_blank" rel="noreferrer">verify ↗</a>}
          <a className="btn btn-primary" href={viewer.pdf} download={viewer.fileName}>download ↓</a>
          <button type="button" className="viewer-close" aria-label="Close" onClick={() => setViewer(null)}>✕</button>
        </div>
      </div>
      <div className="viewer-stage"><img src={viewer.src} alt={viewer.title} onClick={(e) => e.stopPropagation()} /></div>
    </div>}
    <PageWipe phase={wipe} direction={wipeDir} />
    {intro !== "done" && <Loader onReveal={revealIntro} onDone={finishIntro} />}
  </>;
}
