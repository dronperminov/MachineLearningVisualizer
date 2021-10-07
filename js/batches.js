function SplitOnBatches(data, batchSize, isRandom = false) {
    let x = []
    let y = []

    for (let i = 0; i < data.length; i += batchSize) {
        let batchX = []
        let batchY = []

        for (j = 0; j < batchSize; j++) {
            let index = isRandom ? Math.floor(Math.random() * data.length) : (i + j) % data.length
            batchX.push(data.x[index])
            batchY.push(data.y[index])
        }

        x.push(batchX)
        y.push(batchY)
    }

    return { x: x, y: y, length: x.length }
}
