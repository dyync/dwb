# Dyncoo WhatsApp

Multifunction WhatsApp Bot based on [pedroslopez whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)



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


Current cmds:
```shell
    @translate <text>[ <from> <to>]
    @wiki <text>
    @urban <text>
    @imdb <text>
    @ebay <text>
    @crypto <token> | 3rd party API
    @chatgpt <text> | 3rd party API
    @dalle <text>   | 3rd party API
    @wetter <text>  | 3rd party API
    @quiz           | mongodb
    @casino         | mongodb
    @mp3 <yt-link>  | cookies.txt
    @mp4 <yt-link>  | cookies.txt
```

## Note

- 'cookies.txt'
You have to add own 'cookies.txt'. I left some cookies for you but they probably won't work 

- nodejs/express
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
