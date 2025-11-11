const axios = require('axios')
const config_data = require('../config.js')
const char_maps = require('../utils.js')

ebay_headers = {
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
}
async function wiki(word) {

    word = word.replace(/[äÄöÖüÜß]/g, u => char_maps["utf8"][u])

    var ebay_config = {
        headers: ebay_headers,
        method: 'get',
        url: `https://${config_data.lang}.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${word}`
    }

    return axios(ebay_config)
        .then(async function(response) {
            let data = response.data
            dataNum = Object.keys(data.query.pages)[0]
            let data_extract = data.query.pages[dataNum].extract
            return data_extract.substring(0,300)
        })
        .catch(function(error) {
            return console.log('[!wiki] error: ' + error)
        })
}

async function enwiki(word) {

    word = word.replace(/[äÄöÖüÜß]/g, u => char_maps["utf8"][u])

    var ebay_config = {
        headers: ebay_headers,
        method: 'get',
        url: `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${word}`
    }

    return axios(ebay_config)
        .then(async function(response) {
            let data = response.data
            dataNum = Object.keys(data.query.pages)[0]
            let data_extract = data.query.pages[dataNum].extract
            return data_extract.substring(0,300)
        })
        .catch(function(error) {
            return console.log('[!wiki] error: ' + error)
        })
}
async function rnwiki(retries = 3) {

    var mainconfig = {
        headers: ebay_headers,
        method: 'get',
        url: `https://${config_data.lang}.wikipedia.org/w/api.php?format=json&action=query&generator=random&grnnamespace=0&prop=extracts&exintro&explaintext&redirects=1`
    }

    return axios(mainconfig)
        .then(function(response) {
            let data = response.data
            let pages = data.query.pages
            let firstPageId = Object.keys(pages)[0]
            let content = pages[firstPageId].extract || ''
            const words = content.split(' ').filter(word => word.length > 0)
            const wordCount = Math.floor(Math.random() * (7 - 3 + 1)) + 3
            const maxStartIndex = Math.max(0, words.length - wordCount)
            const startIndex = Math.floor(Math.random() * (maxStartIndex + 1))
            const sliceWords = words.slice(startIndex, startIndex + wordCount)

            if (sliceWords.length === 0 || sliceWords.join(' ').trim().length === 0) {
                throw new Error('Empty word slice')
            }
            
            return sliceWords.join(' ')
        })
        .catch(function(error) {
            if (retries > 0) {
                console.log(`[!randomArticleLength] error: ${error}. Retries left: ${retries}`)
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(makeRequestWithRetry(retries - 1))
                    }, 1000)
                })
            } else {
                console.log('[!randomArticleLength] final error: ' + error)
                return `${error}`
            }
        })
}

module.exports = {
    wiki,
    enwiki,
    rnwiki
}