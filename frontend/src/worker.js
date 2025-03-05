let socket = null;

self.onmessage = async (event) => {

    let isDebug = false
    if (event.data.type === "init") {
        socket = new WebSocket(event.data.ws);

        socket.onopen = () => console.log("WebSocket connected in worker");
        socket.onerror = (error) => console.error("WebSocket error:", error);
        socket.onclose = () => console.log("WebSocket closed in worker");
    }

    const sendFrame = async (event) => {
        // const totalStart = performance.now();
        const { fps, quality, scale } = event.data;
        if (socket && socket.readyState === WebSocket.OPEN) {
            const { frame } = event.data;
            if (!frame) return;
            const width = Math.round(frame.width * scale)
            const height = Math.round(frame.height * scale)
            // let newFrame = frame;
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext("2d");
            // ctx.imageSmoothingEnabled = false;

            let blob = null
            let encodeEnd = null
            let encodeStart = null
            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            if (isDebug) {
                encodeStart = performance.now();
                blob = await canvas.convertToBlob({ type: "image/webp", quality: quality })
                encodeEnd = performance.now();
            }

            blob = await canvas.convertToBlob({ type: "image/webp", quality: quality })
            socket.send(blob); // Send processed frame over WebSocket
            // newFrame.close();

            if (isDebug) {
                // const totalEnd = performance.now();
                console.log(`Encode: ${encodeEnd - encodeStart}ms`);
                // console.log(`Total: ${totalEnd - totalStart}ms`);
                console.log("Blob size:", (blob.size / 1024).toFixed(2), "KB");
            }
        }
        setTimeout(() => self.postMessage("nextFrame"), 1000 / fps);
    };

    self.onmessage = (e) => {
        if (e.data.type == "nextFrame") sendFrame(e);
    };

    sendFrame(event);
};
