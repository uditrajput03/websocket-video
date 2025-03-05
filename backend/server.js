import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import fs from 'fs'
const app = express()

app.get('/', (req, res) => {
    res.json({ msg: "Server is up" })
})
const server = app.listen(3000, () => console.log("listening on 3000"))

const wss = new WebSocketServer({ server })

wss.on('connection', ((ws) => {
    ws.send('Hello from websocket')
    ws.on('error', console.error)

    ws.on('message', (msg, isBinary) => {
        if (isBinary) {
            // console.log("Binary data receiver");
            // fs.writeFile(`./images/image-${Date.now()}.jpg`, msg, (err) => {
            //     if (err) {
            //         console.log("Error in writting", err);
            //     }
            //     else {
            //         console.log("Image saved");
            //     }
            // })
        }
        else {
            console.log("Message received ", msg.toString());
        }
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState == WebSocket.OPEN) {
                client.send(msg, { binary: isBinary })
            }
        })

    })



}))