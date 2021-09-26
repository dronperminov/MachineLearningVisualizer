function SoftmaxLayer(size) {
    this.inputs = size
    this.outputs = size
}

SoftmaxLayer.prototype.SetBatchSize = function(batchSize) {
    this.batchSize = batchSize
    this.output = []
    this.dx = []

    for (let i = 0; i < this.batchSize; i++) {
        this.output[i] = []
        this.dx[i] = []

        for (let j = 0; j < this.outputs; j++) {
            this.output[i][j] = 0
            this.dx[i][j] = 0
        }
    }
}

SoftmaxLayer.prototype.Forward = function(x) {
    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        let sum = 0

        for (let i = 0; i < this.outputs; i++) {
            this.output[batchIndex][i] = Math.exp(x[batchIndex][i])
            sum += this.output[batchIndex][i]
        }

        for (let i = 0; i < this.outputs; i++)
            this.output[batchIndex][i] /= sum
    }
}

SoftmaxLayer.prototype.Backward = function(dout, x, calc_dX) {
    if (!calc_dX)
        return

    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let i = 0; i < this.outputs; i++) {
            let sum = 0

            for (let j = 0; j < this.outputs; j++)
                sum += dout[batchIndex][j] * this.output[batchIndex][i] * ((i == j) - this.output[batchIndex][j])

            this.dx[batchIndex][i] = sum
        }
    }
}

SoftmaxLayer.prototype.UpdateWeights = function(optimizer) {

}