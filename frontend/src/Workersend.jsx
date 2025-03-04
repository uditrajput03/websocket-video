import { useEffect, useRef, useState } from 'react'

export default function WorkerSend() {
    const [msg, setMsg] = useState("")
    const [socket, setSocket] = useState(null)
    const [screen, setScreen] = useState(null)
    const [cam, setCam] = useState(null)
    const video = useRef(null)
    const webcam = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(false)
    const worker = new Worker(new URL("./worker.js", import.meta.url));

    // useEffect(() => {
    //     const socket = new WebSocket('ws://localhost:3000')
    //     setSocket(socket);
    //     socket.onopen = () => {
    //         console.log('Connection established');
    //         socket.send('Hello Server!');
    //     };
    //     socket.onmessage = (message) => {
    //         console.log('Message received:', message.data);
    //         setMsg((message.data))
    //     };

    //     socket.onerror = (error) => {
    //         console.error('WebSocket error:', error);
    //     };

    //     socket.onclose = () => {
    //         console.log('WebSocket closed');
    //     };
    //     return () => {
    //         socket.onopen = null;
    //         socket.onmessage = null;
    //         socket.onerror = null;
    //         socket.onclose = null;
    //         socket.close()
    //     }
    // }, [])

    const shareVideo = async ({ video, setScreen: setVideo, socket = null, canvasRef = null, streamRef } = {}) => {
        if (video.current == null) return
        const media = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setVideo(media)
        console.log(media);
        video.current.srcObject = media
        streamRef.current = true
        let FPS = 30
        // const send = async () => {
        //     if (!canvasRef?.current || !socket || !streamRef.current) return;
        //     console.log("Inside send");
        //     const context = canvasRef.current.getContext('2d')
        //     canvasRef.current.width = video.current.videoWidth;
        //     canvasRef.current.height = video.current.videoHeight;
        //     context.drawImage(video.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        //     canvasRef.current.toBlob(blob => {
        //         if (blob && socket.readyState === WebSocket.OPEN) {
        //             socket.send(blob);
        //         }
        //         // requestAnimationFrame(send);
        //     }, "image/jpeg");
        // }
        const [videoTrack] = media.getVideoTracks();
        const imageCapture = new ImageCapture(videoTrack);

        // Tell worker to set up WebSocket connection
        worker.postMessage("init");
        // worker.postMessage({ stream, socket, frameRate }, [stream]);

        worker.onmessage = async (e) => {
            if (e.data === "nextFrame") {
                const frame = await imageCapture.grabFrame();
                worker.postMessage({ type: "nextFrame", frame }, [frame]);
            }
        };
        // const sendFrame = async () => {
        //     try {
        // const frame = await imageCapture.grabFrame();
        //         worker.postMessage({ frame, FPS: 30 }, [frame]); // Send to worker
        //     } catch (error) {
        //         console.error("Error capturing frame:", error);
        //     }

        //     setTimeout(sendFrame, 1000 / FPS); // Control FPS
        // };

        // sendFrame();
        // setInterval(send, 50)

        // let animationFrameId = null
        // const animationFrameSend = () => {
        //     send();
        //     animationFrameId = requestAnimationFrame(animationFrameSend);
        // };
        // send()
    }
    const shareCam = async (webcam, setCam) => {
        if (webcam.current) {
            const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCam(webcamStream)
            webcam.current.srcObject = webcamStream
        }
        else return null
    }

    const stopStream = ({ screen = null, cam = null, video = null, webcam = null, streamRef } = {}) => {
        if (screen) {
            screen.getTracks().forEach(track => track.stop());
            if (video.current) {
                video.current.srcObject = null;
            }
        }
        if (cam) {
            cam.getTracks().forEach(track => track.stop());
            if (webcam.current) {
                webcam.current.srcObject = null
            }
        }
        streamRef.current = false
    }
    return (
        <>
            <div>
                <div>message: {msg}</div>

                <div>
                </div>
                <br />
                <button onClick={() => shareVideo({ video, setScreen, canvasRef, socket, streamRef })}>Screen</button>
                <button onClick={() => shareCam(webcam, setCam)}>Camera</button>
                <button onClick={() => stopStream({ screen, video, cam, webcam, streamRef })}>Stop</button>
                <div>
                    <video ref={video} autoPlay style={{ width: '700px', border: '1px solid black' }}></video>
                    <video ref={webcam} autoPlay style={{ width: '200px', border: '1px solid black' }}></video>
                    <canvas ref={canvasRef} hidden></canvas>
                </div>
            </div>
        </>
    )
}
