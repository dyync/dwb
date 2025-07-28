# Dyncoo WhatsApp

Multifunction WhatsApp Bot based on [pedroslopez whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)

Current cmds:
```shell
    @translate
    @wiki
    @urban
    @imdb
    @ebay
    @crypto
    @chatgpt
    @dalle
    @wetter
    @quiz
    @casino
    @ytmp3
    @ytmp4
```



Note: 
You have to add own 'cookies.txt'. I left some cookies for you but they probably won't work anymore when you read this (install browser add-on and go visit yt, it takes 5 sec)
Obviously you need node for js
nvm -v
nvm install node
nvm use node
node -v
npm install -g npm@latest
sudo apt update && sudo apt upgrade -y
(sudo reboot)
npm -v




## Minimum Requirements

- At least 2 GB RAM (puppeteer)
- Change 'config.js'

## Installation

```shell
PUPPETEER_SKIP_DOWNLOAD=true npm i
```

## Usage

```shell
npm start
```

To keep running:

```shell
npm install -g pm2
```

```shell
pm2 start index.js --name "swb" --cron-restart="0 3 * * *"
```

```shell
pm2 start server.js --name "swb_s" --cron-restart="0 3 * * *"
```

## Note

In case you scrolled this far something is maybe not working :|

- 'cookies.txt'
```shell
You have to add own 'cookies.txt'. I left some cookies for you but they maybe won't work anymore (install browser add-on and go visit yt, it takes 5 sec)
```

- nodejs/express
Obviously you need node for js and npm for js packages

on ubuntu:
```shell
nvm -v
nvm install node
nvm use node
node -v
npm install -g npm@latest
sudo apt update && sudo apt upgrade -y
(sudo reboot)
npm -v
```

on windows:
just google for nodejs and download their .msi

- Third party API's in 'config.js'
For some of the modules you MAYBE need to register at third-party websites. So only in case you want to use EVERY @command (fe. @casino/@weather/@cc .. you need MongoDB, OpenAI, Coinbase, OpenWeather to save/get data/api token/url) don't worry they are all free. I made the code clean so you can understand/learn/modify easily (and make an even better bot)
