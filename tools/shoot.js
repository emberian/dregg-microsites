// shoot.js · tweet-ready screenshots of the microsites shelf.
// Usage: node shoot.js [slug ...]   (no args = everything in the manifest)
// Output: ../shots/<slug>.png (full page) + ../shots/<slug>--<card>.png (elements)
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'shots');

// element cards: the screenshot-worthy blocks, by CSS selector
const MANIFEST = {
  'index':                      { cards: {} },
  'fourteen-rooms':             { cards: {} },
  'plan-to-compost-at-least-three': { cards: {} },
  'two-phones':                 { cards: { 'minus60': 'pre:nth-of-type(2)', 'law': '.law', 'menu': '.menu' } },
  'a-clutch-of-eggs':           { cards: { 'promise': '.promise', 'lexicon': '.lexicon', 'lifecycle': 'pre' } },
  'make-the-digest-a-proof':    { cards: { 'stats': '.figures', 'thesis': '.thesis', 'stages': '.stages' } },
  'trust-me-in-latin':          { cards: { 'latin': 'blockquote.hot', 'recompute': 'article.position:nth-of-type(1)', 'ai-standing': 'article.position:nth-of-type(3)' } },
  'green-is-not-true':          { cards: { 'ob2': 'pre:nth-of-type(2)', 'census': 'pre:nth-of-type(3)', 'gate': 'pre:nth-of-type(4)' } },
  'prove-the-turn':             { cards: { 'audit': '.law', 'ladder': '.menu', 'stands': 'pre:last-of-type' } },
  'the-cheat-is-unsatisfiable': { cards: { 'cheat': 'pre', 'deletion': '.commits' } },
  'the-fix-is-a-theorem':       { cards: { 'probes': 'pre:nth-of-type(1)', 'enrol': 'pre:nth-of-type(2)' } },
  'months-in-evenings':         { cards: { 'handoff': 'blockquote:nth-of-type(1)', 'roundup': 'blockquote:nth-of-type(2)' } },
  'promises-priced':            { cards: { 'quickstart': 'pre', 'coercion': '.law' } },
  'which-model':                { cards: { 'gap': '.gap', 'stance': '.stance', 'notclaims': '.notclaims' } },
  'reading-a-millennium-proof': { cards: { 'identity': '.identity', 'credit': '.credit' } },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1200, deviceScaleFactor: 2 });
  for (const [slug, cfg] of Object.entries(MANIFEST)) {
    if (only.length && !only.includes(slug)) continue;
    const file = slug === 'index' ? path.join(ROOT, 'index.html') : path.join(ROOT, slug, 'index.html');
    if (!fs.existsSync(file)) { console.log('skip (missing)', slug); continue; }
    await page.goto('file://' + file, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(OUT, slug + '.png'), fullPage: true });
    console.log('full', slug);
    for (const [name, sel] of Object.entries(cfg.cards)) {
      const el = await page.$(sel);
      if (!el) { console.log('  ✗ card missing:', slug, name, sel); continue; }
      // pad the element shot so it breathes like a card
      const box = await el.boundingBox();
      const pad = 28;
      await page.screenshot({
        path: path.join(OUT, `${slug}--${name}.png`),
        clip: { x: Math.max(box.x - pad, 0), y: Math.max(box.y - pad, 0),
                width: Math.min(box.width + pad * 2, 1500), height: box.height + pad * 2 },
      });
      console.log('  card', name);
    }
  }
  await browser.close();
})();
