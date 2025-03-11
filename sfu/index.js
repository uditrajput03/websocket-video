const express = require('express');
const { Server } = require('ws');
const mediasoup = require('mediasoup');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

app.use(express.static('public'));

let worker;
let router;
let transports = {};
let producers = {};
let consumers = {};

(async () => {
  worker = await mediasoup.createWorker();
  router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000
      }
    ]
  });

  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substring(2, 15);

    ws.on('message', async (msg) => {
      const data = JSON.parse(msg);
      const send = (d) => ws.send(JSON.stringify(d));

      if (data.action === 'getRtpCapabilities') {
        send({ action: 'rtpCapabilities', data: router.rtpCapabilities });
      }

      else if (data.action === 'createTransport') {
        const transport = await router.createWebRtcTransport({
          listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
          enableUdp: true,
          enableTcp: true,
          preferUdp: true
        });

        transports[id] = transport;

        send({
          action: 'transportCreated',
          data: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          }
        });
      }

      else if (data.action === 'connectTransport') {
        await transports[id].connect({ dtlsParameters: data.dtlsParameters });
        send({ action: 'transportConnected' });
      }

      else if (data.action === 'produce') {
        const producer = await transports[id].produce({
          kind: data.kind,
          rtpParameters: data.rtpParameters
        });

        producers[id] = producer;
        send({ action: 'produced', id: producer.id });

        // notify others
        for (let [otherId, wsClient] of wss.clients.entries()) {
          if (wsClient !== ws && wsClient.readyState === wsClient.OPEN) {
            wsClient.send(JSON.stringify({ action: 'newProducer', id }));
          }
        }
      }

      else if (data.action === 'consume') {
        const consumer = await transports[id].consume({
          producerId: producers[data.producerId].id,
          rtpCapabilities: data.rtpCapabilities,
          paused: false
        });

        consumers[id] = consumer;

        send({
          action: 'consumed',
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        });
      }
    });
  });

  server.listen(3000, () => {
    console.log('SFU running on http://localhost:3000');
  });
})();
