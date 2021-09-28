function NeuralNetwork(inputs) {
    this.inputs = inputs
    this.outputs = inputs
    this.layers = []
}

NeuralNetwork.prototype.AddLayer = function(description) {
    let layer = null

    if (description['name'] == 'fc') {
        layer = new FullyConnectedLayer(this.outputs, description['size'], description['activation'])
    }
    else if (description['name'] == 'softmax') {
        layer = new SoftmaxLayer(this.outputs)
    }

    this.layers.push(layer)
    this.outputs = layer.outputs
}

NeuralNetwork.prototype.SetBatchSize = function(batchSize) {
    this.batchSize = batchSize

    for (let layer of this.layers) {
        layer.SetBatchSize(batchSize)
    }
}

NeuralNetwork.prototype.SetActivation = function(activation) {
    for (let i = 0; i < this.layers.length - 1; i++) {
        this.layers[i].SetActivation(activation)
    }
}

NeuralNetwork.prototype.Forward = function(x) {
    this.layers[0].Forward(x)

    for (let i = 1; i < this.layers.length; i++)
        this.layers[i].Forward(this.layers[i - 1].output)

    return this.layers[this.layers.length - 1].output
}

NeuralNetwork.prototype.CalculateLoss = function(y, t, deltas, L) {
    let loss = 0

    for (let i = 0; i < y.length; i++) {
        deltas[i] = []
        loss += L(y[i], t[i], deltas[i])
    }

    return loss
}

NeuralNetwork.prototype.TrainOnBatch = function(x, y, optimizer, L) {
    let last = this.layers.length - 1
    let output = this.Forward(x)
    let deltas = []

    let loss = this.CalculateLoss(output, y, deltas, L)

    if (last == 0) {
        this.layers[last].Backward(deltas, x, true)
    }
    else {
        this.layers[last].Backward(deltas, this.layers[last - 1].output, true)

        for (let i = last - 1; i > 0; i--)
            this.layers[i].Backward(this.layers[i + 1].dx, this.layers[i - 1].output, true)

        this.layers[0].Backward(this.layers[1].dx, x, false)
    }

    for (let layer of this.layers) {
        layer.UpdateWeights(optimizer)
    }

    return loss
}

NeuralNetwork.prototype.TrainEpoch = function(batches, batchSize, optimizer, L) {
    this.SetBatchSize(batchSize)

    let loss = 0

    for (let i = 0; i < batches.length; i++) {
        loss += this.TrainOnBatch(batches.x[i], batches.y[i], optimizer, L)
    }

    optimizer.UpdateEpoch()

    return loss / batches.length / batchSize
}

NeuralNetwork.prototype.Train = function(trainData, testData, epoches, batchSize, optimizer, L) {
    let batches = this.SplitOnBatches(trainData, batchSize)
    let loss = 0

    for (let epoch = 1; epoch <= epoches; epoch++) {
        loss = this.TrainEpoch(batches, batchSize, optimizer, L) / trainData.length
    }

    return loss
}