import puppeteer from 'puppeteer-core'

const URL = process.argv[2] || 'http://localhost:3000/playground'
const OUT = process.argv[3] || '/tmp/pg-shot.png'
const WAIT = Number(process.argv[4] || 6000)

const browser = await puppeteer.launch({
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: [
    '--no-first-run',
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan',
    '--window-size=960,420',
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: 960, height: 420 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) =>
  logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`),
)

await page
  .goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
  .catch((e) => logs.push('[goto] ' + e.message))
await new Promise((r) => setTimeout(r, WAIT))
await page.screenshot({ path: OUT })
console.log('=== CONSOLE/ERRORS ===')
console.log(logs.join('\n') || '(none)')
await browser.close()
