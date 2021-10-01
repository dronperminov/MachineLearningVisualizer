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

NeuralNetwork.prototype.ZeroGradients = function() {
    for (let layer of this.layers) {
        layer.ZeroGradients()
    }
}

NeuralNetwork.prototype.ZeroWeightParams = function() {
    for (let layer of this.layers) {
        layer.ZeroWeightParams()
    }
}

NeuralNetwork.prototype.DisableNeuron = function(layer, neuron) {
    this.layers[layer].disabled[neuron] ^= true
}

NeuralNetwork.prototype.ChangeNeurons = function(index, delta) {
    let prevLayer = this.layers[index]
    let nextLayer = this.layers[index + 1]

    let size = prevLayer.outputs + delta

    this.layers[index] = new FullyConnectedLayer(prevLayer.inputs, size, prevLayer.activation)
    this.layers[index + 1] = new FullyConnectedLayer(size, nextLayer.outputs, nextLayer.activation)

    for (let i = 0; i < size && i < prevLayer.outputs; i++) {
        this.layers[index].b[i] = prevLayer.b[i].Copy()
        this.layers[index].disabled[i] = prevLayer.disabled[i]

        for (let j = 0; j < prevLayer.inputs; j++) {
            this.layers[index].w[i][j] = prevLayer.w[i][j].Copy()
        }
    }

    for (let i = 0; i < nextLayer.outputs; i++) {
        this.layers[index + 1].b[i] = nextLayer.b[i].Copy()
        this.layers[index + 1].disabled[i] = nextLayer.disabled[i]

        for (let j = 0; j < size && j < nextLayer.inputs; j++) {
            this.layers[index + 1].w[i][j] = nextLayer.w[i][j].Copy()
        }
    }
}

NeuralNetwork.prototype.RemoveLayer = function(index) {
    let prevLayer = this.layers[index]
    let layer = this.layers[index + 1]

    this.layers.splice(index, 1)
    this.layers[index] = new FullyConnectedLayer(prevLayer.inputs, layer.outputs, layer.activation)

    for (let i = 0; i < layer.outputs; i++) {
        this.layers[index].b[i] = layer.b[i].Copy()
        this.layers[index].disabled[i] = layer.disabled[i]

        for (let j = 0; j < prevLayer.inputs && j < layer.inputs; j++) {
            this.layers[index].w[i][j] = layer.w[i][j].Copy()
        }
    }
}

NeuralNetwork.prototype.Reset = function() {
    for (let layer of this.layers) {
        layer.InitWeights()
    }
}

NeuralNetwork.prototype.Forward = function(x) {
    this.layers[0].Forward(x)

    for (let i = 1; i < this.layers.length; i++)
        this.layers[i].Forward(this.layers[i - 1].output)

    return this.layers[this.layers.length - 1].output
}

NeuralNetwork.prototype.Backward = function(x, deltas) {
    let last = this.layers.length - 1

    if (last == 0) {
        this.layers[last].Backward(deltas, x, true)
    }
    else {
        this.layers[last].Backward(deltas, this.layers[last - 1].output, true)

        for (let i = last - 1; i > 0; i--)
            this.layers[i].Backward(this.layers[i + 1].dx, this.layers[i - 1].output, true)

        this.layers[0].Backward(this.layers[1].dx, x, false)
    }
}

NeuralNetwork.prototype.Predict = function(x) {
    x = this.layers[0].ForwardOnce(x)

    for (let i = 1; i < this.layers.length; i++)
        x = this.layers[i].ForwardOnce(x)

    return x
}

NeuralNetwork.prototype.PredictLayers = function(x) {
    let outputs = []

    outputs[0] = this.layers[0].ForwardOnce(x)

    for (let i = 1; i < this.layers.length; i++)
        outputs[i] = this.layers[i].ForwardOnce(outputs[i - 1])

    return outputs
}

NeuralNetwork.prototype.CalculateLoss = function(y, t, deltas, L) {
    let loss = 0

    for (let i = 0; i < y.length; i++) {
        deltas[i] = []
        loss += L.EvaluateDeltas(y[i], t[i], deltas[i])
    }

    return loss
}

NeuralNetwork.prototype.CalculateLossOnData = function(data, L) {
    let loss = 0

    for (let i = 0; i < data.length; i++)
        loss += L.Evaluate(this.Predict(data.x[i]), data.y[i])

    return loss / data.length
}

NeuralNetwork.prototype.TrainOnBatch = function(x, y, optimizer, L) {
    let output = this.Forward(x)
    let deltas = []
    let loss = this.CalculateLoss(output, y, deltas, L)

    this.ZeroGradients()
    this.Backward(x, deltas)

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

NeuralNetwork.prototype.PrintInfo = function() {
    for (let layer of this.layers) {
        layer.WeightInfo()
    }
}