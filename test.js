const axios = require("axios");
const cheerio = require("cheerio");
const config_data = require('config.js');


var item = `davidoff`
console.log(`item: ${item}`)
item_no_space = item.replaceAll(" ","+")
console.log(`item_no_space: ${item_no_space}`)
res_obj = {}
try {
    const response = await axios({
    headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.3'
    },
    method: 'get',
    url: `https://www.ebay.${config_data.lang}/sch/i.html?_nkw=${item_no_space}`
    })
        .then(async function(response) {
        console.log(`response: ${response}`)
        const $ = cheerio.load(response.data)
        $('ul[class="srp-results srp-list clearfix"] li').each(function (i, element) {  
            let li_price = $(element).find('span[class="s-item__price"]').text().trim()
            if(!li_price == '') {
            price_comma_to_point = li_price.replace(',','.')
            formatted_price = Number(price_comma_to_point.replace(/[^0-9\.]+/g,""))
            found_prices.push(formatted_price)
            }           
        })  

        if(found_prices.length < 1) {
            $('ul[class="srp-results srp-grid clearfix"] li').each(function (i, element) {  
                let li_price = $(element).find('span[class="s-item__price"]').text().trim()
                if(!li_price == '') {
                price_comma_to_point = li_price.replace(',','.')  
                formatted_price = Number(price_comma_to_point.replace(/[^0-9\.]+/g,""))
                found_prices.push(formatted_price)
                }           
            })  
        }
    })

} catch (error) {
    console.error(error);
}