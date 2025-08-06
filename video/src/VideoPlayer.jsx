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

import {useCallback, useEffect, useState, useMemo} from 'react'
import c from 'classnames'
import {timeToSecs} from './utils'

const formatTime = t => {
  const minutes = Math.floor(t / 60);
  const seconds = Math.floor(t % 60).toString().padStart(2, '0');
  const milliseconds = Math.floor((t - Math.floor(t)) * 1000).toString().padStart(3, '0');
  return `${minutes}:${seconds}.${milliseconds}`;
}

export default function VideoPlayer({
  url,
  timecodeList,
  requestedTimecode,
  isLoadingVideo,
  videoError,
  jumpToTimecode
}) {
  const [video, setVideo] = useState(null)
  const [duration, setDuration] = useState(0)
  const [scrubberTime, setScrubberTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [currentCaption, setCurrentCaption] = useState(null)
  const currentSecs = duration * scrubberTime || 0
  const currentPercent = scrubberTime * 100
  const timecodeListReversed = useMemo(
    () => timecodeList?.toReversed(),
    [timecodeList]
  )

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }, [isPlaying, video])

  const updateDuration = () => setDuration(video.duration)

  const updateTime = () => {
    if (!isScrubbing) {
      setScrubberTime(video.currentTime / video.duration)
    }

    if (timecodeList) {
      setCurrentCaption(
        timecodeListReversed.find(t => timeToSecs(t.time) <= video.currentTime)
          ?.text
      )
    }
  }

  const onPlay = () => setIsPlaying(true)
  const onPause = () => setIsPlaying(false)

  useEffect(() => {
    setScrubberTime(0)
    setIsPlaying(false)
  }, [url])

  useEffect(() => {
    if (video && requestedTimecode !== null) {
      video.currentTime = requestedTimecode
    }
  }, [video, requestedTimecode])

  useEffect(() => {
    const onKeyPress = e => {
      if (
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA' &&
        e.key === ' '
      ) {
        togglePlay()
      }
    }

    addEventListener('keypress', onKeyPress)

    return () => {
      removeEventListener('keypress', onKeyPress)
    }
  }, [togglePlay])

  return (
    <div className="videoPlayer">
      {url && !isLoadingVideo ? (
        <>
          <div>
            <video
              src={url}
              ref={setVideo}
              onClick={togglePlay}
              preload="auto"
              crossOrigin="anonymous"
              onDurationChange={updateDuration}
              onTimeUpdate={updateTime}
              onPlay={onPlay}
              onPause={onPause}
            />

            {currentCaption && (
              <div className="videoCaption">{currentCaption}</div>
            )}
          </div>

          <div className="videoControls">
            <div className="videoScrubber">
              <input
                style={{'--pct': `${currentPercent}%`}}
                type="range"
                min="0"
                max="1"
                value={scrubberTime || 0}
                step="0.000001"
                onChange={e => {
                  setScrubberTime(e.target.valueAsNumber)
                  video.currentTime = e.target.valueAsNumber * duration
                }}
                onPointerDown={() => setIsScrubbing(true)}
                onPointerUp={() => setIsScrubbing(false)}
              />
            </div>
            <div className="timecodeMarkers">
              {timecodeList?.map(({time, text, value}, i) => {
                const secs = timeToSecs(time)
                const pct = (secs / duration) * 100

                return (
                  <div
                    className="timecodeMarker"
                    key={i}
                    style={{left: `${pct}%`}}
                  >
                    <div
                      className="timecodeMarkerTick"
                      onClick={() => jumpToTimecode(secs)}
                    >
                      <div />
                    </div>
                    <div
                      className={c('timecodeMarkerLabel', {right: pct > 50})}
                    >
                      <div>{time}</div>
                      <p>{value || text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="videoTime">
              <button>
                <span className="icon" onClick={togglePlay}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              {formatTime(currentSecs)} / {formatTime(duration)}
            </div>
          </div>
        </>
      ) : (
        <div className="emptyVideo">
          <p>
            {isLoadingVideo
              ? 'Processing video...'
              : videoError
              ? 'Error processing video.'
              : 'Drag and drop a video file here to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}
