const puppeteer = require('puppeteer');
const config_data = require('../config.js');

async function ebay(item) {
    let browser;
    const res_obj = {};

    try {
        console.log(`=== Starting eBay search for: ${item} ===`);
        
        browser = await puppeteer.launch({
            headless: true, // Run in headless mode
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

        const item_no_space = item.replaceAll(" ", "+");
        const url = `https://www.ebay.com/sch/i.html?_nkw=${item_no_space}&_sacat=0&LH_Complete=1&LH_Sold=1`;
        
        console.log(`Navigating to: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for content to load - FIXED: Use waitForTimeout replacement
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if we got a challenge page
        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        if (pageTitle.includes('Access Denied') || pageTitle.includes('Security Challenge')) {
            throw new Error('eBay blocked the request with challenge page');
        }

        // Debug: Save HTML to see what we're working with
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync('ebay-debug.html', html);
        console.log('HTML saved to ebay-debug.html');

        // Wait for price elements to be visible - ADDED: Better waiting for dynamic content
        try {
            await page.waitForSelector('.s-item__price, .s-card__price', { timeout: 10000 });
        } catch (e) {
            console.log('Price selector not found within timeout, continuing anyway...');
        }

        // Extract prices using the exact selector you found
        const prices = await page.evaluate(() => {
            const results = [];
            
            // Try multiple selectors
            const selectors = [
                '.s-card__price'
            ];

            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                console.log(`Selector ${selector} found:`, elements.length);
                
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.includes('$')) {
                        const match = text.match(/\$?(\d+[,.]?\d*\.?\d*)/);
                        if (match) {
                            let price = parseFloat(match[1].replace(',', ''));
                            if (!isNaN(price)) {
                                results.push({
                                    price: price,
                                    text: text,
                                    selector: selector
                                });
                            }
                        }
                    }
                });
                
                if (results.length > 0) break; // Use first working selector
            }
            
            return results;
        });

        console.log('Found price objects:', prices);

        let found_prices = prices.map(p => p.price).filter(price => price > 0);
        console.log('Raw prices found:', found_prices);

        if (found_prices.length === 0) {
            res_obj['status'] = 404;
            res_obj['item'] = item;
            res_obj['error'] = 'No prices found - check ebay-debug.html';
            return res_obj;
        }

        // Remove duplicates and sort
        found_prices = [...new Set(found_prices)].sort((a, b) => a - b);
        console.log('Unique sorted prices:', found_prices);

        // Your existing price processing
        const average = found_prices.reduce((a, b) => a + b, 0) / found_prices.length;
        const average_fixed = average.toFixed(2);
        const sorted = [...found_prices].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const q_interval = q3 - q1;
        const filtered_arr = found_prices.filter(n => n >= q1 - 0.5 * q_interval && n <= q3 + 0.5 * q_interval);
        const filtered_avg = filtered_arr.reduce((a, b) => a + b, 0) / filtered_arr.length;
        const filtered_avg_fixed = filtered_avg.toFixed(2);
        
        res_obj['status'] = 200;
        res_obj['item'] = item;
        res_obj['min_price'] = filtered_arr[0].toFixed(2);
        res_obj['max_price'] = filtered_arr[filtered_arr.length - 1].toFixed(2);
        res_obj['avg_price'] = average_fixed;
        res_obj['avg_price_filtered'] = filtered_avg_fixed;
        res_obj['tld'] = config_data.tld || 'com';
        res_obj['currency'] = config_data.currency_symbol || "$";
        res_obj['url'] = url;
        res_obj['prices_found'] = found_prices.length;
        res_obj['all_prices'] = found_prices;

        console.log(`=== Success! Found ${found_prices.length} prices ===`);
        return res_obj;

    } catch (error) {
        console.error('Error:', error.message);
        res_obj['status'] = 500;
        res_obj['item'] = item;
        res_obj['error'] = error.message;
        return res_obj;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { ebay };