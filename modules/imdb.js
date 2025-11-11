const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const defaultLaunchOptions = {
  headless: 'new', // faster headless mode
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080'
  ]
};

async function imdb_find_titles(page, moviename) {
  const query = encodeURIComponent(moviename.trim());
  const url = `https://www.imdb.com/find?q=${query}`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a.ipc-title-link-wrapper'))
        .map(link => {
          const name = link.querySelector('h3.ipc-title__text')?.textContent?.trim();
          const href = link.getAttribute('href');
          if (name && href?.includes('/title/tt')) {
            return {
              name,
              href: `https://www.imdb.com${href.split('?')[0]}`
            };
          }
        })
        .filter(Boolean);
    });
  } catch (err) {
    console.error('imdb_find_titles error:', err.message);
    return [];
  }
}

async function imdb_info(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    return await page.evaluate(() => {
      const rating = document.querySelector('div[data-testid="hero-rating-bar__aggregate-rating__score"] span')?.textContent?.trim() || '';
      const text = document.querySelector('span[data-testid="plot-xs_to_m"]')?.textContent?.trim() || '';
      return { rating, text };
    });
  } catch (err) {
    console.error('imdb_info error:', err.message);
    return { rating: '', text: '' };
  }
}

async function imdb(moviename) {
  const browser = await puppeteer.launch(defaultLaunchOptions);
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const titles = await imdb_find_titles(page, moviename);
    if (titles.length === 0) {
      return { status: 404, title: moviename };
    }

    const info = await imdb_info(page, titles[0].href);
    return {
      status: 200,
      title: titles[0].name,
      url: titles[0].href,
      rating: info.rating,
      text: info.text
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  imdb_find_titles,
  imdb_info,
  imdb
};
