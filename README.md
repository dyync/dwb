# Dyncoo WhatsApp

Multifunction WhatsApp Bot based on [pedroslopez whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)



## Minimum Requirements

- Change 'config.js'
- 2 GB RAM (chromium/puppeteer)


## Installation

```shell
PUPPETEER_SKIP_DOWNLOAD=true npm i
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
    @chatgpt <text> | 3rd party API
    @dalle <text>   | 3rd party API
    @wetter <text>  | 3rd party API
    @quiz           | mongodb
    @casino         | mongodb
    @mp3 <yt-link>  | cookies.txt
    @mp4 <yt-link>  | cookies.txt
```

## Note







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


Optional (in case you want to use @mp3/@mp4)
- 'cookies.txt/ffmpeg/yt-dlp'

```shell
# 1. Download and install yt-dlp (official method)
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp

# 2. Make it executable
sudo chmod a+rx /usr/local/bin/yt-dlp

# 3. Install FFmpeg (required for audio/video merging)
sudo apt update && sudo apt install ffmpeg -y

# 4. Verify installation
yt-dlp --version

# 5. Install FFmpeg (required for audio/video merging)
Add own "cookies.txt". I left some but they probably wont gone bad. You can get new cookies with any "cookies.txt" browser extension/add-on.

# 6. Chromium (maybe chromium install failed)
sudo apt-get install chromium-browser
```