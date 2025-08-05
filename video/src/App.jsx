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

import {useRef, useState} from 'react'
import c from 'classnames'
import VideoPlayer from './VideoPlayer.jsx'
import Chart from './Chart.jsx'
import modes from './modes'
import {timeToSecs} from './utils'
import generateContent from './api'
import functions from './functions'

const chartModes = Object.keys(modes.Chart.subModes)

export default function App() {
  const [vidUrl, setVidUrl] = useState(null)
  const [file, setFile] = useState(null)
  const [timecodeList, setTimecodeList] = useState(null)
  const [requestedTimecode, setRequestedTimecode] = useState(null)
  const [selectedMode, setSelectedMode] = useState(Object.keys(modes)[0])
  const [activeMode, setActiveMode] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [chartMode, setChartMode] = useState(chartModes[0])
  const [chartPrompt, setChartPrompt] = useState('')
  const [chartLabel, setChartLabel] = useState('')
  const [theme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
  const scrollRef = useRef()
  const isCustomMode = selectedMode === 'Custom'
  const isChartMode = selectedMode === 'Chart'
  const isCustomChartMode = isChartMode && chartMode === 'Custom'
  const hasSubMode = isCustomMode || isChartMode

  const saveState = () => {
    const state = {
      vidUrl,
      timecodeList,
      selectedMode,
      activeMode,
      customPrompt,
      chartMode,
      chartPrompt,
      chartLabel,
    };

    const content = JSON.stringify(state, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const setTimecodes = ({timecodes}) =>
    setTimecodeList(
      timecodes.map(t => ({...t, text: t.text.replaceAll("\\'", "'")}))
    )

  const onModeSelect = async mode => {
    setActiveMode(mode)
    setIsLoading(true)
    setChartLabel(chartPrompt)

    const resp = await generateContent({
      text: isCustomMode
        ? modes[mode].prompt(customPrompt)
        : isChartMode
        ? modes[mode].prompt(
            isCustomChartMode ? chartPrompt : modes[mode].subModes[chartMode]
          )
        : modes[mode].prompt,
      file,
      functionDeclarations: functions({
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}) =>
          setTimecodeList(timecodes)
      })
    })

    const call = resp.functionCalls()[0]

    if (call) {
      ;({
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}) =>
          setTimecodeList(timecodes)
      })[call.name](call.args)
    }

    setIsLoading(false)
    scrollRef.current.scrollTo({top: 0})
  }

  const uploadVideo = async e => {
    e.preventDefault()
    setIsLoadingVideo(true)
    setVidUrl(URL.createObjectURL(e.dataTransfer.files[0]))

    const formData = new FormData()
    formData.set('video', e.dataTransfer.files[0])
    const resp = await (
      await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
    ).json()
    setFile(resp.data)
    checkProgress(resp.data.name)
  }

  const checkProgress = async fileId => {
    const resp = await (
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({fileId})
      })
    ).json()

    if (resp.progress.state === 'ACTIVE') {
      setIsLoadingVideo(false)
    } else if (resp.progress.state === 'FAILED') {
      setVideoError(true)
    } else {
      setTimeout(() => checkProgress(fileId), 1000)
    }
  }

  return (
    <main
      className={theme}
      onDrop={uploadVideo}
      onDragOver={e => e.preventDefault()}
      onDragEnter={() => {}}
      onDragLeave={() => {}}
    >
      <section className="top">
        {vidUrl && !isLoadingVideo && (
          <>
            <div className={c('modeSelector', {hide: !showSidebar})}>
              {hasSubMode ? (
                <>
                  <div>
                    {isCustomMode ? (
                      <>
                        <h2>Custom prompt:</h2>
                        <textarea
                          placeholder="Type a custom prompt..."
                          value={customPrompt}
                          onChange={e => setCustomPrompt(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              onModeSelect(selectedMode)
                            }
                          }}
                          rows="5"
                        />
                      </>
                    ) : (
                      <>
                        <h2>Chart this video by:</h2>

                        <div className="modeList">
                          {chartModes.map(mode => (
                            <button
                              key={mode}
                              className={c('button', {
                                active: mode === chartMode
                              })}
                              onClick={() => setChartMode(mode)}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className={c({active: isCustomChartMode})}
                          placeholder="Or type a custom prompt..."
                          value={chartPrompt}
                          onChange={e => setChartPrompt(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              onModeSelect(selectedMode)
                            }
                          }}
                          onFocus={() => setChartMode('Custom')}
                          rows="2"
                        />
                      </>
                    )}
                    <button
                      className="button generateButton"
                      onClick={() => onModeSelect(selectedMode)}
                      disabled={
                        (isCustomMode && !customPrompt.trim()) ||
                        (isChartMode &&
                          isCustomChartMode &&
                          !chartPrompt.trim())
                      }
                    >
                      ▶️ Generate
                    </button>
                  </div>
                  <div className="backButton">
                    <button
                      onClick={() => setSelectedMode(Object.keys(modes)[0])}
                    >
                      <span className="icon">chevron_left</span>
                      Back
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2>Explore this video via:</h2>
                    <div className="modeList">
                      {Object.entries(modes).map(([mode, {emoji}]) => (
                        <button
                          key={mode}
                          className={c('button', {
                            active: mode === selectedMode
                          })}
                          onClick={() => setSelectedMode(mode)}
                        >
                          <span className="emoji">{emoji}</span> {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <button
                      className="button generateButton"
                      onClick={() => onModeSelect(selectedMode)}
                    >
                      ▶️ Generate
                    </button>
                    <button
                      className="button saveButton"
                      onClick={saveState}
                    >
                      💾 Save to Local
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              className="collapseButton"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <span className="icon">
                {showSidebar ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
          </>
        )}

        <VideoPlayer
          url={vidUrl}
          requestedTimecode={requestedTimecode}
          timecodeList={timecodeList}
          jumpToTimecode={setRequestedTimecode}
          isLoadingVideo={isLoadingVideo}
          videoError={videoError}
        />
      </section>

      <div className={c('tools', {inactive: !vidUrl})}>
        <section
          className={c('output', {['mode' + activeMode]: activeMode})}
          ref={scrollRef}
        >
          {isLoading ? (
            <div className="loading">
              Waiting for model<span>...</span>
            </div>
          ) : timecodeList ? (
            activeMode === 'Table' ? (
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Description</th>
                    <th>Objects</th>
                  </tr>
                </thead>
                <tbody>
                  {timecodeList.map(({time, text, objects}, i) => (
                    <tr
                      key={i}
                      role="button"
                      onClick={() => setRequestedTimecode(timeToSecs(time))}
                    >
                      <td>
                        <time>{time}</time>
                      </td>
                      <td>{text}</td>
                      <td>{objects.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeMode === 'Chart' ? (
              <Chart
                data={timecodeList}
                yLabel={chartLabel}
                jumpToTimecode={setRequestedTimecode}
              />
            ) : modes[activeMode].isList ? (
              <ul>
                {timecodeList.map(({time, text}, i) => (
                  <li key={i} className="outputItem">
                    <button
                      onClick={() => setRequestedTimecode(timeToSecs(time))}
                    >
                      <time>{time}</time>
                      <p className="text">{text}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              timecodeList.map(({time, text}, i) => (
                <>
                  <span
                    key={i}
                    className="sentence"
                    role="button"
                    onClick={() => setRequestedTimecode(timeToSecs(time))}
                  >
                    <time>{time}</time>
                    <span>{text}</span>
                  </span>{' '}
                </>
              ))
            )
          ) : null}
        </section>
      </div>
    </main>
  )
}
