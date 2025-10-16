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
    @translate <text>[ <from> <to>]
    @wiki <text>
    @urban <text>
    @imdb <text>
    @ebay <text>
    @crypto <token> | 3rd party API
    @wetter <text>  | 3rd party API
    @quiz           | mongodb
    @casino         | mongodb
    @mp3 <yt-link>  | cookies.txt
    @mp4 <yt-link>  | cookies.txt
```

## Optional

To use @mp3 and @mp4 additional steps are required:

```shell
    sudo apt update && sudo apt install yt-dlp ffmpeg -y
```

Update cookies.txt by visiting youtube and saving your site cookies with any browser add-on.