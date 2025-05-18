import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Receive from './Receive.jsx'
import { Video } from './Video.jsx'
import Send from './Send.jsx'
import WorkerTest from './Worker.jsx'
import WorkerSend from './Workersend.jsx'
import Sqoosh from './Sqoosh.jsx'
import VideoReceiver from './Chunk.jsx'
import VideoChunk from './VideoChunk.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/worker' element={<WorkerSend />} />
        <Route path='/workertest' element={<WorkerTest />} />
        <Route path='/send' element={<Send />} />
        <Route path='/sqoosh' element={<Sqoosh />} />
        <Route path='/receive' element={<Receive />} />
        <Route path='/video' element={<Video />} />
        <Route path='/chunk' element={<VideoReceiver />} />
        <Route path='/videochunk' element={<VideoChunk />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
