/**
 * scripts/generate-icons.mjs
 * Gera ícones PWA usando sharp (já presente como dependência do Next.js).
 * Execute: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir   = dirname(fileURLToPath(import.meta.url))
const pubDir  = join(__dir, '..', 'public')
mkdirSync(pubDir, { recursive: true })

// ── SVG do ícone ──────────────────────────────────────────────────────────
function makeSVG(size) {
  const r   = Math.round(size * 0.22)   // border-radius arredondado
  const cx  = size / 2
  const cy  = size / 2 - size * 0.03
  const br  = Math.round(size * 0.30)   // raio da bola
  const fs  = Math.round(size * 0.32)   // font-size do emoji

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <!-- Fundo verde escuro -->
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>

  <!-- Círculo de fundo sutil -->
  <circle cx="${cx}" cy="${cy}" r="${br * 1.25}" fill="#22c55e" opacity="0.18"/>

  <!-- Emoji ⚽ renderizado via foreignObject para máxima compatibilidade -->
  <text x="${cx}" y="${cy + fs * 0.38}"
        text-anchor="middle"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
        font-size="${fs}">${'⚽'}</text>

  <!-- Texto "COPA" no rodapé -->
  <text x="${cx}" y="${size - size * 0.09}"
        text-anchor="middle"
        font-family="system-ui, -apple-system, Helvetica Neue, sans-serif"
        font-weight="800" font-size="${Math.round(size * 0.095)}"
        fill="white" opacity="0.92" letter-spacing="${Math.round(size * 0.015)}">COPA</text>
</svg>`
}

// ── Converte SVG → PNG com sharp ─────────────────────────────────────────
async function svgToPNG(svg, outPath) {
  const buf = Buffer.from(svg)
  await sharp(buf, { density: 300 })
    .resize({ width: Number(svg.match(/width="(\d+)"/)[1]) })
    .png({ compressionLevel: 9 })
    .toFile(outPath)
  console.log(`✅ ${outPath.split('/public/').pop() || outPath}`)
}

// ── Gera todos os tamanhos ────────────────────────────────────────────────
await svgToPNG(makeSVG(192), join(pubDir, 'icon-192.png'))
await svgToPNG(makeSVG(512), join(pubDir, 'icon-512.png'))
await svgToPNG(makeSVG(180), join(pubDir, 'apple-touch-icon.png'))

// SVG escalável (bonus — não referenciado no manifest mas útil)
writeFileSync(join(pubDir, 'icon.svg'), makeSVG(512))
console.log('✅ icon.svg')

// ── manifest.json ─────────────────────────────────────────────────────────
const manifest = {
  name:             'Copa dos Amigos',
  short_name:       'Copa',
  description:      'Bolão da Copa do Mundo 2026',
  start_url:        '/',
  display:          'standalone',
  background_color: '#15803d',
  theme_color:      '#15803d',
  orientation:      'portrait-primary',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon.svg',     sizes: 'any',     type: 'image/svg+xml' },
  ],
}
writeFileSync(join(pubDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('✅ manifest.json')
console.log('\nDone! Ícones gerados em public/')
