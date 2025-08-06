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

import os from 'os';

const app = express()
app.use(express.json())

const upload = multer({dest: os.tmpdir()})
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file
    const resp = await uploadVideo(file)
    res.json({data: resp})
  } catch (error) {
    res.status(500).json({error})
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
    res.json({error}, {status: 400})
  }
})

const port = process.env.NODE_ENV === 'production' ? 8080 : 8000

ViteExpress.listen(app, port, () => console.log('Server is listening...'))
