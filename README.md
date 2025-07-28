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

## Minimum Requirements

- Change 'config.js'
- 2 GB RAM (chromium/puppeteer)


## Installation

```shell
sudo apt-get install chromium-browser
```

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
pm2 start index.js --name "dwb" --cron-restart="0 3 * * *"
```

## Note

- 'cookies.txt'
```shell
You have to add own 'cookies.txt'. I left some cookies for you but they probably won't work anymore. Just install any browser cookies.txt add-on and go visit yt, it takes 5 sec)
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
download nodejs .msi

- Third party API's in 'config.js'
For some of the modules you MAYBE need to register at third-party websites. So only in case you want to use EVERY @command (fe. @casino/@weather/@cc .. you need MongoDB, OpenAI, Coinbase, OpenWeather to save/get data/api token/url) don't worry they are all free. I made the code clean so you can understand/learn/modify easily (and make an even better bot)
