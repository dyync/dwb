const axios = require("axios");
const cheerio = require("cheerio");
const config_data = require('../config.js');

// Rotating User Agents
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getRandomDelay(min = 2000, max = 5000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEbayHeaders() {
    const userAgent = getRandomUserAgent();
    
    return {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': userAgent,
        'accept-encoding': 'gzip, deflate, br'
    };
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ebay_first_page(item) {
    let found_prices = [];
    try {
        let item_no_space = item.replaceAll(" ","+");
        
        // Add random delay between requests
        await delay(getRandomDelay(1000, 3000));
        
        const ebay_config = {
            headers: createEbayHeaders(),
            method: 'get',
            url: `https://www.ebay.${config_data["tld"]}/sch/i.html?_nkw=${item_no_space}&_sacat=0&LH_Complete=1&LH_Sold=1`,
            timeout: 15000,
            withCredentials: true,
            decompress: true
        };  
        
        return axios(ebay_config)
            .then(async function(response) {
                if (response.data.includes('Pardon Our Interruption') || 
                    response.data.includes('splashui/challenge') ||
                    response.data.includes('bot detection') ||
                    response.data.includes('cf-browser-verification') ||
                    response.data.includes('403 Forbidden') ||
                    response.status === 403) {
                    console.log('eBay challenge page detected - request blocked');
                    return { blocked: true, prices: found_prices };
                }
                
                console.log(`Successfully fetched eBay page`);
                const $ = cheerio.load(response.data);
                
                // Your existing price extraction logic
                const priceSelectors = [
                    '.s-card__price',
                    '.srp-results .s-item__price',
                    '[class*="price"]',
                    '.s-item__details .s-item__price'
                ];
                
                console.log('Searching for prices with selectors...');
                
                for (const selector of priceSelectors) {
                    const priceElements = $(selector);
                    console.log(`Selector "${selector}" found ${priceElements.length} elements`);
                    
                    priceElements.each(function (i, element) {
                        let priceText = $(element).text().trim();
                        if (priceText && priceText !== '') {
                            console.log(`Found price text: "${priceText}"`);
                            
                            if (priceText.toLowerCase().includes(' to ')) {
                                priceText = priceText.split(' to ')[0];
                            }
                            
                            let cleanedPrice = priceText.replace(/[^\d.,]/g, '');
                            cleanedPrice = cleanedPrice.replace(',', '.');
                            
                            const priceMatch = priceText.match(/(\d+[.,]\d+|\d+)/);
                            if (priceMatch) {
                                let priceValue = priceMatch[0].replace(',', '.');
                                let formattedPrice = parseFloat(priceValue);
                                
                                if (!isNaN(formattedPrice) && formattedPrice > 0) {
                                    if (formattedPrice < 10 && priceText.includes(config_data["currency_symbol"] || "$")) {
                                        formattedPrice = formattedPrice * 100;
                                    }
                                    
                                    found_prices.push(formattedPrice);
                                    console.log(`Added price: $${formattedPrice}`);
                                }
                            }
                        }
                    });
                }
                
                const itemSelectors = [
                    'li.s-item',
                    '.srp-results li',
                    '[data-viewport*="item"]',
                    '.s-item__wrapper'
                ];
                
                for (const selector of itemSelectors) {
                    $(selector).each(function (i, element) {
                        const priceElement = $(element).find('.s-item__price');
                        if (priceElement.length) {
                            let priceText = priceElement.first().text().trim();
                            if (priceText) {
                                console.log(`Item price: "${priceText}"`);
                                
                                const priceMatch = priceText.match(/(\d+[.,]\d+|\d+)/);
                                if (priceMatch) {
                                    let priceValue = priceMatch[0].replace(',', '.');
                                    let formattedPrice = parseFloat(priceValue);
                                    
                                    if (!isNaN(formattedPrice) && formattedPrice > 0) {
                                        if (formattedPrice < 10 && priceText.includes(config_data["currency_symbol"] || "$")) {
                                            formattedPrice = formattedPrice * 100;
                                        }
                                        found_prices.push(formattedPrice);
                                    }
                                }
                            }
                        }
                    });
                }
                
                console.log(`Total prices found: ${found_prices.length}`);
                return { blocked: false, prices: found_prices };
            })
            .catch(function(error) {
                console.log('Axios request failed:', error.message);
                if (error.response && error.response.status === 403) {
                    return { blocked: true, prices: found_prices };
                }
                return { blocked: false, prices: found_prices };
            });
    } catch (err) {
        console.error('Error in ebay_first_page:', err);
        return { blocked: false, prices: found_prices };
    } 
}

async function ebay_first_page_with_retry(item, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Attempt ${attempt} for item: ${item}`);
        
        const result = await ebay_first_page(item);
        
        if (!result.blocked) {
            return result.prices;
        }
        
        if (attempt < maxRetries) {
            const retryDelay = getRandomDelay(5000, 15000);
            console.log(`Challenge detected. Waiting ${retryDelay}ms before retry...`);
            await delay(retryDelay);
        }
    }
    
    console.log(`All attempts blocked for item: ${item}`);
    return [];
}

async function ebay(item) {
    const ebay_currency = config_data["currency_symbol"] || "$";
    const item_no_space = item.replaceAll(" ","+");
    const res_obj = {};
    
    let ebay_res_prices = await ebay_first_page_with_retry(item);
    
    ebay_res_prices = ebay_res_prices.filter(value => 
        !isNaN(value) && value > 0 && typeof value === 'number'
    )

    ebay_res_prices = [...new Set(ebay_res_prices)].sort((a, b) => a - b);

    console.log(`ebay_res_prices:`, ebay_res_prices)

    if(ebay_res_prices.length < 1) {
        res_obj['status'] = 404
        res_obj['item'] = item
        res_obj['error'] = 'No prices found - may need to update selectors'
        return res_obj
    }
    
    const ebay_res_prices_average = ebay_res_prices.reduce((a, b) => a + b, 0) / ebay_res_prices.length
    const ebay_res_prices_average_fixed = ebay_res_prices_average.toFixed(2)
    const ebay_res_prices_asc = [...ebay_res_prices].sort((a, b) => a - b)
    const ebay_res_prices_q1 = ebay_res_prices_asc[Math.floor(ebay_res_prices_asc.length * 0.25)]
    const ebay_res_prices_q3 = ebay_res_prices_asc[Math.floor(ebay_res_prices_asc.length * 0.75)]
    const ebay_res_prices_q_interval = ebay_res_prices_q3 - ebay_res_prices_q1
    const ebay_res_prices_filtered_arr = ebay_res_prices.filter(n => n >= ebay_res_prices_q1 - 0.5 * ebay_res_prices_q_interval && n <= ebay_res_prices_q3 + 0.5 * ebay_res_prices_q_interval)
    const ebay_res_prices_filtered_avg = ebay_res_prices_filtered_arr.reduce((a, b) => a + b, 0) / ebay_res_prices_filtered_arr.length
    const ebay_res_prices_filtered_avg_fixed = ebay_res_prices_filtered_avg.toFixed(2);
    console.log(`ebay_res_prices_filtered_arr:`, ebay_res_prices_filtered_arr)
    res_obj['status'] = 200
    res_obj['item'] = item
    res_obj['min_price'] = ebay_res_prices_filtered_arr[0].toFixed(2)
    res_obj['max_price'] = ebay_res_prices_filtered_arr[ebay_res_prices_filtered_arr.length - 1].toFixed(2)
    res_obj['avg_price'] = ebay_res_prices_average_fixed
    res_obj['avg_price_filtered'] = ebay_res_prices_filtered_avg_fixed
    res_obj['tld'] = config_data["tld"]
    res_obj['currency'] = ebay_currency
    res_obj['url'] = `https://www.ebay.${config_data["tld"]}/sch/i.html?_nkw=${item_no_space}&_sacat=0&LH_Complete=1&LH_Sold=1`
    res_obj['prices_found'] = ebay_res_prices.length
    res_obj['all_prices'] = ebay_res_prices

    return res_obj
}

module.exports = {
    ebay
}