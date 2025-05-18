let socket = null;
let encoder = null
let width = null
let height = null
let frameCount = 0;
let config = new Object()
const keyframeInterval = 30;
self.onmessage = async (event) => {

    let isDebug = false
    if (event.data.type === "init") {
        socket = new WebSocket(event.data.ws);
        socket.onopen = () => console.log("WebSocket connected in worker");
        socket.onerror = (error) => console.error("WebSocket error:", error);
        socket.onclose = () => console.log("WebSocket closed in worker");
    }
    if (!encoder) {
        encoder = new VideoEncoder({
            output: (chunk, metadata) => {
                if (isDebug) {
                    console.log("📦 Chunk available:", chunk);
                    console.log("📦 DATA available:", metadata);
                }

                // ✅ Convert chunk to transferable format
                const chunkData = new Uint8Array(chunk.byteLength);
                chunk.copyTo(chunkData);
                socket.send(
                    JSON.stringify({
                        size: { w: width, h: height },
                        type: chunk.type, // "key" or "delta"
                        timestamp: chunk.timestamp,
                        duration: chunk.duration,
                        data: Array.from(chunkData), // Convert Uint8Array to serializable format
                    })
                );
            },
            error: (err) => console.error("VideoEncoder Error:", err),
        });
    }
    const sendFrame = async (event) => {
        const { fps, quality, scale } = event.data;
        if (socket && socket.readyState === WebSocket.OPEN) {
            const { frame } = event.data;
            if (!frame) return;
            width = Math.round(frame.width * scale)
            height = Math.round(frame.height * scale)
            let newConfig = {
                codec: "vp8",
                width: width,
                height: height,
                bitrate: 1_000_000,
                framerate: fps,
            }
            if (JSON.stringify(config) != JSON.stringify(newConfig)) {
                encoder.configure(newConfig);
                config = newConfig
            }

            const videoFrame = new VideoFrame(frame, { timestamp: performance.now() });

            let blob = null; let encodeEnd = null; let encodeStart = null;
            if (isDebug) {
                encodeStart = performance.now();
                // blob = await canvas.convertToBlob({ type: "image/webp", quality: quality })
                await encoder.encode(videoFrame, { keyFrame: frameCount % keyframeInterval === 0 });
                encodeEnd = performance.now();
            }
            else {
                if (encoder.encodeQueueSize > 5) {
                    console.log("Encode queue full",encoder.encodeQueueSize );
                    
                }
                await encoder.encode(videoFrame, { keyFrame: frameCount % keyframeInterval === 0 });
                // await encoder.encode(videoFrame);
            }
            ++frameCount
            videoFrame.close();


            if (isDebug) {
                console.log(`Encode: ${encodeEnd - encodeStart}ms`);
                // console.log("Blob size:", (blob.size / 1024).toFixed(2), "KB");
            }
        }
        setTimeout(() => self.postMessage("nextFrame"), 1000 / fps);
    };

    self.onmessage = (e) => {
        if (e.data.type == "nextFrame") sendFrame(e);
    };

    sendFrame(event);
};
