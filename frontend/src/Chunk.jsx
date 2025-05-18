import { useEffect, useRef } from "react";

const wsUrl = import.meta.env.VITE_BACKEND_WS || "ws://localhost:3000";
export default function VideoReceiver() {
    const canvasRef = useRef(null);
    const socket = useRef(null);
    const videoDecoder = useRef(null);

    useEffect(() => {

        videoDecoder.current = new VideoDecoder({
            output: handleFrame,
            error: (err) => console.error("Decoder Error:", err),
        });
        let isKeyRendered = false
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        let pendingFrames = [];
        let underflow = true;
        let baseTime = 0;
        function handleFrame(frame) {

            pendingFrames.push(frame);
            if (underflow) setTimeout(renderFrame, 0);
        }

        function calculateTimeUntilNextFrame(timestamp) {
            if (baseTime == 0) baseTime = performance.now();
            let mediaTime = performance.now() - baseTime;
            return Math.max(0, timestamp / 1000 - mediaTime);
        }

        async function renderFrame() {
            underflow = pendingFrames.length == 0;
            if (underflow) return;

            const frame = pendingFrames.shift();

            // Based on the frame's timestamp calculate how much of real time waiting
            // is needed before showing the next frame.
            const timeUntilNextFrame = calculateTimeUntilNextFrame(frame.timestamp);
            await new Promise((r) => {
                setTimeout(r, timeUntilNextFrame);
            });
            ctx.drawImage(frame, 0, 0);
            frame.close();
            setTimeout(renderFrame, 0);
        }

        videoDecoder.current.configure({ codec: "vp8" });

        socket.current = new WebSocket(wsUrl);
        socket.current.binaryType = "arraybuffer"; // Ensure raw binary data

        socket.current.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);

                if (!message.data) {
                    console.warn("⚠️ Invalid chunk received:", message);
                    return;
                }
                const chunkData = new Uint8Array(message.data);

                // console.log("🔹 Received Chunk:");
                if (!isKeyRendered && message.type != "key") {
                    console.log("First key needed")
                    return
                }
                if (message.type == "key") {
                    isKeyRendered = true
                    let w = message.size.w; let h = message.size.h
                    // console.log("WWW", w, "-----------------------------------", h);

                    if (!w || !h) return
                    if (canvas.width != w || canvas.height != h) {
                        canvas.width = w
                        canvas.height = h
                    }
                }
                const encodedChunk = new EncodedVideoChunk({
                    type: message.type,
                    timestamp: message.timestamp,
                    data: chunkData,
                });
                console.log("video decode queue", videoDecoder.current.decodeQueueSize);
                if (videoDecoder.current.decodeQueueSize < 5) {
                    videoDecoder.current.decode(encodedChunk);
                }
                else{
                    console.log("Decoder Queue is full");
                    
                }


            } catch (err) {
                console.error("❌ Failed to decode chunk:", err);
            }
        };


        return () => {
            socket.current.close();
            videoDecoder.current.close();
        };
    }, []);

    return (
        <div>
            <h1>Live Video Stream</h1>
            <canvas ref={canvasRef} style={{ border: "1px solid black" }}></canvas>
        </div>
    );
}
