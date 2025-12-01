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

import {GoogleGenerativeAI} from '@google/generative-ai'
import {GoogleAIFileManager} from '@google/generative-ai/server'
import path from 'path'

const key = process.env.VITE_GEMINI_API_KEY

if (!key) {
  // Fail fast with a clear message so deployments without a key don't silently
  // accept uploads then fail later.
  console.error('VITE_GEMINI_API_KEY is missing from environment variables')
  throw new Error('VITE_GEMINI_API_KEY is not set on the server')
}

const fileManager = new GoogleAIFileManager(key)
const genAI = new GoogleGenerativeAI(key)

export const uploadVideo = async file => {
  try {
    // Basic validation: ensure the incoming file looks like a video and has a
    // filename. This avoids uploading unsupported files (or empty bodies) to
    // the file manager which will fail later and is harder to debug.
    if (!file || !file.path || !file.originalname) {
      const msg = 'Missing file or invalid upload payload (file.path or originalname)'
      console.error(msg, file)
      throw new Error(msg)
    }

    // Prefer explicit video MIME types; multer may sometimes set generic
    // application/octet-stream depending on environment. Allow the common
    // video types, and accept application/octet-stream only when the file
    // extension strongly indicates a video (this helps deployed hosts which
    // sometimes strip or normalize Content-Type headers).
    const mimeTypeRaw = file.mimetype || 'application/octet-stream'
    let mimeType = mimeTypeRaw

    const ext = path.extname(file.originalname || '').toLowerCase()
    const knownVideoExt = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi', '.ogg'])

    const extMap = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.ogg': 'video/ogg'
    }

    if (mimeTypeRaw.startsWith('video/')) {
      // OK as-is
    } else if (mimeTypeRaw === 'application/octet-stream' && knownVideoExt.has(ext)) {
      // Fallback: promote to a reasonable video MIME type based on extension
      mimeType = extMap[ext] || 'application/octet-stream'
      console.warn(`uploadVideo: promoted mimeType from application/octet-stream to ${mimeType} based on extension ${ext}`)
    } else {
      const msg = `Unsupported mimeType: ${mimeTypeRaw}. Expected a video/* type or application/octet-stream with a video extension.`
      console.error(msg)
      throw new Error(msg)
    }

    const uploadResult = await fileManager.uploadFile(file.path, {
      displayName: file.originalname,
      mimeType: mimeType
    })
    return uploadResult.file
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const checkProgress = async fileId => {
  try {
    const result = await fileManager.getFile(fileId)
    return result
  } catch (error) {
    console.error('checkProgress errored:', error)
    throw error
  }
}

export const promptVideo = async (uploadResult, prompt, model) => {
  try {
    const req = [
      {text: prompt},
      {
        fileData: {
          mimeType: uploadResult.mimeType,
          fileUri: uploadResult.uri
        }
      }
    ]
    const result = await genAI.getGenerativeModel({model}).generateContent(req)

    return {
      text: result.response.text(),
      candidates: result.response.candidates,
      feedback: result.response.promptFeedback
    }
  } catch (error) {
    console.error('promptVideo errored:', error)
    throw error
  }
}
