const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const defaultLaunchOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--window-size=1920,1080'
  ]
};

async function imdb_find_titles(moviename) {
  const found_titles = [];
  const query = encodeURIComponent(moviename.trim());
  const url = `https://www.imdb.com/find?q=${query}`;

  const browser = await puppeteer.launch(defaultLaunchOptions);
  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const titles = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a.ipc-title-link-wrapper');
      links.forEach(link => {
        const name = link.querySelector('h3.ipc-title__text')?.textContent?.trim();
        const href = link.getAttribute('href');
        if (name && href && href.includes('/title/tt')) {
          results.push({
            name,
            href: `https://www.imdb.com${href.split('?')[0]}`
          });
        }
      });
      return results;
    });

    return titles;
  } catch (err) {
    console.error('imdb_find_titles error:', err.message);
    return found_titles;
  } finally {
    await browser.close();
  }
}

async function imdb_info(url) {
  const browser = await puppeteer.launch(defaultLaunchOptions);
  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const info = await page.evaluate(() => {
      const rating = document.querySelector('div[data-testid="hero-rating-bar__aggregate-rating__score"] span')?.textContent?.trim() || '';
      const text = document.querySelector('span[data-testid="plot-xs_to_m"]')?.textContent?.trim() || '';
      return { rating, text };
    });

    return info;
  } catch (err) {
    console.error('imdb_info error:', err.message);
    return { rating: '', text: '' };
  } finally {
    await browser.close();
  }
}

async function imdb(moviename) {
  res_obj = {}
  const imdb_res_titles = await imdb_find_titles(moviename);
    //movie title not found
    if(imdb_res_titles.length < 1) {
      res_obj['status'] = 404
      res_obj['title'] = moviename
      return res_obj
    }

  const imdb_res = await imdb_info(imdb_res_titles[0]['href']);
  res_obj['status'] = 200
  res_obj['title'] = imdb_res_titles[0]['name']
  res_obj['url'] = `${imdb_res_titles[0]['href']}`
  res_obj['rating'] = imdb_res['rating']
  res_obj['text'] = imdb_res['text']
  return res_obj
}


module.exports = { 
  imdb_find_titles, 
  imdb_info, 
  imdb 
};
