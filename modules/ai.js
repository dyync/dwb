const axios = require('axios')

async function vllm(req_prompt) {
    const mainconfig = {
        method: 'post',
        url: 'https://nai9.com/api',
        data: {
            method: 'vllm',
            prompt: req_prompt
        },
        headers: {
            'Content-Type': 'application/json'
        }
    }
    let vllm_res_obj = {}
    try {
        const response = await axios(mainconfig)
        vllm_res_obj['status'] = 200;
        vllm_res_obj['question'] = req_prompt
        vllm_res_obj['answer'] = response.data
        return vllm_res_obj
    } catch (error) {
        console.log(`error ${error}`)
        vllm_res_obj['status'] = 500;
        vllm_res_obj['question'] = req_prompt;
        vllm_res_obj['answer'] = `error`
        return vllm_res_obj;
    }
}

async function image(req_prompt) {
    const mainconfig = {
        method: 'post',
        url: 'https://nai9.com/api',
        data: {
            method: 'image',
            prompt: req_prompt
        },
        headers: {
            'Content-Type': 'application/json'
        }
    }
    let vllm_res_obj = {}
    try {
        const response = await axios(mainconfig)
        vllm_res_obj['status'] = 200
        vllm_res_obj['question'] = req_prompt
        vllm_res_obj['answer'] = response.data
        return vllm_res_obj
    } catch (error) {
        console.log(`error ${error}`)
        vllm_res_obj['status'] = 500;
        vllm_res_obj['question'] = req_prompt;
        vllm_res_obj['answer'] = `error`
        console.log(`hmkbbbbbbb`)
        return vllm_res_obj;
    }
}

module.exports = {
    vllm,
    image
}
