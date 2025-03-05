import { useEffect, useRef, useState } from "react";
const wsUrl = import.meta.env.VITE_BACKEND_WS || "ws://localhost:3000"

const renderImg = (imgRef, img) => {
    if (!img || !imgRef.current) return null


}

export default function Receive() {
    const [socket, setSocket] = useState(null);
    const [msg, setMsg] = useState("");
    const [image, setImage] = useState(null);
    const imgRef = useRef(null)

    useEffect(() => {
        const ws = new WebSocket(wsUrl);
        setSocket(ws);

        ws.onopen = () => {
            console.log("Connection is opened");
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                console.log("Received Blob data");

                // Convert Blob to Object URL
                const imageUrl = URL.createObjectURL(event.data);

                // Set image source
                setImage(imageUrl);

                // Set imageRef source (optional)
                // if (imgRef.current) {
                //     imgRef.current.src = imageUrl;
                // }
            }
            else {
                console.log("Message received:", event.data);
                setMsg(event.data);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <>
            <div>
                <h2>Message received:</h2>
                <p>{msg}</p>
                <img ref={imgRef} src={image} style={{ width: '500px', border: '1px solid black' }} alt="Live" />
            </div>
        </>
    );
}
