let socket = null;

self.onmessage = async (event) => {

    if (event.data === "init") {
        socket = new WebSocket('ws://localhost:3000');

        socket.onopen = () => console.log("WebSocket connected in worker");
        socket.onerror = (error) => console.error("WebSocket error:", error);
        socket.onclose = () => console.log("WebSocket closed in worker");
    }

    const sendFrame = async (event) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const frame = event.data.frame;
            if (!frame) return;

            const canvas = new OffscreenCanvas(frame.width, frame.height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.2 })

            socket.send(blob); // Send processed frame over WebSocket
        }
        setTimeout(() => self.postMessage("nextFrame"), 1000 / 30);
    };

    self.onmessage = (e) => {
        if (e.data.type == "nextFrame") sendFrame(e);
    };

    sendFrame();
};
