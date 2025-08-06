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

// script.js
// Authors: kylephillips@ bencobley@

import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai@0.21.0";
import * as mapsFunction from "./function-declarations.js";
import { presets } from "./presets.js";
import { html, render } from "https://esm.run/lit";

const client = new GoogleGenerativeAI("your_key_here");
const systemInstruction = mapsFunction.systemInstructions;

const functionDeclarations = mapsFunction.declarations.map(declaration => ({
  ...declaration,
  callback: (args) => {
    const { location, caption } = args;
    renderPage(location, caption);
  },
}));

const chat = async (userText) => {
  try {
    const temperature = 2; // High temperature for answer variety
    const {response} = await client
      .getGenerativeModel(
        {model: 'models/gemini-2.0-flash-exp', systemInstruction},
        {apiVersion: 'v1beta'}
      )
      .generateContent({
        contents: [
          {
            role: "user",
            parts: [{text: userText}],
          },
        ],
        generationConfig: {temperature},
        tools: [{functionDeclarations}]
      });

    const call = response.functionCalls()[0];

    if (call) {
      functionDeclarations[0].callback(call.args);
    } else {
      const geminiResponse = response.text();
      messagesDiv.innerHTML += `<p><b>Gemini:</b> ${geminiResponse}</p>`;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      
      // Text-to-speech for Gemini's response
      const utterance = new SpeechSynthesisUtterance(geminiResponse);
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error(e);
    messagesDiv.innerHTML += `<p><b>Gemini:</b> Error: ${e.message}</p>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

async function init() {
  renderPage("%"); // Start by rendering with empty location query: shows earth
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.documentElement.removeAttribute("data-theme"); // Use default (dark)
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }

  const saveLocalButton = document.querySelector("#save-local-button");
  saveLocalButton.addEventListener("click", () => {
    const location = document.querySelector("#map iframe").src;
    const caption = document.querySelector("#caption p")?.textContent || "";
    const content = `Location: ${location}\nCaption: ${caption}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map-data.txt";
    a.click();
    URL.revokeObjectURL(url);
  });

  const chatInput = document.querySelector("#chat-input");
  const sendButton = document.querySelector("#send-button");
  const messagesDiv = document.querySelector("#messages");
  const voiceInputButton = document.querySelector("#voice-input-button");

  const sendMessage = async () => {
    const userText = chatInput.value;
    if (userText.trim() === "") return;

    messagesDiv.innerHTML += `<p><b>You:</b> ${userText}</p>`;
    chatInput.value = "";
    await chat(userText);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  sendButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.addEventListener('result', (e) => {
      const transcript = Array.from(e.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      chatInput.value = transcript;
      sendMessage();
    });

    recognition.addEventListener('error', (e) => {
      console.error('Speech recognition error:', e.error);
      alert('Speech recognition error: ' + e.error);
    });

    recognition.start();
  };

  voiceInputButton.addEventListener("click", handleVoiceInput);
}

init();

function renderPage(location, caption = "") {
  const root = document.querySelector("#root");
  caption = caption.replace(/\\/g, '');
  render(
    html`
      <div id="map">${mapsFunction.embed(location)}</div>
      ${caption
        ? html`<div id="caption"><p>${caption}</p></div>`
        : ""}
      <div id="presets-container">
      <span id="take-me-somewhere">Take me somewhere...</span>
        <div id="presets">
              ${presets.map(
          ([name, message]) =>
            html`<button @click=${() => chat(message)} class="preset">
                    ${name}
                  </button>`
        )}
        </div>
      </div>
    `,
    root
  );
}
