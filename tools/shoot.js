// shoot.js v2 · tweet-ready screenshots: SECTION cards (h2 + its content),
// a TITLE card per page, element cards, and the full page for reference.
// Usage: node shoot.js [slug ...]
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'shots');

// hand-picked element cards (small, punchy)
const ELEMENTS = {
  'two-phones':                 { 'minus60': 'pre:nth-of-type(2)', 'law': '.law' },
  'a-clutch-of-eggs':           { 'promise': '.promise' },
  'make-the-digest-a-proof':    { 'stats': '.figures', 'thesis': '.thesis' },
  'trust-me-in-latin':          { 'latin': 'blockquote.hot' },
  'which-model':                { 'gap': '.gap' },
  'promises-priced':            { 'coercion': '.law' },
  'months-in-evenings':         { 'roundup': 'blockquote:nth-of-type(2)' },
};
const SLUGS = ['fourteen-rooms','plan-to-compost-at-least-three','two-phones','a-clutch-of-eggs',
  'make-the-digest-a-proof','trust-me-in-latin','green-is-not-true','prove-the-turn',
  'the-cheat-is-unsatisfiable','the-fix-is-a-theorem','months-in-evenings','promises-priced',
  'which-model','reading-a-millennium-proof'];

const slugify = s => s.toLowerCase().replace(/<[^>]+>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1200, deviceScaleFactor: 2 });

  async function clipShot(rect, file, pad = 30) {
    await page.screenshot({ path: file, clip: {
      x: Math.max(rect.x - pad, 0), y: Math.max(rect.y - pad, 0),
      width: Math.min(rect.w + pad * 2, 1500), height: rect.h + pad * 2 } });
  }

  for (const slug of SLUGS) {
    if (only.length && !only.includes(slug)) continue;
    const file = path.join(ROOT, slug, 'index.html');
    if (!fs.existsSync(file)) { console.log('skip', slug); continue; }
    await page.goto('file://' + file, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(OUT, slug + '.png'), fullPage: true }); // reference

    // TITLE card: masthead through titleblock
    const title = await page.evaluate(() => {
      const els = [document.querySelector('header.masthead'),
                   document.querySelector('.titleblock') || document.querySelector('.intro')].filter(Boolean);
      if (!els.length) return null;
      let t = 1e9, l = 1e9, r = 0, b = 0;
      for (const e of els) { const c = e.getBoundingClientRect();
        t = Math.min(t, c.top + scrollY); l = Math.min(l, c.left);
        r = Math.max(r, c.right); b = Math.max(b, c.bottom + scrollY); }
      return { x: l, y: t, w: r - l, h: b - t };
    });
    if (title) { await clipShot(title, path.join(OUT, `${slug}--title.png`)); console.log(slug, 'title'); }

    // SECTION cards: each h2 plus everything until the next h2/footer
    const sections = await page.evaluate(() => {
      const out = [];
      for (const h2 of document.querySelectorAll('main h2, main .position')) {
        const els = [h2];
        if (!h2.classList.contains('position'))
          for (let n = h2.nextElementSibling; n && n.tagName !== 'H2' && n.tagName !== 'FOOTER'
               && !n.classList.contains('position'); n = n.nextElementSibling) els.push(n);
        let t = 1e9, l = 1e9, r = 0, b = 0;
        for (const e of els) { const c = e.getBoundingClientRect();
          if (!c.height) continue;
          t = Math.min(t, c.top + scrollY); l = Math.min(l, c.left);
          r = Math.max(r, c.right); b = Math.max(b, c.bottom + scrollY); }
        out.push({ x: l, y: t, w: r - l, h: b - t,
                   name: (h2.querySelector('h2') || h2).textContent.trim() });
      }
      return out;
    });
    for (const s of sections) {
      if (s.h < 60 || s.h > 3200) continue;
      const name = slugify(s.name);
      await clipShot(s, path.join(OUT, `${slug}--sec-${name}.png`));
      console.log(slug, 'sec', name, Math.round(s.h) + 'px');
    }
    for (const [name, sel] of Object.entries(ELEMENTS[slug] || {})) {
      const el = await page.$(sel);
      if (!el) { console.log('  ✗', slug, name); continue; }
      await clipShot(await el.boundingBox().then(b => ({ x: b.x, y: b.y, w: b.width, h: b.height })),
                     path.join(OUT, `${slug}--${name}.png`));
    }
  }
  await browser.close();
})();
