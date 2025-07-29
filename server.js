const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const axios = require('axios')
const app = express()



// Instead of just 'bv*+ba'
const ytdlp_settings = {
    'mp4_best' : `-f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'`,
    'mp4_worst' : `-f 'worstvideo[ext=mp4]+worstaudio[ext=m4a]/worst[ext=mp4]/worst'`,
    'mp3' : `-f 'ba' -x --audio-format mp3`,
    'mp4_fallback1' : `-f 'bv*+ba'`,
    'webm_lowest' : '-f "bv*[height<=144]+ba/b[height<=144]"',
    'mp4_240' : '-f "bv*[height<=240]+ba/b[height<=240]"',
    'mp4_230' : '-f 230',
    'mp4_140' : '-f 140',
    'mp4_fallback2' : '-f "bv*[height<=240]+ba/b[height<=240]/wv+wa/w"'
}





// Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configuration
const PORT = process.env.PORT || 3333
const DOWNLOAD_DIR = path.join(__dirname, 'downloads')
const COOKIES_PATH = path.join(__dirname, 'cookies.txt')

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
}

app.use('/downloads', express.static(DOWNLOAD_DIR))


app.get('/hello', (req, res) => {
    res.send('hello :)')
})

app.post('/info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }
        
        if (!url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const useCookies = fs.existsSync(COOKIES_PATH);
        
        let command = 'yt-dlp --dump-json --no-download';
        
        if (useCookies) {
            command += ` --cookies "${COOKIES_PATH}"`;
        }
        
        command += ` ${url}`;
        
        console.log(`Executing command: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return res.status(500).json({ 
                    error: 'Failed to get video info', 
                    details: error.message 
                });
            }
            
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            
            try {
                // Parse the JSON output from yt-dlp
                const videoInfo = JSON.parse(stdout);
                res.json(videoInfo);
            } catch (parseError) {
                console.error('Failed to parse video info:', parseError);
                res.status(500).json({ 
                    error: 'Failed to parse video information',
                    details: parseError.message,
                    rawOutput: stdout
                });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});




app.post('/download', async (req, res) => {
    try {
        let { url, format, type } = req.body
        url = url.split('&list=')[0]
        
        if (!url) {
            return res.status(400).json({ error: 'YouTube URL is required' })
        }
        if (!url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' })
        }
        
        const useCookies = fs.existsSync(COOKIES_PATH)
        const timestamp = Date.now()
        const outputTemplate = path.join(DOWNLOAD_DIR, `%(title)s_${timestamp}.%(ext)s`)

        let command = `yt-dlp -o "${outputTemplate}"`        
        if (useCookies) {
            command += ` --cookies "${COOKIES_PATH}"`
        }
        


        console.log(`!!!got request!: ${req.body}`)


        if (format) {
            console.log(`!!!got format!: ${format}`)
            if (type == 'start') {
                console.log(`!!!got type == 'start'`)
                command += ` ${ytdlp_settings[format]}`
            } else {
                command += `-f ${format}`
            }

        } else {
            console.log(`no format found err! setting default`)
            command += `-f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'`
        }

        command += ` ${url}`
        console.log(`Executing command: ${command}`)
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`)
                return res.status(500).json({ error: 'Failed to download video', details: error.message })
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`)
            }
            console.log(`stdout: ${stdout}`)
            const files = fs.readdirSync(DOWNLOAD_DIR)
            const downloadedFile = files.find(file => file.includes(timestamp.toString()))
            if (!downloadedFile) {
                return res.status(500).json({ error: 'Downloaded file not found' })
            }
            const filePath = path.join(DOWNLOAD_DIR, downloadedFile)
            const fileStat = fs.statSync(filePath)




            res.json({
                message: 'Video downloaded successfully',
                filename: downloadedFile,
                path: filePath,
                size: fileStat.size,
                downloadUrl: `/downloads/${downloadedFile}`
            })
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})



app.get('/downloads/:asd', (req, res) => {
  const asd = req.params.asd.toLowerCase(); // Case-insensitive match
  const files = fs.readdirSync(DOWNLOAD_DIR);

  // Find the first file that includes the asd
  const matchedFile = files.find(file => 
    file.toLowerCase().includes(asd)
  );

  if (!matchedFile) {
    return res.status(404).send('No matching file found');
  }

  const filePath = path.join(DOWNLOAD_DIR, matchedFile);
  res.download(filePath, matchedFile); // Force download with original filename
})



app.post('/cook', (req, res) => {
    if (!req.files || !req.files.cookies) {
        return res.status(400).json({ error: 'No cookies file uploaded' })
    }
    const cookiesFile = req.files.cookies
    cookiesFile.mv(COOKIES_PATH, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save cookies file' })
        }
        res.json({ message: 'Cookies file uploaded successfully' })
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Downloads directory: ${DOWNLOAD_DIR}`)
    console.log(`Cookies path: ${COOKIES_PATH}`)
    console.log(`Available endpoints:`)
    console.log(`- /hello (GET)`)
    console.log(`- /download (POST)`)
    console.log(`- /cook (POST cookies.txt mbmbn)`)
})