import { useState } from "react";

export function NavBar({ fpsRef, qualityRef, scaleRef }) {
    const [fps, setFps] = useState(fpsRef.current);
    const [quality, setQuality] = useState(qualityRef.current);
    const [scale, setScale] = useState(scaleRef.current);
    const [customText, setCustomText] = useState("");

    return (
        <div className="flex gap-4 p-1 border-b">
            <label className="flex items-center gap-2">
                FPS:
                <input
                    type="number"
                    value={fps}
                    min={1}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        fpsRef.current = val;
                        setFps(val); // Sync state with ref
                    }}
                    className="border p-1 w-16"
                />
            </label>
            <label className="flex items-center gap-2">
                Quality:
                <input
                    type="number"
                    value={quality}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        qualityRef.current = val;
                        setQuality(val);
                    }}
                    className="border p-1 w-16"
                />
            </label>
            <label className="flex items-center gap-2">
                Scale:
                <input
                    type="number"
                    value={scale}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        scaleRef.current = val;
                        setScale(val);
                    }}
                    className="border p-1 w-16"
                />
            </label>
            <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="border p-1 w-24"
                placeholder="Custom"
            />
        </div>
    );
}
