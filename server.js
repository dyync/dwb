const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const fs = require('fs')
const path = require('path')
const { spawn,exec } = require('child_process')
const axios = require('axios')
const app = express()



const default_formats_fallback = [
    { format_id: ` -f 'bv*+ba'`, ext: 'mp4', format_note: 'BEST QUALITY VIDEO' },
    { format_id: ` -f 'worstvideo[height<=480][ext=webm]+worstaudio[ext=webm]'`, ext: 'mp4', format_note: 'SMALLEST VIDEO' },
    { format_id: ` -f 'ba' -x --audio-format mp3`, ext: 'mp3',  format_note: '.MP3 AUDIO' }
]





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



function extractYouTubeId(url) {
    // Regular expression to match various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    // Try to handle YouTube Shorts URLs
    if (url.includes('youtube.com/shorts/')) {
        const shortsId = url.split('/shorts/')[1].split('?')[0];
        if (shortsId.length === 11) {
            return shortsId;
        }
    }
    
    // Try to handle youtu.be URLs
    if (url.includes('youtu.be/')) {
        const beId = url.split('youtu.be/')[1].split(/[?\/]/)[0];
        if (beId.length === 11) {
            return beId;
        }
    }
    
    // If nothing matches, try to return the last 11 characters if they look like an ID
    const possibleId = url.slice(-11);
    if (/^[a-zA-Z0-9_-]{11}$/.test(possibleId)) {
        return possibleId;
    }
    
    return `0`;
}


function extractMP4FormatsFromOutput(output) {
    const mp4Formats = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
        // Skip header lines and empty lines
        if (!line.trim() || line.includes('─') || line.includes('ID') && line.includes('EXT')) {
            continue;
        }
        
        // Split by spaces and filter out empty strings
        const parts = line.split(' ').filter(part => part.trim() !== '');
        
        if (parts.length >= 3) {
            const formatId = parts[0];
            const extension = parts[1];
            const hasAudio = !line.includes('video only');
            
            // Extract resolution (it's usually the 3rd part, but can vary)
            let resolution = '';
            for (let i = 2; i < Math.min(parts.length, 5); i++) {
                if (parts[i].includes('x') && /^\d+x\d+$/.test(parts[i])) {
                    resolution = parts[i];
                    break;
                }
            }
            
            // Check if it's MP4 and has audio (not video only)
            if (extension === 'mp4' && hasAudio) {
                mp4Formats.push({
                    format_id: ` -f '${formatId}'`,
                    ext: extension,
                    format_note: resolution
                });
            }
        }
    }
    
    return mp4Formats;
}





app.get('/hello', (req, res) => {
    res.send('hello :)')
})


app.post('/download', async (req, res) => {
    try {






        const { link, format } = req.body
        
        
        if (!link) {
            return res.status(400).json({ error: 'YouTube URL is required' })
        }
        if (!link.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' })
        }
        const link_clean = link.split('&list=')[0]
        console.log(`*link_clean: ${link_clean}`)
        const req_yt_id = extractYouTubeId(link_clean)
        console.log(`*req_yt_id: ${req_yt_id}`)
        const req_url = `https://www.youtube.com/watch?v=${req_yt_id}`;
        const command = `yt-dlp --list-formats ${req_url}`;
        console.log(`Executing info command: ${command}`);
        const executeCommand = () => {
            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(stdout);
                });
            });
        };
        const stdout = await executeCommand();
        console.log(`stdout: ${stdout}`);
        res_mp4 = extractMP4FormatsFromOutput(stdout);
        console.log(`res_mp4: ${res_mp4}`);


        let selectedFormatId = null;
        const formatPriority = ['360p', '240p', '144p'];

        // First try to find exact matches
        for (const preferredFormat of formatPriority) {
            const foundFormat = res_mp4.find(format => 
                format.format_note && format.format_note.toLowerCase() === preferredFormat.toLowerCase()
            );
            if (foundFormat) {
                selectedFormatId = foundFormat.format_id;
                break;
            }
        }

        // If no exact match found, look for partial matches (e.g., "720" instead of "720p")
        if (!selectedFormatId) {
            for (const preferredFormat of formatPriority) {
                const baseFormat = preferredFormat.replace('p', '');
                const foundFormat = res_mp4.find(format => 
                    format.format_note && format.format_note.toLowerCase().includes(baseFormat.toLowerCase())
                );
                if (foundFormat) {
                    selectedFormatId = foundFormat.format_id;
                    break;
                }
            }
        }

        console.log(`*selectedFormatId    : ${selectedFormatId}`)



        
        const useCookies = fs.existsSync(COOKIES_PATH)
        const timestamp = Date.now()

        console.log(`*format    : ${format}`)
        console.log(`*timestamp : ${timestamp}`)


        const outputTemplate = path.join(DOWNLOAD_DIR, `%(title)s_${timestamp}_${req_yt_id}.${format}`)
        let command_download = `yt-dlp -o "${outputTemplate}"`
        if (useCookies) {
            command_download += ` --cookies "${COOKIES_PATH}"`
        }
        if (selectedFormatId) {
            command_download += ` ${selectedFormatId}`
        } else {
            command_download += ` -f 'bv*+ba'`
        }
        command_download += ` ${link_clean}`
        if(format != `mp3`) {
            command_download += ` --merge-output-format ${format}`
        }
        if(format == `mp3`) {
            command_download += ` -x --audio-format mp3`
        }

        command_download += ` --extractor-args "youtube:player_js_version=actual"`
        console.log(`Executing command_download: ${command_download}`);
        const child = spawn(command_download, { shell: true });



        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        child.on('error', (error) => {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({
                error: 'Failed to download video',
                details: error.message
            });
        });

        child.on('close', (code) => {
            console.log(`Process exited with code ${code}`);
            const files = fs.readdirSync(DOWNLOAD_DIR)
            const downloaded_file = files.find(file => file.includes(timestamp))
            if (!downloaded_file) {
                return res.status(500).json({ error: 'Downloaded file not found' })
            }
            const downloaded_path = path.join(DOWNLOAD_DIR, downloaded_file)
            const fileStat = fs.statSync(downloaded_path)

            res.json({
                message: 'Video downloaded successfully',
                filename: downloaded_file,
                path: downloaded_path,
                size: fileStat.size,
                downloadUrl: `/downloads/${downloaded_file}`
            })
        })


    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})



app.get('/downloads/:asd', (req, res) => {
  const asd = req.params.asd.toLowerCase();
  const files = fs.readdirSync(DOWNLOAD_DIR);

  const matchedFile = files.find(file => 
    file.toLowerCase().includes(asd)
  );

  if (!matchedFile) {
    return res.status(404).send('No matching file found');
  }

  const filePath = path.join(DOWNLOAD_DIR, matchedFile);
  
  res.download(filePath, matchedFile, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).send('File not found');
    }
  });
});




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