const axios = require('axios')
const char_maps = require('../utils.js')

async function urban(term) {

    term = term.replace(/[äÄöÖüÜß]/g, u => char_maps["utf8"][u])
    term = term.replace(' ','%20')

    var mainconfig = {
        method: 'get',
        url: `https://api.urbandictionary.com/v0/define?term=${term}`
    }

    let urban_res_obj = {}

    try {
        const response = await axios(mainconfig);
        let data = response.data
        
        try {
            for(let u_def_i in data['list']) {
                data['list'][u_def_i]['definition'] = data['list'][u_def_i]['definition'].replace(/[\[\]']+/g,'');
            }
        } catch (urban_replace_err) {
            console.log(`[!urban] urban_replace_err: ${urban_replace_err}`)
        }
        
        urban_res_obj['status'] = 200
        urban_res_obj['term'] = term
        urban_res_obj['defs'] = data['list']
        urban_res_obj['url'] = `https://www.urbandictionary.com/define.php?term=${term}`
        return urban_res_obj
    } catch (error) {
        urban_res_obj['status'] = 404
        urban_res_obj['term'] = term
        urban_res_obj['defs'] = [`No definition found for '${term}'`]
        urban_res_obj['url'] = `https://www.urbandictionary.com/define.php?term=${term}`

        console.log(`[!urban] error: ${error}`);
        return urban_res_obj;
    }
}

module.exports = {
    urban    
}