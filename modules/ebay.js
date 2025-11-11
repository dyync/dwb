const axios = require("axios");
const cheerio = require("cheerio");
const config_data = require('../config.js');

async function ebay_first_page(item) {
  let found_prices = [];
  try {
    let item_no_space = item.replaceAll(" ","+");
    
    var imdb_config = {
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.5',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept-encoding': 'gzip, deflate, br',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'upgrade-insecure-requests': '1'
        },
        method: 'get',
        url: `https://www.ebay.${config_data["tld"]}/sch/i.html?_nkw=${item_no_space}&_sacat=0&LH_Complete=1&LH_Sold=1`,
        timeout: 10000
    };  
    
    return axios(imdb_config)
        .then(async function(response) {
            // Check if we got a challenge page instead of actual results
            if (response.data.includes('Pardon Our Interruption') || 
                response.data.includes('splashui/challenge') ||
                response.data.includes('bot detection')) {
                console.log('eBay challenge page detected - request blocked');
                return found_prices;
            }
            
            console.log(`Successfully fetched eBay page`);
            const $ = cheerio.load(response.data);
            
            // Debug: Save HTML to file for inspection
            // const fs = require('fs');
            // fs.writeFileSync('debug_ebay.html', response.data);
            // console.log('HTML saved to debug_ebay.html for inspection');
            
            // Try multiple possible selectors for eBay price elements
            const priceSelectors = [
                '.s-card__price'
            ];
            
            console.log('Searching for prices with selectors...');
            
            for (const selector of priceSelectors) {
                const priceElements = $(selector);
                console.log(`Selector "${selector}" found ${priceElements.length} elements`);
                
                priceElements.each(function (i, element) {
                    let priceText = $(element).text().trim();
                    if (priceText && priceText !== '') {
                        console.log(`Found price text: "${priceText}"`);
                        
                        // Extract the first price if there's a range (e.g., "$100.00 to $200.00")
                        if (priceText.toLowerCase().includes(' to ')) {
                            priceText = priceText.split(' to ')[0];
                        }
                        
                        // Clean and convert price
                        let cleanedPrice = priceText.replace(/[^\d.,]/g, '');
                        cleanedPrice = cleanedPrice.replace(',', '.');
                        
                        // Handle currency symbols and format
                        const priceMatch = priceText.match(/(\d+[.,]\d+|\d+)/);
                        if (priceMatch) {
                            let priceValue = priceMatch[0].replace(',', '.');
                            let formattedPrice = parseFloat(priceValue);
                            
                            if (!isNaN(formattedPrice) && formattedPrice > 0) {
                                // If price seems too low (likely in cents), convert to dollars
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
            
            // Alternative approach: Look for li elements with specific classes
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
                            
                            // Extract numeric price
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
            return found_prices;
        })
        .catch(function(error) {
            console.log('Axios request failed:', error.message);
            return found_prices;
        });
  } catch (err) {
    console.error('Error in ebay_first_page:', err);
    return found_prices;
  } 
}

async function ebay(item) {
    const ebay_currency = config_data["currency_symbol"] || "$";
    const item_no_space = item.replaceAll(" ","+");
    const res_obj = {};
    let ebay_res_prices = await ebay_first_page(item);
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