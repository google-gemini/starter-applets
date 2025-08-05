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

import { useAtom } from "jotai";
import { useResetState, useSaveState } from "./hooks";
import {
  DetectTypeAtom,
  HoverEnteredAtom,
  ModelSelectedAtom,
  RevealOnHoverModeAtom,
  ShowConfigAtom,
} from "./atoms";
import { modelOptions } from "./consts";

export function TopBar() {
  const resetState = useResetState();
  const saveState = useSaveState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [modelSelected, setModelSelected] = useAtom(ModelSelectedAtom);
  const [showConfig,] = useAtom(ShowConfigAtom);

  return (
    <div className="flex w-full items-center px-3 py-2 border-b justify-between">
      <div className="flex gap-3 items-center">
        <button
          onClick={() => {
            resetState();
          }}
          className="p-0 border-none underline bg-transparent"
          style={{
            minHeight: "0",
          }}
        >
          <div>Reset session</div>
        </button>
        <button
          onClick={() => {
            saveState();
          }}
          className="p-0 border-none underline bg-transparent"
          style={{
            minHeight: "0",
          }}
        >
          <div>Save to Local</div>
        </button>
      </div>
      <div className="flex gap-3 items-center">
        {detectType === "2D bounding boxes" ? (
          <div>
            <label className="flex items-center gap-2 px-3 select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={revealOnHover}
                onChange={(e) => {
                  if (e.target.checked) {
                    setHoverEntered(false);
                  }
                  setRevealOnHoverMode(e.target.checked);
                }}
              />
              <div>reveal on hover</div>
            </label>
          </div>
        ) : null}
        {showConfig && (<label className="flex gap-2 items-center">
          <select
            className="border bg-transparent py-1 px-1 focus:border-[#80BBFF] rounded-md"
            value={modelSelected}
            onChange={(e) => {
              const value = e.target.value;
              setModelSelected(value);
            }}
          >
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>)}
      </div>
    </div>
  );
}
