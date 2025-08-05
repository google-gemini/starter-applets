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
import {
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BumpSessionAtom,
  ImageSentAtom,
  PointsAtom,
  ImageSrcAtom,
  LinesAtom,
  DetectTypeAtom,
} from "./atoms";

export function useResetState() {
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);

  return () => {
    setImageSent(false);
    setBoundingBoxes2D([]);
    setBoundingBoxes3D([]);
    setBumpSession((prev) => prev + 1);
    setPoints([]);
  };
}

export function useSaveState() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [boundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [points] = useAtom(PointsAtom);
  const [lines] = useAtom(LinesAtom);
  const [detectType] = useAtom(DetectTypeAtom);

  return () => {
    const state = {
      imageSrc,
      boundingBoxes2D,
      boundingBoxes3D,
      points,
      lines,
      detectType,
    };

    const content = JSON.stringify(state, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spatial-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };
}
