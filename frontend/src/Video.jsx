import { useEffect, useRef, useState } from "react"
const wsUrl = import.meta.env.VITE_BACKEND_WS || "ws://localhost:3000"

const processVideo = async (canvasRef, ws, mediaStreamRef, videoRef) => {
    if (!videoRef || !canvasRef) return

    ws.onmessage = async ({ data }) => {
        if (data instanceof Blob) {
            console.log("Blob received ");
            const imgBitmap = await createImageBitmap(data)

            canvasRef.current.width = imgBitmap.width
            canvasRef.current.height = imgBitmap.height

            const context = canvasRef.current.getContext('2d')
            context.drawImage(imgBitmap, 0, 0)
        }
        else {
            console.log("Message", data.toString());
        }
    }

}

export function Video() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const [ws, setWs] = useState(null)

    useEffect(() => {
        const ws = new WebSocket(wsUrl)
        setWs(ws)
        ws.onopen = () => {
            console.log("Connected");
        }

        ws.onerror = (err) => {
            console.log("Errrr", err);
        }

        // ws.onmessage = ({ data }) => {
        //     if (data instanceof Blob) {
        //     }
        //     else {
        //         console.log("Message", data.toString());
        //     }
        // }
        return () => { ws.close() }
    }, [])
    return <>
        <div>Video render</div>
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
}