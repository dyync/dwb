const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const config_data = require('../config.js');

// Add stealth plugin
puppeteer.use(StealthPlugin());

async function ebay(item) {
    const browser = await puppeteer.launch({
        headless: false, // Set to true in production
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const ebay_currency = config_data.currency_symbol || "$";
    const item_no_space = item.replaceAll(" ", "+");
    const res_obj = {};

    try {
        console.log(`=== Starting eBay search for: ${item} ===`);
        
        const url = `https://www.ebay.com/sch/i.html?_nkw=${item_no_space}&_sacat=0&LH_Complete=1&LH_Sold=1`;
        console.log(`Navigating to: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });

        // Wait for page to load
        await page.waitForTimeout(5000);

        // Debug: Check what page content we have
        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        const pageContent = await page.content();
        console.log('Page includes "s-card__price":', pageContent.includes('s-card__price'));
        console.log('Page includes "s-item":', pageContent.includes('s-item'));

        // Take a screenshot to see what we're getting
        await page.screenshot({ path: 'debug-page.png' });
        console.log('Screenshot saved as debug-page.png');

        // Try multiple selectors for the price
        const priceSelectors = [
            '.s-card__price',
            '.s-item .s-item__price',
            '[class*="price"]',
            '.srp-results .s-item__price'
        ];

        let found_prices = [];

        for (const selector of priceSelectors) {
            console.log(`Trying selector: "${selector}"`);
            
            const elements = await page.$$(selector);
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            
            for (const element of elements) {
                try {
                    const text = await page.evaluate(el => el.textContent?.trim(), element);
                    console.log(`Found text: "${text}"`);
                    
                    if (text) {
                        const price = parsePrice(text);
                        if (price && price > 0) {
                            found_prices.push(price);
                            console.log(`✅ Added price: $${price}`);
                        }
                    }
                } catch (e) {
                    // Continue with next element
                }
            }
            
            if (found_prices.length > 0) break; // Stop if we found prices
        }

        // If still no prices, try a more generic approach
        if (found_prices.length === 0) {
            console.log('Trying generic price search...');
            const allElements = await page.$$('[class*="price"], [class*="Price"]');
            console.log(`Found ${allElements.length} price-like elements`);
            
            for (const element of allElements) {
                try {
                    const text = await page.evaluate(el => el.textContent?.trim(), element);
                    if (text && text.includes('$')) {
                        console.log(`Price-like element: "${text}"`);
                        const price = parsePrice(text);
                        if (price && price > 0) {
                            found_prices.push(price);
                            console.log(`✅ Added price: $${price}`);
                        }
                    }
                } catch (e) {
                    // Continue
                }
            }
        }

        console.log(`Total prices found: ${found_prices.length}`);
        console.log('Prices:', found_prices);

        // Process results
        found_prices = found_prices.filter(value => 
            !isNaN(value) && value > 0 && typeof value === 'number'
        );

        found_prices = [...new Set(found_prices)].sort((a, b) => a - b);

        if (found_prices.length < 1) {
            res_obj['status'] = 404;
            res_obj['item'] = item;
            res_obj['error'] = 'No prices found - check debug-page.png for what was loaded';
            return res_obj;
        }
        
        // Your existing price processing logic
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
        res_obj['tld'] = config_data.tld;
        res_obj['currency'] = ebay_currency;
        res_obj['url'] = url;
        res_obj['prices_found'] = found_prices.length;
        res_obj['all_prices'] = found_prices;

        console.log(`=== eBay search completed for: ${item} ===`);
        return res_obj;

    } catch (error) {
        console.error('Error:', error);
        res_obj['status'] = 500;
        res_obj['item'] = item;
        res_obj['error'] = error.message;
        return res_obj;
    } finally {
        await browser.close();
    }
}

function parsePrice(priceText) {
    try {
        console.log(`Parsing price text: "${priceText}"`);
        
        // Handle price ranges
        let cleanText = priceText.split(' to ')[0];
        
        // Extract numeric value - match numbers with decimals
        const priceMatch = cleanText.match(/\$?(\d+\.?\d*)/);
        if (priceMatch) {
            let priceValue = priceMatch[1];
            let formattedPrice = parseFloat(priceValue);
            
            console.log(`Parsed value: ${formattedPrice}`);
            
            if (!isNaN(formattedPrice)) {
                // If price seems too low for an item, it might be in cents
                if (formattedPrice < 10 && priceText.includes('$')) {
                    formattedPrice = formattedPrice * 100;
                    console.log(`Converted to dollars: $${formattedPrice}`);
                }
                return formattedPrice;
            }
        }
    } catch (error) {
        console.log('Error parsing price:', error.message);
    }
    return null;
}

module.exports = { ebay };