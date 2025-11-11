const axios = require("axios");
const cheerio = require("cheerio");
const config_data = require('../config.js');

async function ebay_first_page(item) {
  let found_prices = []
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
    }
    return axios(imdb_config)
        .then(async function(response) {
            if (response.data.includes('Pardon Our Interruption') || 
                response.data.includes('splashui/challenge') ||
                response.data.includes('bot detection')) {
                console.log('eBay challenge page detected - request blocked')
                return found_prices
            }
            const $ = cheerio.load(response.data)
            const priceSelectors = [
                '.s-item__price',
                '.srp-results .s-item__price',
                '[class*="price"]',
                '.s-item__details .s-item__price'
            ]
            for (const selector of priceSelectors) {
                const priceElements = $(selector)
                priceElements.each(function (i, element) {
                    let priceText = $(element).text().trim()
                    if (priceText && priceText !== '') {
                        if (priceText.toLowerCase().includes(' to ')) {
                            priceText = priceText.split(' to ')[0]
                        }
                        let cleanedPrice = priceText.replace(/[^\d.,]/g, '')
                        cleanedPrice = cleanedPrice.replace(',', '.')
                        
                        const priceMatch = priceText.match(/(\d+[.,]\d+|\d+)/)
                        if (priceMatch) {
                            let priceValue = priceMatch[0].replace(',', '.')
                            let formattedPrice = parseFloat(priceValue)
                            
                            if (!isNaN(formattedPrice) && formattedPrice > 0) {

                                if (formattedPrice < 10 && priceText.includes(config_data["currency_symbol"] || "$")) {
                                    formattedPrice = formattedPrice * 100
                                }
                                found_prices.push(formattedPrice)
                            }
                        }
                    }
                })
            }
            const itemSelectors = [
                'li.s-item',
                '.srp-results li',
                '[data-viewport*="item"]',
                '.s-item__wrapper'
            ]
            for (const selector of itemSelectors) {
                $(selector).each(function (i, element) {
                    const priceElement = $(element).find('.s-item__price')
                    if (priceElement.length) {
                        let priceText = priceElement.first().text().trim()
                        if (priceText) {
                            const priceMatch = priceText.match(/(\d+[.,]\d+|\d+)/)
                            if (priceMatch) {
                                let priceValue = priceMatch[0].replace(',', '.')
                                let formattedPrice = parseFloat(priceValue)
                                if (!isNaN(formattedPrice) && formattedPrice > 0) {
                                    if (formattedPrice < 10 && priceText.includes(config_data["currency_symbol"] || "$")) {
                                        formattedPrice = formattedPrice * 100;
                                    }
                                    found_prices.push(formattedPrice);
                                }
                            }
                        }
                    }
                })
            }
            return found_prices
        })
        .catch(function(err) {
            console.log(`[ebay] req err: ${err}`)
            return found_prices
        })
  } catch (err) {
    console.log(`[ebay] fn err: ${err}`)
    return found_prices
  } 
}

async function ebay(item) {
    const ebay_currency = config_data["currency_symbol"] || "$"
    const item_no_space = item.replaceAll(" ","+")
    const res_obj = {}
    let ebay_res_prices = await ebay_first_page(item)
    ebay_res_prices = ebay_res_prices.filter(value => 
        !isNaN(value) && value > 0 && typeof value === 'number'
    )
    ebay_res_prices = [...new Set(ebay_res_prices)].sort((a, b) => a - b)
    if(ebay_res_prices.length < 1) {
        res_obj['status'] = 404
        res_obj['item'] = item
        res_obj['error'] = 'No prices found - may need to update selectors'
        return res_obj
    }
    
    const ebay_res_prices_average = ebay_res_prices.reduce((a, b) => a + b, 0) / ebay_res_prices.length
    const ebay_res_prices_average_fixed = ebay_res_prices_average.toFixed(2)
    const mean = ebay_res_prices.reduce((a, b) => a + b, 0) / ebay_res_prices.length
    const stdDev = Math.sqrt(ebay_res_prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / ebay_res_prices.length)
    const lowerBound = mean - 2 * stdDev
    const upperBound = mean + 2 * stdDev
    const ebay_res_prices_filtered_arr = ebay_res_prices.filter(n => n >= lowerBound && n <= upperBound)
    const ebay_res_prices_filtered_avg = ebay_res_prices_filtered_arr.reduce((a, b) => a + b, 0) / ebay_res_prices_filtered_arr.length
    const ebay_res_prices_filtered_avg_fixed = ebay_res_prices_filtered_avg.toFixed(2);

    res_obj['status'] = 200
    res_obj['item'] = item
    res_obj['min_price'] = ebay_res_prices_filtered_arr[0].toFixed(2)
    res_obj['max_price'] = ebay_res_prices_filtered_arr[-1].toFixed(2)
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