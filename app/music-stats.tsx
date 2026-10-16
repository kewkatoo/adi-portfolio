"use client";

import { useEffect, useState } from "react";

type Range = "weeks" | "months" | "lifetime";
type Item = { position?: number; name: string; artists?: string; image: string | null; streams?: number | null; url: string | null; at?: string };
type Stats = {
  configured: boolean;
  error?: string;
  profile?: { name: string; image: string | null; url: string };
  totals?: { ms: number; streams: number; tracks: number | null; artists: number | null } | null;
  favourite?: Item | null;
  artists?: Item[];
  tracks?: Item[];
  albums?: Item[];
  genres?: string[];
  recent?: Item[];
};

const RANGES: { id: Range; label: string }[] = [{ id: "weeks", label: "4 weeks" }, { id: "months", label: "6 months" }, { id: "lifetime", label: "lifetime" }];

const ago = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
};

function Heading({ title, sub }: { title: string; sub?: string }) {
  return <div className="heading"><h2>{title}<span className="spark" aria-hidden="true">✦</span></h2>{sub && <p>{sub}</p>}</div>;
}

/** One ranked line: position, artwork, name + subline, and a count on the right. */
function StatRow({ item, round = false, note }: { item: Item; round?: boolean; note?: string }) {
  const body = <>
    {item.position !== undefined && <span className="stat-pos">{item.position}</span>}
    <span className={`stat-art ${round ? "round" : ""}`}>{item.image && <img src={item.image} alt="" loading="lazy" />}</span>
    <span className="stat-text"><b>{item.name}</b>{item.artists && <small>{item.artists}</small>}</span>
    {note && <span className="stat-note">{note}</span>}
  </>;
  return item.url ? <a className="stat-row" href={item.url} target="_blank" rel="noreferrer">{body}</a> : <div className="stat-row">{body}</div>;
}

/** Spotify listening stats via stats.fm: totals, all-time favourite, top artists/songs/albums/genres, recent plays. */
export function MusicStats() {
  const [range, setRange] = useState<Range>("weeks");
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Outside production, ?statsfm=<user> on the page previews any public profile.
    const preview = process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search).get("statsfm") : null;
    fetch(`/api/music-stats?range=${range}${preview ? `&user=${encodeURIComponent(preview)}` : ""}`)
      .then((response) => response.json())
      .then((json: Stats) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setData({ configured: true, error: "offline" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  if (data && (!data.configured || data.error)) {
    return <div className="block"><Heading title="listening stats" sub="spotify stats are on their way — check back soon" /></div>;
  }

  const hours = data?.totals ? Math.round(data.totals.ms / 3.6e6) : null;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;

  return <div className={`music-stats ${loading ? "is-loading" : ""}`}>
    <div className="block">
      <Heading title="listening stats" sub={`what's been on repeat · ${rangeLabel}`} />
      <div className="range-tabs" role="tablist">
        {RANGES.map((r) => <button key={r.id} type="button" role="tab" aria-selected={range === r.id} className={range === r.id ? "active" : ""} onClick={() => setRange(r.id)}>{r.label}</button>)}
      </div>
      <div className="stats listen-stats">
        <div className="stat"><b>{hours !== null ? hours.toLocaleString() : "—"}</b><span>hours listened</span></div>
        <div className="stat"><b>{data?.totals ? data.totals.streams.toLocaleString() : "—"}</b><span>streams</span></div>
        <div className="stat"><b>{data?.totals?.tracks?.toLocaleString() ?? "—"}</b><span>different songs</span></div>
        <div className="stat"><b>{data?.totals?.artists?.toLocaleString() ?? "—"}</b><span>different artists</span></div>
      </div>
    </div>

    {data?.favourite && <div className="block">
      <Heading title="all-time favourite artist" />
      <a className="fav-artist" href={data.favourite.url ?? undefined} target="_blank" rel="noreferrer">
        <span className="fav-art">{data.favourite.image && <img src={data.favourite.image} alt="" />}</span>
        <b>{data.favourite.name}</b>
        {data.favourite.streams ? <small>{data.favourite.streams.toLocaleString()} streams, all time</small> : null}
      </a>
    </div>}

    <div className="block stat-columns">
      <div><Heading title="top artists" />{data?.artists?.map((item) => <StatRow key={item.name} item={item} round note={item.streams ? `${item.streams} plays` : undefined} />)}</div>
      <div><Heading title="top songs" />{data?.tracks?.map((item) => <StatRow key={`${item.name}-${item.position}`} item={item} note={item.streams ? `${item.streams} plays` : undefined} />)}</div>
    </div>

    {!!data?.albums?.length && <div className="block">
      <Heading title="top albums" />
      <div className="album-grid">{data.albums.map((album) => <a key={album.name} className="album" href={album.url ?? undefined} target="_blank" rel="noreferrer" title={`${album.name} — ${album.artists}`}>
        <span className="album-art">{album.image && <img src={album.image} alt="" loading="lazy" />}</span>
        <b>{album.name}</b><small>{album.artists}</small>
      </a>)}</div>
    </div>}

    {!!data?.genres?.length && <div className="block"><Heading title="top genres" /><div className="chips center">{data.genres.map((genre) => <span key={genre}>{genre}</span>)}</div></div>}

    {!!data?.recent?.length && <div className="block">
      <Heading title="recently played" />
      {data.recent.map((item) => <StatRow key={item.at} item={item} note={item.at ? ago(item.at) : undefined} />)}
      {data.profile && <div className="center"><a className="text-link" href={data.profile.url} target="_blank" rel="noreferrer">full stats on stats.fm ↗</a></div>}
    </div>}
  </div>;
}
