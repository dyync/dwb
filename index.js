const qrcode = require('qrcode-terminal');
const { Client, LegacySessionAuth, Location, List, Buttons, LocalAuth, RemoteAuth } = require('whatsapp-web.js')
const { MessageMedia } = require('whatsapp-web.js')
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const fs = require('fs')
const os = require('os')
const axios = require('axios')
const translate = require('@vitalets/google-translate-api')
const wetter = require('./modules/wetter')
const mgdb_m = require('./modules/mgdb')
const wiki = require('./modules/wiki')
const quiz = require('./modules/quiz')
const imdb = require('./modules/imdb')
const ebay = require('./modules/ebay')
const ai = require('./modules/ai')
const crypto = require('./modules/crypto')
const urban = require('./modules/urban')
const config_data = require('./config.js')
const char_maps = require('./utils.js')



var networkInterfaces = os.networkInterfaces()
const host_ip = networkInterfaces['eth0'][0]['address']
host_address = `http://${host_ip}:3000`
server_address = `http://${host_ip}:3333`


console.log(`************************`)
console.log(`Language          : ${config_data.lang}`)
console.log(`Currency          : ${config_data.currency}`)
console.log(`api_mongodb       : ${config_data.api_mongodb}`)
console.log(`api_openweather   : ${config_data.api_openweather}`)
console.log(`host_address      : ${host_address}`)
console.log(`server_address    : ${server_address}`)
console.log(`************************`)

//language settings
const default_lang = 'en'
const valid_langs = ['af', 'ak', 'am', 'ar', 'as', 'ay', 'az', 'be', 'bg', 'bho', 'bm', 'bn', 'bs', 'ca', 'ceb', 'ckb', 'co', 'cs', 'cy', 'da', 'de', 'doi', 'dv', 'ee', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'fi', 'fil', 'fr', 'fy', 'ga', 'gd', 'gl', 'gn', 'gom', 'gu', 'ha', 'haw', 'he', 'hi', 'hmn', 'hr', 'ht', 'hu', 'hy', 'id', 'ig', 'ilo', 'is', 'it', 'iw', 'ja', 'jv', 'jw', 'ka', 'kk', 'km', 'kn', 'ko', 'kri', 'ku', 'ky', 'la', 'lb', 'lg', 'ln', 'lo', 'lt', 'lus', 'lv', 'mai', 'mg', 'mi', 'mk', 'ml', 'mn', 'mni-Mtei', 'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'no', 'nso', 'ny', 'om', 'or', 'pa', 'pl', 'ps', 'pt', 'qu', 'ro', 'ru', 'rw', 'sa', 'sd', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'st', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tr', 'ts', 'tt', 'ug', 'uk', 'ur', 'uz', 'vi', 'xh', 'yi', 'yo', 'zh', 'zh-CN', 'zh-TW', 'zu']

var active_quiz = false
var active_quiz_solution = ''
var active_quiz_answers = []
var active_typeracer = false
var active_typeracer_timestamp = 0
var active_typeracer_racers = []

if(config_data.api_mongodb) {
  mongoose.connect(config_data.mongodb).then(() => {
    const store = new MongoStore({ mongoose: mongoose })
  })
}


const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
      executablePath: '/usr/bin/google-chrome-stable',
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox']
  }
})

client.initialize()

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr)
  qrcode.generate(qr, {small: true})
})

client.on('authenticated', () => {
  console.log('AUTHENTICATED')
})

client.on('auth_failure', message => {
  console.log('AUTHENTICATION FAILURE', message)
})

client.on('ready', () => {
  console.log('DYNCOO WHATSAPP BOT ONLINE!')
})


client.on('message', async message => {
  console.log('MESSAGE RECEIVED', message);
  let { t, notifyName, ack, isNewMsg } = message['_data']
  let { body, hasMedia, type, timestamp, from, to, author, deviceType, isForwarded, fromMe, hasQuotedMsg } = message
  if(!isNewMsg) {
    return;
  }
  var command = ''
  if(body.startsWith('.')) {
    command = body.trim().replace('.', '').split(/\s/).shift().toLowerCase()
  }  
  var arg
  if (hasQuotedMsg) {
    arg = message['_data']['quotedMsg']['body']
  } else {
    arg = body.split(' ').length > 1 ? body.trim().substring(body.indexOf(' ') + 1) : ''
  }

  console.log(`*************************`)
  console.log(`body: ${body}`)
  console.log(`command: ${command}`)
  console.log(`arg: ${arg}`)
  console.log(`*************************`)    
  console.log(`t: ${t}`)
  console.log(`notifyName: ${notifyName}`)
  console.log(`ack: ${ack}`)
  console.log(`isNewMsg: ${isNewMsg}`)
  console.log(`*************************`)
  console.log(`hasMedia: ${hasMedia}`)
  console.log(`type: ${type}`)
  console.log(`timestamp: ${timestamp}`)
  console.log(`from: ${from}`)
  console.log(`to: ${to}`)
  console.log(`author: ${author}`)
  console.log(`deviceType: ${deviceType}`)
  console.log(`isForwarded: ${isForwarded}`)
  console.log(`fromMe: ${fromMe}`)
  console.log(`hasQuotedMsg: ${hasQuotedMsg}`)
  console.log(`*************************`)

  async function fn_download(req_link, req_format) {
      console.log(`*************************`)
      console.log(`req_link  : ${req_link}`)
      console.log(`req_format: ${req_format}`)
      console.log(`*************************`)
      try {
          const response = await axios({
              method: 'post',
              url: `${server_address}/download`,
              data: {
                  'link': req_link,
                  'format': req_format
              },
              headers: {
                  'Content-Type': 'application/json'
              }
          })
          return response.data
      } catch (err) {
          console.log(err)
          throw err
      }
  }



  if (message.body === 'Hi') {
      try {
          client.sendMessage(message.from, 'Hello! Bot online :)')
      } catch (err) {
          console.log(err)
      }
  }  

  // cmds
  if (command.startsWith('cmd') || command.startsWith('info') || command.startsWith('help') || command.startsWith('?')) {
    client.sendMessage(message.from, `Commands` 
    + `\n.wiki _<text> wikipedia_`
    + `\n.translate _<text> translate_`
    + `\n.urban _<text> urban dictionairy_`
    + `\n.imdb _<text> IMDb_`
    + `\n.crypto _<token> crypto prices_`
    + `\n.wetter _<stadt> wetter_`
    + `\n.q _quiz_`
    + `\n.r _typeracer_`
    + `\n.casino _casino_`
    + `\n.ebay _<text> ebay_`
    + `\n.ai _<text> ai question_`
    + `\n.img _<text> create image_`
    + `\n.mp3 _<link> yt -> .mp3_`
    + `\n.mp4 _<link> yt -> .mp4_`)
  }

  // ai
  if (command.startsWith('ai') || command.startsWith('vllm') ) {

    if(arg <= 1) {
      return client.sendMessage(message.from, "Use ai like this -> @ai <question>")        
    }

    try {
          const res_ai = await ai.vllm(arg);
          if(res_ai['status'] == 200) {
            return client.sendMessage(message.from, `*AI* result *'${arg}'*` 
                                                    + `\n${res_ai['answer'].trim()}`)
            

          } else {
            return client.sendMessage(message.from, `AI err 500`)
          }
    } catch(err){
        return client.sendMessage(message.from, `AI offline/connection issue ${err}`)
    }
  }

  // image
  if (command.startsWith('image') || command.startsWith('img') || command.startsWith('picture')) {

    if(arg <= 1) {
      return client.sendMessage(message.from, "Use chatgpt like this -> @gpt <question>")        
    }

    try {
      const test2 = await ai.image(arg);
      console.log(`\nTest status: ${test2['status']}`);
      console.log(`\nTest answer: ${test2['answer']}`);
      if(test2['status'] == 200) {
        console.log(`\nresult == 200 returning answer`)
        let media = await MessageMedia.fromUrl(test2['answer'])
        client.sendMessage(message.from, media)
      } else {
        console.log(`\nstatus is not 200 ... meh returning bla image`);
        return client.sendMessage(message.from, "bla image")
      }
    } catch(err){
      return client.sendMessage(message.from, `err nai9_image '${arg}'`)
    }
  }

  // imdb
  if (command.startsWith('imdb') || command.startsWith('movie')) {

    if(arg <= 1) {
      return client.sendMessage(message.from, "Use IMDb like this -> @imdb <movie title>")        
    }

    try {
      let res_imdb_data = await imdb.imdb(arg)
      if(res_imdb_data.status !== 200) {
        if (res_imdb_data.status == 404) {
          return client.sendMessage(message.from, `Movie/Series '${arg}' not found on IMDb (404)`) 
        }
        return client.sendMessage(message.from, "Use IMDb like this -> @imdb <movie title>") 
      }

      client.sendMessage(message.from, `IMDb` 
      + `\n*${res_imdb_data.title}* (${res_imdb_data.rating})`
      + `\n${res_imdb_data.text}`
      + `\n${res_imdb_data.url}`)
    } catch(err){
      return client.sendMessage(message.from, `err getting IMDb for '${arg}'`)
    }
  }

  // ebay
  if (command.startsWith('ebay') || command.startsWith('price') || command.startsWith('eb')) {

    if(arg <= 1) {
      return client.sendMessage(message.from, "Use eBay like this -> @ebay <item>")
    }

    try {
      let res_ebay_data = await ebay.ebay(arg)        
      if(res_ebay_data.status !== 200) {
        if (res_ebay_data.status == 404) {
          return client.sendMessage(message.from, `Item '${arg}' not found on eBay (404)`) 
        }
        return client.sendMessage(message.from, "Use ebay like this -> @ebay <item>") 
      }

      client.sendMessage(message.from, `*eBay(.${res_ebay_data.tld})* sold result *'${res_ebay_data.item}'*` 
      + `\nAverage : *${res_ebay_data.avg_price}${res_ebay_data.currency}*`
      + `\nFiltered: *${res_ebay_data.avg_price_filtered}${res_ebay_data.currency}*`
      + `\nLowest  : ${res_ebay_data.min_price}${res_ebay_data.currency}`
      + `\nHighest : ${res_ebay_data.max_price}${res_ebay_data.currency}`  
      + `\n${res_ebay_data.url}`)
    } catch(err){
      console.log("[@ebay] try catch ERR..." + err)
      return client.sendMessage(message.from, `err getting eBay for '${arg}'`)
    }
  }

  // urban
  if (command.startsWith('urban') || command.startsWith('urban') || command.startsWith('urbandictionary')) {

    if(arg <= 1) {
      return client.sendMessage(message.from, "Use urban dictionary definition like this -> @urban <term>")        
    }

    try {
      let res_urban_data = await urban.urban(arg)
      if(res_urban_data.defs.length > 1) {  
        client.sendMessage(message.from, `*Urban Dictionary* result(s) *'${res_urban_data.term}'*` 
        + `\n1. ${res_urban_data.defs[0]['definition']}`
        + `\n2. ${res_urban_data.defs[1]['definition']}`
        + `\n${res_urban_data.url}`)
      } else {  
        client.sendMessage(message.from, `*Urban Dictionary* result *'${res_urban_data.term}'*` 
        + `\n1. ${res_urban_data.defs[0]['definition']}`
        + `\n${res_urban_data.url}`)
      }
    } catch(err){
      console.log("[@urban] try catch ERR..." + err)
      return client.sendMessage(message.from, `err connecting to Urban Dictionary for '${arg}'`)
    }
  }

  // crypto
  if (command.startsWith('crypto') || command.match('cc')) {

    try {  
      let res_crypto_data = await crypto.getAllCrypto(arg)
      res_str = ''
      for (const [key, value] of Object.entries(res_crypto_data)) {
          res_str += "*" + key + "*: " + value + "\n"
        }
      client.sendMessage(message.from, `crypto (buy price)\n` 
      + res_str)    
    } catch(err){
      console.log("@crypto]  try catch ERR..." + err)
      return client.sendMessage(message.from, `err getting current crypto price`)
    }
  }

  // weather (germany)
  if (command.startsWith('wetter')) {
    const zahl = /^[0-9]./
    const buchstabe = /^[a-zA-Z]./
    if (arg.match(zahl)) {
      var data = await wetter.plzWetter(arg)
    } else if (arg.match(buchstabe)) {
      var data = await wetter.stadtWetter(arg)
    } else {
      client.sendMessage(message.from, 'Stadt ' + arg + ' nicht gefunden')
    }
    if (data == "err") {
        client.sendMessage(message.from, `Stadt/PLZ '${arg}' nicht gefunden!`)
    } else {
        var bedingungen
        await translate(data.current_observation, {to: default_lang}).then(res => {
              bedingungen = res.text
        }).catch(err => {
            client.sendMessage(message.from, `wetter translate err ${err}`)
            console.log("@wetter translate err: " + err)
        })
        client.sendMessage(message.from, `*Wetter für ${data.place}*\n` 
                                    + "\n*Temp:* "+ data.current_temp + " °C"  
                                    + "\n*Bedingungen:* "+ bedingungen
                                    + "\n*Min Temp:* " + data.temp_min + " °C"
                                    + "\n*Max Temp:* " + data.temp_max + " °C"
                                    + "\n*Luftfeuchtigkeit:* " + data.current_humidity + "%" 
                                    + "\n*Windstärke:* " + data.current_wind)
    }
  }

  // translate
  if (command.startsWith('translate') || command.startsWith('tr')) {
      if(hasQuotedMsg) {
        quoted_message = message['_data']['quotedMsg']['body']
        message.body = `${message.body} ${quoted_message}`
      }
      let translate_msg_arr = message.body.toLowerCase().split(" ")
      if(translate_msg_arr.length <= 1) {
        return client.sendMessage(message.from, "Use translate like this -> @tr <from-language> <to-language> <text>")          
      } else if(translate_msg_arr.length > 1 && translate_msg_arr.length <= 2) {
        if(!valid_langs.includes(translate_msg_arr[1])) {
          req_text = translate_msg_arr[1]
          translate(req_text, {to: default_lang}).then(res => {
                client.sendMessage(message.from, res.text)
            }).catch(err => {
                client.sendMessage(message.from, "err translating")
            })
        } else if(valid_langs.includes(translate_msg_arr[1])) {
          return client.sendMessage(message.from, `(1)Please enter text to translate to ${translate_msg_arr[1]}. \n\nUse translate like this -> \n@tr (<from-language> <to-language>) <text>`)
        } else {
          return client.sendMessage(message.from, `err(1) translating. Check @cmds`)
        }
      } else if(translate_msg_arr.length > 2 && translate_msg_arr.length <= 3) {              
        if(!valid_langs.includes(translate_msg_arr[1])) {
          let translate_msg_split = translate_msg_arr.splice(1)
          req_text = translate_msg_split.join(' ')
          translate(req_text, {to: default_lang}).then(res => {
                client.sendMessage(message.from, res.text)
            }).catch(err => {
                client.sendMessage(message.from, "err(2) translating. Check @cmds")
            })
        }
        if(valid_langs.includes(translate_msg_arr[1])) {
          if(valid_langs.includes(translate_msg_arr[2])) {
            return client.sendMessage(message.from, `(2)Please enter text to translate from ${translate_msg_arr[1]} to ${translate_msg_arr[2]}. \n\nUse translate like this -> \n@tr (<from-language> <to-language>) <text>`)
          } else {
            if(translate_msg_arr[1] == default_lang) {
              translate_msg_split = translate_msg_arr.splice(2)
              req_text = translate_msg_split.join(' ')
              translate(req_text, {to: translate_msg_arr[1]}).then(res => {
                  client.sendMessage(message.from, res.text)
              }).catch(err => {
                  client.sendMessage(message.from, "err(3) translating. Check @cmds")
              })
            } else {
              translate_msg_split = translate_msg_arr.splice(2)
              req_text = translate_msg_split.join(' ')
              translate(req_text, {to: translate_msg_arr[1]}).then(res => {
                  client.sendMessage(message.from, res.text)
              }).catch(err => {
                  client.sendMessage(message.from, "err(4) translating. Check @cmds")
              })
            }
          }
        } else {
          client.sendMessage(message.from, `Translating in default language (${default_lang})`)
          translate_msg_split = translate_msg_arr.splice(1)
          req_text = translate_msg_split.join(' ')
          translate(req_text, {to: default_lang}).then(res => {
                client.sendMessage(message.from, res.text)
            }).catch(err => {
                client.sendMessage(message.from, "err(5) translating. Check @cmds")
            })
        }
      }                    
      else if(translate_msg_arr.length > 3) {
        if(valid_langs.includes(translate_msg_arr[1])) {
          if(valid_langs.includes(translate_msg_arr[2])) {
            translate_msg_split = translate_msg_arr.splice(3)
            req_text = translate_msg_split.join(' ')
            translate(req_text, {from: translate_msg_arr[1], to: translate_msg_arr[2]}).then(res => {
                client.sendMessage(message.from, res.text)
            }).catch(err => {
                client.sendMessage(message.from, "err(6) translating. Check @cmds")
            })
          } else {  
              if(translate_msg_arr[1] == default_lang) { 
                translate_msg_split = translate_msg_arr.splice(2)
                req_text = translate_msg_split.join(' ')
                translate(req_text, {to: translate_msg_arr[1]}).then(res => {
                    client.sendMessage(message.from, res.text)
                }).catch(err => {
                    client.sendMessage(message.from, "err(7) translating. Check @cmds")
                })
              } else {
                translate_msg_split = translate_msg_arr.splice(2)
                req_text = translate_msg_split.join(' ')
                translate(req_text, {to: translate_msg_arr[2]}).then(res => {
                    client.sendMessage(message.from, res.text)
                }).catch(err => {
                    client.sendMessage(message.from, "err(8) translating. Check @cmds")
                })
              }
          }              
        } else {
          translate_msg_split = translate_msg_arr.splice(1)                
          req_text = translate_msg_split.join(' ')
          translate(req_text, {to: default_lang}).then(res => {
              client.sendMessage(message.from, res.text)
          }).catch(err => {
              client.sendMessage(message.from, "err(9) translating. Check @cmds")
          })
        }
      } else {
        client.sendMessage(message.from, "err(10) translating. Check @cmds")
      }
  }


  // quiz
  if(active_quiz) {
    try {
      let new_answer = {}
      new_answer['answer'] = body 
      new_answer['from'] = from
      new_answer['notifyName'] = notifyName
      new_answer['author'] = author
      new_answer['correct'] = false
      new_answer['subcorrect'] = false
      if(!active_quiz_answers.some(item => item['author'] == new_answer['author'])) {
        if(body == active_quiz_solution || body.toLowerCase() == active_quiz_solution.toLowerCase()) {
          new_answer['correct'] = true
        }
        if(!new_answer['correct'] && active_quiz_solution_arr.includes(body.toLowerCase()) && body.toLowerCase() !== '') {
          new_answer['subcorrect'] = true
        }
        active_quiz_answers.push(new_answer)
      }
    } catch(err) {
      console.log(`[@quiz] Couldn't add quiz answer ${body}`)
      console.log(err)
    }
  }
  if (command.startsWith('quiz') || command.startsWith('q')) {
    var data = await quiz.quiz()
    active_quiz_solution = data.antwort
    active_quiz_solution_arr = data.antwort.toLowerCase().split(" ")
    client.sendMessage(message.from, `*Quiz*\n${data.frage}`)  
    active_quiz = true
    await new Promise(resolve => setTimeout(resolve, 30000))
    client.sendMessage(message.from, `*Quiz solution*\n${data.antwort}`)
    if (config_data.api_mongodb) {
      for (let qi = 0; qi < active_quiz_answers.length; qi++) {
        if (active_quiz_answers[qi]['correct']) {
          points = 20;
          mgdb_m.mgdb(author, points)
            .then(id_obj => {
              var lsjz = parseInt(id_obj.points) + 20
              client.sendMessage(message.from, `${notifyName} is correct +20 points! total: ${lsjz}`)
            })
            .catch(err => {
              console.log("[@quiz] err(1):" + err)
            })
        }
        if (active_quiz_answers[qi]['subcorrect']) {
          points = 5
          mgdb_m.mgdb(author, points)
            .then(id_obj => {
              var lsjz = parseInt(id_obj.points) + 5
              client.sendMessage(message.from, `${notifyName} is partly correct +5 points! ${notifyName}'s total: ${lsjz}`)
            })
            .catch(err => {
              console.log("[@quiz] err(2):" + err)
            })
        }
      }
    } else {
      for (let qi = 0; qi < active_quiz_answers.length; qi++) {
        if (active_quiz_answers[qi]['correct']) {
          points = 20
          client.sendMessage(message.from, `${notifyName} is correct +${points} points!`);
        }
        if (active_quiz_answers[qi]['subcorrect']) {
          points = 5
          client.sendMessage(message.from, `${notifyName} is partly correct +${points} points!`)
        }
      }
    }
    active_quiz = false 
    active_quiz_answers = []
  }

  // typeracer
  if(active_typeracer) {
    try {
      let new_racer = {}
      new_racer['answer'] = body 
      new_racer['from'] = from
      new_racer['notifyName'] = notifyName
      new_racer['author'] = author
      new_racer['correct'] = false
      new_racer['timestamp'] = `${timestamp}`
      new_racer['time'] = 0
      if(!active_typeracer_racers.some(item => item['author'] == new_racer['author'])) {
        if(body == typeracer_words) {
          new_racer['correct'] = true
          new_racer['time'] = timestamp - active_typeracer_timestamp
        }
        active_typeracer_racers.push(new_racer)
      }
    } catch(err) {
      console.log(`[@typeracer] Couldn't add ${body}`)
      console.log(err)
    }
  }
  if (command.startsWith('r') || command.startsWith('race') || command.startsWith('race')) {
    typeracer_words = await wiki.rnwiki()
    client.sendMessage(message.from, `Race starts in 5 seconds... \n\nType the text below:`)
    await new Promise(resolve => setTimeout(resolve, 5000))
    client.sendMessage(message.from, `*${typeracer_words}*`)  
    active_typeracer = true
    active_typeracer_timestamp = timestamp
    await new Promise(resolve => setTimeout(resolve, 30000))
    client.sendMessage(message.from, `*Typeracer Results:*\n${
      active_typeracer_racers.map(racer => `${racer.notifyName}: ${racer.time}s`).join('\n')
    }`);


    active_typeracer = false 
    active_typeracer_timestamp = 0
    active_typeracer_racers = []
  }

  // casino
  if (command.startsWith('casino') || command.startsWith('gamble')) {    
    let fruitArr = ['🍉','🍇','🍒','🍊','🍋','🥥','🌶']
    let winArr = []
    let winString = ""
    let score = 0
    for(i=1;i<=3;i++) {
      let n = Math.floor(Math.random()*fruitArr.length)
      winArr.push(n)
      if(i<3) {
        winString += `|${fruitArr[n]}`
      } else {
        winString += `|${fruitArr[n]}|`              
      }
    } 

    if(winArr[0] == winArr[1] && winArr[0] !== winArr[2]) {
      score = 20
    } else if (winArr[0] == winArr[1] && winArr[0] == winArr[2]) {
        score = 50
    } else {
        score = -5
    }

    if(config_data.api_mongodb) {
      mgdb_m.mgdb(author,score)
          .then(id_obj => {
            var lsjz = parseInt(id_obj.score) + 20
            client.sendMessage(message.from, `${winString} \n${score} points!\n${notifyName}'s total: ${lsjz}`) 
          })
          .catch(err => {
            console.log("[@casino] err(1):" + err)
          }) 
    } else {
      client.sendMessage(message.from, `${winString} \n${score} points!`) 
    }

  }

  // wiki
  if (command.startsWith('wiki')) {
    let wiki_result = await wiki.wiki(arg)
    let linkarg = arg.replace(/[äÄöÖüÜß]/g, u => char_maps["utf8"][u])
    linkarg = linkarg.replace(' ','%20')
    client.sendMessage(message.from, `*Wikipedia* result *'${arg}'*` 
                                    + '\n' + wiki_result + '...'
                                    + `\nhttps://${config_data.lang}.wikipedia.org/wiki/${linkarg}`)
  }

  // enwiki
  if (command.startsWith('enwiki')) {
    let wiki_result = await wiki.enwiki(arg)
    let linkarg = arg.replace(/[äÄöÖüÜß]/g, u => char_maps["utf8"][u])
    linkarg = linkarg.replace(' ','%20')
    client.sendMessage(message.from, `*Wikipedia* result *'${arg}'*` 
                                    + '\n' + wiki_result + '...'
                                    + `\nhttps://en.wikipedia.org/wiki/${linkarg}`)
  }

  // rnwiki
  if (command.startsWith('rnwiki')) {
    let wiki_result = await wiki.rnwiki()

    client.sendMessage(message.from, `*Wikipedia* result random` 
                                    + '\n' + wiki_result + '...'
                                    + `\n`)
  }



  // ytmp3
  if(command.startsWith('ytmp3') || command.startsWith('mp3') ) {
        try {
            let msg_req_link = `${arg}`
            let req_format= `mp3`
            fn_download(msg_req_link, req_format)
              .then(async (response) => {
                  try {
                      const media = MessageMedia.fromFilePath(`./downloads/${response.filename}`)
                      await client.sendMessage(message.from, media, { 
                        sendMediaAsDocument: true
                      })
                  } catch (err) {
                      console.log(`ytmp3 err 1: ${err}`)
                      client.sendMessage(message.from, `ytmp3 err 1 ${err}`)
                  }
              })
              .catch(err => {
                console.log(`ytmp3 err 2: ${err}`)
                client.sendMessage(message.from, `ytmp3 err 2 ${err}`)
              })
        } catch (err) {
            console.log(`ytmp3 err 3: ${err}`)
            client.sendMessage(message.from, `ytmp3 err 3 ${err}`)
        }
  }

  // ytmp4
  if (command.startsWith('ytmp4') || command.startsWith('mp4')) {    
        try {
            let msg_req_link = `${arg}`
            let req_format= `mp4`
            fn_download(msg_req_link, req_format)
              .then(async (response) => {
                  try {
                      const media = MessageMedia.fromFilePath(`./downloads/${response.filename}`)
                      await client.sendMessage(message.from, media)
                  } catch (err) {
                      console.log(`ytmp4 err 1: ${err}`)
                      client.sendMessage(message.from, `ytmp4 err 1 ${err}`)
                  }
              })
              .catch(err => {
                console.log(`ytmp4 err 2: ${err}`)
                client.sendMessage(message.from, `ytmp4 err 2 ${err}`)
              })
        } catch (err) {
            console.log(`ytmp4 err 3: ${err}`)
            client.sendMessage(message.from, `ytmp4 err 3 ${err}`)
        }
  }
})
