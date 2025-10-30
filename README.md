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
    .ai <text>
    .img <text>
    .tr <text> [<from> [<to>]]
    .ebay <text>
    .imdb <text>
    .wiki <text>
    .ub <text>
    .imdb <text>
    .ebay <text>
    .cc [<token>]
    .wetter <city/PLZ>
    .q
    .r
    .casino
    .mp3 <link>
    .mp4 <link>
```


    + `\n.q _Quiz_`
    + `\n.r _Typeracer_`
    + `\n.casino`
    + `\n.mp3 <link> _YouTube -> .mp3_`
    + `\n.mp4 <link> _YouTube -> .mp4_`)
## Optional

To use .mp3 and .mp4 additional steps are required:

```shell
    sudo apt update && sudo apt install yt-dlp ffmpeg -y
```

Update cookies.txt by visiting youtube and saving your site cookies with any browser add-on.