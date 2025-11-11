const puppeteer = require('puppeteer');

async function imdb_find_titles(moviename) {
    let browser;
    const found_titles = [];

    try {
        console.log(`=== Starting IMDb title search for: ${moviename} ===`);
        
        browser = await puppeteer.launch({
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
        });

        const page = await browser.newPage();
        
        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        const moviename_no_space = moviename.replaceAll(" ", "+");
        const url = `https://www.imdb.com/find?q=${moviename_no_space}`;
        
        console.log(`Navigating to: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if we got a challenge page
        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        if (pageTitle.includes('Access Denied') || pageTitle.includes('Security Challenge')) {
            throw new Error('IMDb blocked the request with challenge page');
        }

        // Wait for search results to load
        try {
            await page.waitForSelector('section[data-testid="find-results-section-title"]', { timeout: 10000 });
        } catch (e) {
            console.log('Search results not found within timeout, continuing anyway...');
        }

        // Extract movie titles and links
        const titles = await page.evaluate(() => {
            const results = [];
            
            const titleElements = document.querySelectorAll('section[data-testid="find-results-section-title"] div[class="ipc-metadata-list-summary-item__c"]');
            
            titleElements.forEach(element => {
                const titleLink = element.querySelector('a[class="ipc-metadata-list-summary-item__t"]');
                if (titleLink) {
                    const movieTitle = titleLink.textContent?.trim();
                    const movieHref = titleLink.getAttribute('href');
                    
                    if (movieTitle && movieHref) {
                        results.push({
                            name: movieTitle,
                            href: movieHref
                        });
                    }
                }
            });
            
            return results;
        });

        console.log(`Found ${titles.length} titles`);
        return titles;

    } catch (error) {
        console.error('Error in imdb_find_titles:', error.message);
        return found_titles;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function imdb_info(url) {
    let browser;

    try {
        console.log(`=== Starting IMDb info extraction for: ${url} ===`);
        
        browser = await puppeteer.launch({
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
        });

        const page = await browser.newPage();
        
        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        const fullUrl = `https://www.imdb.com${url}`;
        
        console.log(`Navigating to: ${fullUrl}`);
        
        await page.goto(fullUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if we got a challenge page
        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        if (pageTitle.includes('Access Denied') || pageTitle.includes('Security Challenge')) {
            throw new Error('IMDb blocked the request with challenge page');
        }

        // Extract movie information
        const movieInfo = await page.evaluate(() => {
            const ratingElement = document.querySelector('div[data-testid="hero-rating-bar__aggregate-rating__score"] span');
            const plotElement = document.querySelector('span[data-testid="plot-xs_to_m"]');
            
            return {
                rating: ratingElement ? ratingElement.textContent?.trim() : '',
                text: plotElement ? plotElement.textContent?.trim() : ''
            };
        });

        console.log('Extracted movie info:', movieInfo);
        return movieInfo;

    } catch (error) {
        console.error('Error in imdb_info:', error.message);
        return {
            rating: '',
            text: ''
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function imdb(moviename) {
    const res_obj = {};
    
    try {
        console.log(`=== Starting IMDb search for: ${moviename} ===`);
        
        let imdb_res_titles = await imdb_find_titles(moviename);

        // Movie title not found
        if (imdb_res_titles.length < 1) {
            res_obj['status'] = 404;
            res_obj['title'] = moviename;
            res_obj['error'] = 'No titles found';
            return res_obj;
        }

        let imdb_res = await imdb_info(imdb_res_titles[0]['href']);
        
        res_obj['status'] = 200;
        res_obj['title'] = imdb_res_titles[0]['name'];
        res_obj['url'] = `https://www.imdb.com${imdb_res_titles[0]['href']}`;
        res_obj['rating'] = imdb_res['rating'];
        res_obj['text'] = imdb_res['text'];
        res_obj['titles_found'] = imdb_res_titles.length;
        res_obj['all_titles'] = imdb_res_titles;

        console.log(`=== Success! Found movie: ${res_obj['title']} ===`);
        return res_obj;

    } catch (error) {
        console.error('Error in imdb:', error.message);
        res_obj['status'] = 500;
        res_obj['title'] = moviename;
        res_obj['error'] = error.message;
        return res_obj;
    }
}

module.exports = {
    imdb_find_titles,
    imdb_info,
    imdb
};