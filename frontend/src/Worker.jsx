import { useState } from "react"
export default function WorkerTest() {
    const [count, setCount] = useState(0)
    const [ans, setAns] = useState(0)
    const [timeTaken, setTime] = useState(0)
    const worker = new Worker(new URL("./getAns.js", import.meta.url));


    const getAns = () => {
        let startTime = Date.now()
        let sum = 0
        for (let index = 0; index < 5000000000; index++) {
            sum += index * index
        }
        setAns(sum)
        setTime(Date.now() - startTime)
    }
    const getAnsWorker = () => {
        worker.postMessage('start')
        worker.onmessage = e => {
            setAns(e.data[0])
            setTime(e.data[1])
        }
    }
    return <>
        <div>Time Taken {timeTaken} ms</div>
        <button onClick={getAns}>Calculate Normal {ans}</button>
        <button onClick={getAnsWorker}>Calculate Worker {ans}</button>
        <br />
        <button onClick={() => setCount((c) => c + 1)}>Count {count}</button>
    </>
}