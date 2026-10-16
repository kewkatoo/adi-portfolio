import { NextResponse } from "next/server";

// Listening stats from stats.fm (public profile, no keys). Responses are cached for 5 minutes.
const API = "https://api.stats.fm/api/v1/users";
const RANGES = ["weeks", "months", "lifetime"] as const;
type Range = (typeof RANGES)[number];

type Artist = { id: number; name: string; image?: string | null; externalIds?: { spotify?: string[] } };
type Album = { id: number; name: string; image?: string | null; artists?: Artist[]; externalIds?: { spotify?: string[] } };
type Track = { id: number; name: string; artists: Artist[]; albums: Album[]; externalIds?: { spotify?: string[] } };

const spotify = (kind: string, ids?: string[]) => ids?.[0] ? `https://open.spotify.com/${kind}/${ids[0]}` : null;

async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}/${path}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // Outside production, ?user= lets you preview with any public stats.fm profile.
  const user = (process.env.NODE_ENV !== "production" && params.get("user")) || process.env.STATSFM_USER;
  if (!user) return NextResponse.json({ configured: false }, { status: 503 });
  const range: Range = RANGES.includes(params.get("range") as Range) ? (params.get("range") as Range) : "weeks";
  const id = encodeURIComponent(user);

  const [profile, stats, artists, tracks, albums, genres, recent, allTime] = await Promise.all([
    get<{ item: { displayName: string; image?: string } }>(id),
    get<{ items: { durationMs: number; count: number; cardinality?: { tracks: number; artists: number; albums: number } } }>(`${id}/streams/stats?range=${range}`),
    get<{ items: { position: number; streams?: number; artist: Artist }[] }>(`${id}/top/artists?range=${range}&limit=5`),
    get<{ items: { position: number; streams?: number; track: Track }[] }>(`${id}/top/tracks?range=${range}&limit=5`),
    get<{ items: { position: number; streams?: number; album: Album }[] }>(`${id}/top/albums?range=${range}&limit=4`),
    get<{ items: { position: number; genre: { tag: string } }[] }>(`${id}/top/genres?range=${range}&limit=6`),
    get<{ items: { endTime: string; track: Track }[] }>(`${id}/streams/recent?limit=5`),
    get<{ items: { streams?: number; artist: Artist }[] }>(`${id}/top/artists?range=lifetime&limit=1`),
  ]);
  if (!profile) return NextResponse.json({ configured: true, error: "Profile not found or private" }, { status: 404 });

  const favourite = allTime?.items?.[0];
  return NextResponse.json({
    configured: true,
    range,
    profile: { name: profile.item.displayName, image: profile.item.image ?? null, url: `https://stats.fm/${id}` },
    totals: stats?.items ? { ms: stats.items.durationMs, streams: stats.items.count, tracks: stats.items.cardinality?.tracks ?? null, artists: stats.items.cardinality?.artists ?? null } : null,
    favourite: favourite ? { name: favourite.artist.name, image: favourite.artist.image ?? null, streams: favourite.streams ?? null, url: spotify("artist", favourite.artist.externalIds?.spotify) } : null,
    artists: (artists?.items ?? []).slice(0, 5).map((item) => ({ position: item.position, name: item.artist.name, image: item.artist.image ?? null, streams: item.streams ?? null, url: spotify("artist", item.artist.externalIds?.spotify) })),
    tracks: (tracks?.items ?? []).slice(0, 5).map((item) => ({ position: item.position, name: item.track.name, artists: item.track.artists.map((a) => a.name).join(", "), image: item.track.albums[0]?.image ?? null, streams: item.streams ?? null, url: spotify("track", item.track.externalIds?.spotify) })),
    albums: (albums?.items ?? []).slice(0, 4).map((item) => ({ position: item.position, name: item.album.name, artists: (item.album.artists ?? []).map((a) => a.name).join(", "), image: item.album.image ?? null, url: spotify("album", item.album.externalIds?.spotify) })),
    genres: (genres?.items ?? []).slice(0, 6).map((item) => item.genre.tag),
    recent: (recent?.items ?? []).slice(0, 5).map((item) => ({ at: item.endTime, name: item.track.name, artists: item.track.artists.map((a) => a.name).join(", "), image: item.track.albums[0]?.image ?? null, url: spotify("track", item.track.externalIds?.spotify) })),
  });
}
