# Dyncoo WhatsApp

Multifunction WhatsApp Bot based on [pedroslopez whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js/blob/main/src/Client.js)

## How does it work?

Puppeteer is using [chromium](https://source.chromium.org/chromium/chromium/src) in --headless mode to visit [https://web.whatsapp.com](https://web.whatsapp.com) which keeps idling in the browser to send/receive requests.

By default Puppeteer downloads a compatible version of chromium automatically. However if you are running in a restricted environment (e.g. Docker, CI/CD or minimal Linux) you may need to install chromium manually.

```shell
sudo sudo apt install chromium
```

## Minimum Requirements

- 2 GB RAM (chromium/puppeteer)


## Installation

```shell
npm i
```

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


Current cmds:
```shell
.ebay <text/quote>
.translate <text/quote> [<from> [<to>]]
.wiki <text/quote>
.imdb <text/quote>
.urban <text/quote>
.imdb <text/quote>
.crypto [<token>]
.wetter <city/PLZ>
.quiz
.race
.casino
.ai <text/quote>
.image <text/quote>
.mp3 <link>
.mp4 <link>
```

## Optional

To download youtube into .mp3 and .mp4 files, get cookies.txt from youtube (with any browser addon), install yt-dlp, install ffmpeg and run the server.js

```shell
sudo apt update && sudo apt install yt-dlp ffmpeg -y
```

```shell
pm2 start server.js --name "dwb_server" --cron-restart="0 3 * * *"
```