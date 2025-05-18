import { useEffect, useRef } from "react";

const wsUrl = import.meta.env.VITE_BACKEND_WS || "ws://localhost:3000";
export default function VideoChunk() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null);
    const socket = useRef(null);
    const mediaStreamRef = useRef(null)
    const videoDecoder = useRef(null);

    useEffect(() => {
        videoDecoder.current = new VideoDecoder({
            output: handleFrame,
            error: (err) => console.error("Decoder Error:", err),
        });
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

                console.log("🔹 Received Chunk:", message);
                if (message.type == "key") {
                    let w = message.size.w; let h = message.size.h
                    console.log("WWW", w, "-----------------------------------", h);

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

                videoDecoder.current.decode(encodedChunk);
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
        <>
            <div>
                <h1>Live Video Stream</h1>
            </div>
            <video ref={videoRef} autoPlay style={{ width: '700px', border: '1px solid black' }} ></video >
            <button onClick={() => {
                mediaStreamRef.current = new MediaStream();
                videoRef.current.srcObject = mediaStreamRef.current;

                const stream = canvasRef.current.captureStream();
                const videoTrack = stream.getVideoTracks()[0]

                if (videoTrack) mediaStreamRef.current.addTrack(videoTrack)

                processVideo(canvasRef, ws, mediaStreamRef, videoRef)
            }}>Render</button>
            <button className="px-3 py-1 border border-black" onClick={() => {
                if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                } else if (videoRef.current.mozRequestFullScreen) { // Firefox
                    videoRef.current.mozRequestFullScreen();
                } else if (videoRef.current.webkitRequestFullscreen) { // Chrome, Safari, Opera
                    videoRef.current.webkitRequestFullscreen();
                } else if (videoRef.current.msRequestFullscreen) { // IE/Edge
                    videoRef.current.msRequestFullscreen();
                }
            }}>Full Screen</button>
            <canvas ref={canvasRef} hidden></canvas>

        </>
    );
}
