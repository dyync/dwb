const { chromium } = require('playwright');
const userAgents = require('user-agents');
const { setTimeout } = require('timers/promises');
const config_data = require('../config.js')
const maxRetries = 3

class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requestTimestamps = [];
    }

    async wait() {
        const now = Date.now();
        
        // Remove old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(
            ts => now - ts < this.timeWindow
        );

        if (this.requestTimestamps.length >= this.maxRequests) {
            const oldestRequest = this.requestTimestamps[0];
            const timeToWait = this.timeWindow - (now - oldestRequest);
            console.log(`Rate limit reached. Waiting ${Math.ceil(timeToWait/1000)} seconds...`);
            await setTimeout(timeToWait);
            return this.wait(); // Recursively check again after waiting
        }

        this.requestTimestamps.push(now);
    }
}

// Create a rate limiter: max 5 requests per 5 minutes (300000 ms)
const rateLimiter = new RateLimiter(5, 300000);

async function ebay(query) {
    const browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
    });
    
    try {
        // Rotate user agents and other fingerprinting attributes
        const userAgent = new userAgents({ deviceCategory: 'desktop' });
        const context = await browser.newContext({
            userAgent: userAgent.toString(),
            viewport: { 
                width: 1280 + Math.floor(Math.random() * 200), 
                height: 720 + Math.floor(Math.random() * 200) 
            },
            locale: 'en-US',
            permissions: [],
            geolocation: { 
                longitude: -122.08 + (Math.random() * 0.1 - 0.05),
                latitude: 37.39 + (Math.random() * 0.1 - 0.05)
            },
            timezoneId: 'America/Los_Angeles',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });

        // Add the mouse movement randomization to the context
        await context.addInitScript(() => {
            const originalFunc = window.MouseEvent.prototype.constructor;
            window.MouseEvent.prototype.constructor = function(type, init) {
                if (init) {
                    init.screenX += (Math.random() * 10 - 5);
                    init.screenY += (Math.random() * 10 - 5);
                    init.clientX += (Math.random() * 10 - 5);
                    init.clientY += (Math.random() * 10 - 5);
                }
                return originalFunc.call(this, type, init);
            };
        });

        const page = await context.newPage();
        
        // Set more realistic headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': Math.random() > 0.5 ? '1' : '0',
            'Upgrade-Insecure-Requests': '1'
        });

        // Scrape regular listings
        const regularUrl = `https://www.ebay.${config_data.tld}/sch/i.html?_nkw=${encodeURIComponent(query)}`;
        await rateLimiter.wait();
        const regularResults = await getPage(page, regularUrl, maxRetries);
        
        // Add delay between requests
        await setTimeout(30000 + Math.random() * 30000); // 30-60 seconds delay

        // Scrape sold listings
        const soldUrl = `https://www.ebay.${config_data.tld}/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1`;
        await rateLimiter.wait();
        const soldResults = await getPage(page, soldUrl, maxRetries);

        return {
            regularListings: regularResults,
            soldListings: soldResults
        };
    } finally {
        await browser.close();
    }
}

async function getPage(page, url, maxRetries, currentAttempt = 1) {
    try {
        console.log(`Navigating to: ${url} (Attempt ${currentAttempt})`);
        
        // Random delay before navigation (1-5 seconds)
        await setTimeout(1000 + Math.random() * 4000);
        
        // Randomize navigation patterns
        if (Math.random() > 0.5) {
            await page.goto('https://www.google.com/', { waitUntil: 'domcontentloaded', timeout: 10000 });
            await setTimeout(1000 + Math.random() * 3000);
        }

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Check for blocking mechanisms
        if (await page.$('#captcha-container') || 
            await page.$('text=/access denied/i') || 
            await page.$('text=/robot/i') ||
            await page.$('text=/verify/i')) {
            throw new Error('Blocking detected (CAPTCHA or access denied)');
        }

        // Random scroll behavior
        await scrollPage(page);

        // Wait for items with some randomness
        const waitTime = 5000 + Math.random() * 10000;
        await page.waitForSelector('.s-item__wrapper', { timeout: waitTime });

        const listings = await page.$$eval('.s-item__wrapper', (items) => {
            return items.map(item => {
                const title = item.querySelector('.s-item__title')?.textContent?.trim() || 'N/A';
                const price = item.querySelector('.s-item__price')?.textContent?.trim() || 'N/A';
                const shipping = item.querySelector('.s-item__shipping')?.textContent?.trim() || 'Free shipping';
                const link = item.querySelector('.s-item__link')?.href || 'N/A';
                const soldDate = item.querySelector('.s-item__ended-date')?.textContent?.trim() || null;
                const bids = item.querySelector('.s-item__bids')?.textContent?.trim() || null;
                
                return {
                    title,
                    price,
                    shipping,
                    link,
                    soldDate,
                    bids
                };
            }).filter(item => item.title !== 'N/A' && !item.title.includes('Shop on eBay'));
        });

        return listings;
    } catch (error) {
        console.error(`Error on attempt ${currentAttempt}: ${error.message}`);
        
        if (currentAttempt < maxRetries) {
            const delay = Math.pow(2, currentAttempt) * 1000 + Math.random() * 5000;
            console.log(`Retrying in ${Math.ceil(delay/1000)} seconds...`);
            await setTimeout(delay);
            return getPage(page, url, maxRetries, currentAttempt + 1);
        }
        
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
    }
}

// Helper function to simulate human-like scrolling
async function scrollPage(page) {
    const scrollSteps = 5 + Math.floor(Math.random() * 10);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    for (let i = 0; i < scrollSteps; i++) {
        const scrollDistance = viewportHeight * (0.5 + Math.random());
        await page.evaluate((distance) => {
            window.scrollBy({
                top: distance,
                behavior: 'smooth'
            });
        }, scrollDistance);
        
        // Random delay between scrolls
        await setTimeout(500 + Math.random() * 1500);
    }
}



module.exports = {
    ebay
}