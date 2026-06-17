import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-first-run', '--enable-unsafe-webgpu', '--enable-features=Vulkan'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1100, height: 600 })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))

const clickByText = (text) =>
  page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes(t),
    )
    if (btn) btn.click()
    return !!btn
  }, text)

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 2500))

console.log('add editor:', await clickByText('Editor'))
console.log('add preview:', await clickByText('Preview'))
await new Promise((r) => setTimeout(r, 1500))
await page.screenshot({ path: '/tmp/board-1.png' })

const countBefore = await page.evaluate(
  () => document.querySelectorAll('.react-flow__node').length,
)
console.log('nodes before reload:', countBefore)

// Reload in same browser session -> IndexedDB should restore.
await page.reload({ waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 2500))
const countAfter = await page.evaluate(
  () => document.querySelectorAll('.react-flow__node').length,
)
console.log('nodes after reload:', countAfter)
await page.screenshot({ path: '/tmp/board-2.png' })

console.log('=== CONSOLE ===')
console.log(
  logs.filter((l) => !/vite|DevTools|Download the React/i.test(l)).join('\n') ||
    '(clean)',
)
await browser.close()
