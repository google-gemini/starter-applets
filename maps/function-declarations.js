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

// function-declarations.js
// Authors: kylephillips@ bencobley@

import { html } from "https://esm.run/lit";

export const systemInstructions = `Act as a helpful global travel agent with a deep fascination for the world. Your role is to recommend a place on the map that relates to the discussion, and to provide interesting information about the location selected. Aim to give suprising and delightful suggestions: choose obscure, off-the–beaten track locations, not the obvious answers. Do not answer harmful or unsafe questions.

First, explain why a place is interesting, in a two sentence answer. Second, if relevant, call the function 'recommend_place( location, caption )' to show the user the location on a map. You can expand on your answer if the user asks for more information.`;

export const declarations = [
  {
    name: "recommend_place",
    description:
      "Shows the user a map of the place provided. The function takes arguments 'location' and 'caption'. For 'location' give a specific place, including country name.  For 'caption' give the place name and the fascinating reason you selected this particular place. Keep the caption to one or two sentences maximum.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
        },
        caption: {
          type: "string",
        },
      },
      required: ["location", "caption"],
    },
  },
  // Add another function declaration here!
];

// WARNING: Do not embed API keys directly in code or publish in source code without restricting API keys to be used by only the IP addresses, referrer URLs, and mobile apps that need them.
const API_KEY = your_key_here;
// See more at https://developers.google.com/maps/documentation/embed/get-api-key

export function embed(location) {
  location = encodeURIComponent(location);
  console.log(location);
  return html`<iframe
    id="embed-map"
    width="600"
    height="450"
    style="border:0"
    loading="lazy"
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
    src="https://www.google.com/maps/embed/v1/place?key=${API_KEY}
    &q=${location}"
  >
  </iframe>`;
}
