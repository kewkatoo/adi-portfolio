import { NextResponse } from "next/server";

// The most recent stream from stats.fm, shown in the listening card when nothing is playing.
type Recent = { items: { endTime: string; track: { name: string; artists: { name: string }[]; albums: { image?: string | null }[]; externalIds?: { spotify?: string[] } } }[] };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const user = (process.env.NODE_ENV !== "production" && params.get("user")) || process.env.STATSFM_USER;
  if (!user) return NextResponse.json({ track: null }, { status: 503 });
  try {
    const response = await fetch(`https://api.stats.fm/api/v1/users/${encodeURIComponent(user)}/streams/recent?limit=1`, { next: { revalidate: 60 } });
    if (!response.ok) return NextResponse.json({ track: null }, { status: 502 });
    const latest = ((await response.json()) as Recent).items?.[0];
    if (!latest) return NextResponse.json({ track: null });
    const spotifyId = latest.track.externalIds?.spotify?.[0];
    return NextResponse.json({
      track: {
        song: latest.track.name,
        artist: latest.track.artists.map((a) => a.name).join(", "),
        image: latest.track.albums[0]?.image ?? null,
        url: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : null,
        at: latest.endTime,
      },
    });
  } catch {
    return NextResponse.json({ track: null }, { status: 502 });
  }
}
