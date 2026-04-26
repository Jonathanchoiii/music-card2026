import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const hasSpotifyCredentials =
  CLIENT_ID.length > 10 &&
  CLIENT_SECRET.length > 10 &&
  !CLIENT_ID.startsWith('your_') &&
  !CLIENT_SECRET.startsWith('your_')

let accessToken = ''
let tokenExpiry = 0

// ─── Demo data (used when Spotify credentials are not configured) ───

const DEMO_TRACKS = [
  {
    id: 'demo-1',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    albumName: 'After Hours',
    albumCoverUrl: 'https://picsum.photos/seed/album1/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi4b',
    durationMs: 200040,
  },
  {
    id: 'demo-2',
    name: 'Flowers',
    artist: 'Miley Cyrus',
    albumName: 'Endless Summer Vacation',
    albumCoverUrl: 'https://picsum.photos/seed/album2/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:7DSAEUvxU8FajXtRloy8M0',
    durationMs: 200455,
  },
  {
    id: 'demo-3',
    name: 'As It Was',
    artist: 'Harry Styles',
    albumName: "Harry's House",
    albumCoverUrl: 'https://picsum.photos/seed/album3/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:4Dvkj6JhhA12EX05fT5y56',
    durationMs: 167303,
  },
  {
    id: 'demo-4',
    name: 'Anti-Hero',
    artist: 'Taylor Swift',
    albumName: 'Midnights',
    albumCoverUrl: 'https://picsum.photos/seed/album4/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:0V3wPSX9ygBnCm8psDIegu',
    durationMs: 200690,
  },
  {
    id: 'demo-5',
    name: 'Cruel Summer',
    artist: 'Taylor Swift',
    albumName: 'Lover',
    albumCoverUrl: 'https://picsum.photos/seed/album5/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:1BxfuPKGuaTgP7aM0Bbdwr',
    durationMs: 178427,
  },
  {
    id: 'demo-6',
    name: 'Vampire',
    artist: 'Olivia Rodrigo',
    albumName: 'GUTS',
    albumCoverUrl: 'https://picsum.photos/seed/album6/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:1kuGVB7EU95pJObxwvfwKS',
    durationMs: 219724,
  },
  {
    id: 'demo-7',
    name: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    albumName: 'Starboy',
    albumCoverUrl: 'https://picsum.photos/seed/album7/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:7MXVkk9YMctZqd1Srtv4MB',
    durationMs: 230453,
  },
  {
    id: 'demo-8',
    name: 'Levitating',
    artist: 'Dua Lipa',
    albumName: 'Future Nostalgia',
    albumCoverUrl: 'https://picsum.photos/seed/album8/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:39LLxExYz6ewLAo9BUSKOP',
    durationMs: 203064,
  },
  {
    id: 'demo-9',
    name: 'Watermelon Sugar',
    artist: 'Harry Styles',
    albumName: 'Fine Line',
    albumCoverUrl: 'https://picsum.photos/seed/album9/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:6UelLqGlWMcVH1E5c4H7lY',
    durationMs: 174000,
  },
  {
    id: 'demo-10',
    name: 'Heat Waves',
    artist: 'Glass Animals',
    albumName: 'Dreamland',
    albumCoverUrl: 'https://picsum.photos/seed/album10/300/300',
    previewUrl: null,
    spotifyUri: 'spotify:track:02MWAaffLxlfxAUY7c5dvx',
    durationMs: 238805,
  },
]

// ─── Spotify auth ───

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`)
  }

  const data = await response.json()
  accessToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return accessToken
}

async function spotifyFetch(endpoint: string) {
  const token = await getAccessToken()
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json()
}

interface SpotifyArtist {
  name: string
}

interface SpotifyAlbum {
  name: string
  images: Array<{ url: string; height: number; width: number }>
}

interface SpotifyTrackItem {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  preview_url: string | null
  uri: string
  duration_ms: number
}

function mapTrack(t: SpotifyTrackItem) {
  return {
    id: t.id,
    name: t.name,
    artist: t.artists.map((a: SpotifyArtist) => a.name).join(', '),
    albumName: t.album.name,
    albumCoverUrl: t.album.images[0]?.url || '',
    previewUrl: t.preview_url,
    spotifyUri: t.uri,
    durationMs: t.duration_ms,
  }
}

// ─── Routes ───

app.get('/api/spotify/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').toLowerCase()
    if (!q) {
      res.status(400).json({ error: 'Missing query parameter q' })
      return
    }

    if (!hasSpotifyCredentials) {
      const filtered = DEMO_TRACKS.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.albumName.toLowerCase().includes(q)
      )
      res.json({ tracks: filtered.length > 0 ? filtered : DEMO_TRACKS.slice(0, 5) })
      return
    }

    const data = await spotifyFetch(`/search?q=${encodeURIComponent(q)}&type=track&limit=20`)
    const tracks = data.tracks.items.map(mapTrack)
    res.json({ tracks })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Search error:', message)
    res.status(500).json({ error: message })
  }
})

app.get('/api/spotify/track/:id', async (req, res) => {
  try {
    const id = req.params.id

    if (!hasSpotifyCredentials || id.startsWith('demo-')) {
      const demo = DEMO_TRACKS.find((t) => t.id === id)
      if (demo) {
        res.json({ track: demo })
        return
      }
    }

    const data = await spotifyFetch(`/tracks/${id}`)
    res.json({ track: mapTrack(data) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Track error:', message)
    res.status(500).json({ error: message })
  }
})

app.get('/api/spotify/random', async (_req, res) => {
  try {
    if (!hasSpotifyCredentials) {
      const shuffled = [...DEMO_TRACKS].sort(() => Math.random() - 0.5).slice(0, 5)
      res.json({ tracks: shuffled })
      return
    }

    const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'r-n-b', 'indie', 'jazz', 'classical', 'k-pop', 'latin']
    const genre = genres[Math.floor(Math.random() * genres.length)]
    const offset = Math.floor(Math.random() * 100)
    const data = await spotifyFetch(
      `/search?q=genre:${genre}&type=track&limit=20&offset=${offset}`
    )
    const tracks = data.tracks.items.map(mapTrack)
    const shuffled = tracks.sort(() => Math.random() - 0.5).slice(0, 5)
    res.json({ tracks: shuffled })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Random error:', message)
    res.status(500).json({ error: message })
  }
})

// ─── Apple Music (iTunes Search API) ───
//
// Free, no auth required. Returns 30s previewUrl + artwork.
// Used by the Bloom WebGPU page for selecting tracks.

interface ItunesItem {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  artworkUrl100: string
  previewUrl: string | null
  trackTimeMillis: number
  trackViewUrl: string
}

interface AppleTrack {
  id: string
  name: string
  artist: string
  albumName: string
  albumCoverUrl: string
  previewUrl: string | null
  durationMs: number
  appleUrl: string
}

function upgradeArtwork(url: string, size = 600): string {
  if (!url) return url
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, `/${size}x${size}bb.$1`)
}

function mapItunesItem(it: ItunesItem): AppleTrack {
  return {
    id: String(it.trackId),
    name: it.trackName,
    artist: it.artistName,
    albumName: it.collectionName,
    albumCoverUrl: upgradeArtwork(it.artworkUrl100, 600),
    previewUrl: it.previewUrl,
    durationMs: it.trackTimeMillis,
    appleUrl: it.trackViewUrl,
  }
}

async function itunesFetch(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`https://itunes.apple.com/search?${qs}`, {
    headers: { 'User-Agent': 'music-card/1.0' },
  })
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`)
  return res.json() as Promise<{ resultCount: number; results: ItunesItem[] }>
}

async function itunesLookup(id: string) {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': 'music-card/1.0' },
  })
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`)
  return res.json() as Promise<{ resultCount: number; results: ItunesItem[] }>
}

/** 贺卡页：返回 Apple 目录中《生日快乐》类歌曲的 ~30s 试听 URL（与 Apple Music / iTunes 试听同源） */
app.get('/api/apple/birthday-preview', async (_req, res) => {
  try {
    const queries = ['Happy Birthday Traditional', 'Happy Birthday To You', 'Happy Birthday']
    const countries = ['us', 'cn', 'hk', 'tw', 'jp']

    for (const country of countries) {
      for (const term of queries) {
        const data = await itunesFetch({
          term,
          media: 'music',
          entity: 'song',
          limit: '30',
          country,
        })
        const hit = data.results.find(
          (it) =>
            it.previewUrl &&
            /happy/i.test(it.trackName) &&
            /birthday/i.test(it.trackName),
        )
        if (hit?.previewUrl) {
          res.json({
            previewUrl: hit.previewUrl,
            trackName: hit.trackName,
            artistName: hit.artistName,
          })
          return
        }
      }
    }

    res.status(404).json({ error: 'No Happy Birthday preview in catalog' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[apple/birthday-preview]', message)
    res.status(500).json({ error: message })
  }
})

app.get('/api/apple/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim()
    if (!q) {
      res.status(400).json({ error: 'Missing query parameter q' })
      return
    }
    const country = (req.query.country as string) || 'cn'
    const data = await itunesFetch({
      term: q,
      media: 'music',
      entity: 'song',
      limit: '20',
      country,
    })
    const tracks = data.results.filter((it) => it.previewUrl).map(mapItunesItem)
    res.json({ tracks })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[apple/search]', message)
    res.status(500).json({ error: message })
  }
})

const APPLE_RANDOM_TERMS = [
  'love', 'summer', 'night', 'dream', 'rain', 'star', 'home',
  'city', 'heart', 'gold', 'fire', 'time', 'light', 'sky', 'ocean',
  '想念', '夜晚', '阳光', '月亮', '青春', '回忆',
]

app.get('/api/apple/random', async (_req, res) => {
  try {
    const term = APPLE_RANDOM_TERMS[Math.floor(Math.random() * APPLE_RANDOM_TERMS.length)]
    const country = Math.random() < 0.5 ? 'cn' : 'us'
    const data = await itunesFetch({
      term,
      media: 'music',
      entity: 'song',
      limit: '25',
      country,
    })
    const tracks = data.results
      .filter((it) => it.previewUrl)
      .map(mapItunesItem)
      .sort(() => Math.random() - 0.5)
      .slice(0, 8)
    res.json({ tracks })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[apple/random]', message)
    res.status(500).json({ error: message })
  }
})

app.get('/api/apple/track/:id', async (req, res) => {
  try {
    const data = await itunesLookup(req.params.id)
    const item = data.results[0]
    if (!item) {
      res.status(404).json({ error: 'Track not found' })
      return
    }
    res.json({ track: mapItunesItem(item) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[apple/track]', message)
    res.status(500).json({ error: message })
  }
})

export default app
