// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import express from 'express'
import ViteExpress from 'vite-express'
import multer from 'multer'
import {checkProgress, promptVideo, uploadVideo} from './upload.mjs'

const app = express()
app.use(express.json())

// Allow configuring the temporary uploads directory (some hosts restrict /tmp)
const tmpDir = process.env.VIDEO_UPLOAD_TMP_DIR || '/tmp/'
const upload = multer({dest: tmpDir})
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file
    const resp = await uploadVideo(file)
    res.json({data: resp})
  } catch (error) {
    // Error can be an Error object; return a structured JSON message to the client
    console.error('/api/upload error:', error)
    res.status(500).json({error: error?.message || String(error)})
  }
})

app.post('/api/progress', async (req, res) => {
  try {
    const progress = await checkProgress(req.body.fileId)
    res.json({progress})
  } catch (error) {
    res.status(500).json({error})
  }
})

app.post('/api/prompt', async (req, res) => {
  try {
    const reqData = req.body
    const videoResponse = await promptVideo(
      reqData.uploadResult,
      reqData.prompt,
      reqData.model
    )
    res.json(videoResponse)
  } catch (error) {
    console.error('/api/prompt error:', error)
    res.status(400).json({error: error?.message || String(error)})
  }
})

const port = process.env.NODE_ENV === 'production' ? 8080 : 8000

ViteExpress.listen(app, port, () => console.log('Server is listening...'))
