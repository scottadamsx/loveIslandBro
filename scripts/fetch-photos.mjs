// Downloads CANDIDATE headshots for islanders in src/data/cast.json into
// photo-review/ — a quarantine folder that the app NEVER serves.
//
// ⚠️  Nothing this script downloads appears in the app. Internet image results
// cannot be trusted sight-unseen (this project learned that the hard way):
// a human must LOOK AT every file in photo-review/ first, delete the bad ones,
// and only then run:
//
//   node scripts/fetch-photos.mjs --publish
//
// which moves the reviewed files into public/cast/ and updates photos.json.
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const reviewDir = join(root, 'photo-review')
const publishDir = join(root, 'public', 'cast')
const photosJson = join(root, 'src', 'data', 'photos.json')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

/* ---------- publish mode: human has reviewed photo-review/, promote files ---------- */

if (process.argv.includes('--publish')) {
  const files = (await readdir(reviewDir).catch(() => [])).filter((f) => !f.startsWith('.'))
  if (files.length === 0) {
    console.log('photo-review/ is empty — nothing to publish.')
    process.exit(0)
  }
  const confirmed = process.argv.includes('--yes')
  if (!confirmed) {
    console.log(`About to publish ${files.length} file(s) from photo-review/ into the app:`)
    for (const f of files) console.log(`  - ${f}`)
    console.log('\nHave you OPENED and LOOKED AT every one of these images?')
    console.log('If yes, re-run:  node scripts/fetch-photos.mjs --publish --yes')
    process.exit(1)
  }
  await mkdir(publishDir, { recursive: true })
  const photos = JSON.parse(await readFile(photosJson, 'utf8').catch(() => '{}'))
  for (const f of files) {
    await rename(join(reviewDir, f), join(publishDir, f))
    const id = f.replace(/\.[a-z0-9]+$/i, '')
    photos[id] = `/cast/${f}`
    console.log(`published ${f}`)
  }
  await writeFile(photosJson, JSON.stringify(photos, null, 2) + '\n')
  console.log(`\nDone. ${files.length} photo(s) now live in the app.`)
  process.exit(0)
}

/* ---------- fetch mode: download candidates into quarantine ---------- */

function decodeEntities(s) {
  return s
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

// Primary source: the contestant's own Love Island wiki page portrait —
// identity-matched by page title, unlike raw image search.
async function fandomImageUrl(name) {
  const variants = [
    name.replaceAll(' ', '_'),
    `${name.replaceAll(' ', '_')}_(Season_8)`,
    `${name.split(' ')[0]}_(USA_8)`,
  ]
  for (const page of variants) {
    try {
      const res = await fetch(`https://loveisland.fandom.com/wiki/${page}`, {
        headers: { 'User-Agent': UA },
      })
      if (!res.ok) continue
      const html = await res.text()
      const m = html.match(/<meta property="og:image" content="([^"]+)"/)
      if (m && !/site-logo|wordmark|fandom-logo/i.test(m[1])) return decodeEntities(m[1])
    } catch {
      /* try next variant */
    }
  }
  return null
}

async function searchImageUrls(query) {
  // adlt=strict → Bing strict SafeSearch. Necessary but NOT sufficient —
  // results still get human review before publishing.
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1&adlt=strict`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  })
  const html = await res.text()
  return [...html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g)]
    .map((m) => decodeEntities(m[1]))
    .slice(0, 6)
}

function extFor(buf, contentType) {
  const b = new Uint8Array(buf)
  if (b[0] === 0x89 && b[1] === 0x50) return 'png'
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg'
  if (b[0] === 0x52 && b[1] === 0x49) return 'webp'
  if (contentType?.includes('png')) return 'png'
  if (contentType?.includes('webp')) return 'webp'
  return 'jpg'
}

async function tryDownload(url) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: 'https://www.bing.com/' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength < 6000) return null
    return { buf, ext: extFor(buf, type) }
  } catch {
    return null
  }
}

const cast = JSON.parse(await readFile(join(root, 'src', 'data', 'cast.json'), 'utf8'))
const published = JSON.parse(await readFile(photosJson, 'utf8').catch(() => '{}'))
await mkdir(reviewDir, { recursive: true })
const alreadyQueued = new Set(
  (await readdir(reviewDir).catch(() => [])).map((f) => f.replace(/\.[a-z0-9]+$/i, '')),
)

let fetched = 0
for (const islander of cast.islanders) {
  if (published[islander.id] || alreadyQueued.has(islander.id)) continue
  process.stdout.write(`? ${islander.name} ... `)
  let saved = false
  try {
    const urls = []
    const fandom = await fandomImageUrl(islander.name)
    if (fandom) urls.push(fandom)
    else urls.push(...(await searchImageUrls(`${islander.name} Love Island USA season 8 cast`)))
    for (const url of urls) {
      const img = await tryDownload(url)
      if (!img) continue
      const file = `${islander.id}.${img.ext}`
      await writeFile(join(reviewDir, file), img.buf)
      console.log(`queued ${file} for review`)
      fetched++
      saved = true
      break
    }
  } catch (e) {
    console.log(`error: ${e.message}`)
  }
  if (!saved) console.log('no candidate found — set a photo in the app instead')
  await new Promise((r) => setTimeout(r, 400))
}

console.log(`\n${fetched} candidate(s) in photo-review/ — they are NOT in the app yet.`)
console.log('Open the folder, look at every image, delete anything wrong, then:')
console.log('  node scripts/fetch-photos.mjs --publish')
