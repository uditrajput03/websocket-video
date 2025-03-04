self.onmessage = (e) => {
    if (e.data === "start") {
        let start = Date.now()
        let sum = 0;
        for (let index = 0; index < 5000000000; index++) {
            sum += index * index;
        }

        self.postMessage([sum, Date.now() - start]);
    }
};
