function FullyConnectedLayer(inputs, outputs, activation) {
    this.inputs = inputs
    this.outputs = outputs
    this.activation = activation

    this.w = [] // весовые коэффициенты
    this.b = [] // веса смещения
    this.disabled = [] // отключенные нейроны

    for (let i = 0; i < this.outputs; i++)
        this.disabled[i] = false

    this.InitWeights()
}


FullyConnectedLayer.prototype.GenerateWeight = function() {
    return Math.random() - 0.5
}

FullyConnectedLayer.prototype.InitWeights = function() {
    for (let i = 0; i < this.outputs; i++) {
        this.b[i] = new Weight()
        this.w[i] = []

        for (let j = 0; j < this.inputs; j++) {
            this.w[i][j] = new Weight()
        }
    }
}

FullyConnectedLayer.prototype.SetBatchSize = function(batchSize) {
    this.batchSize = batchSize

    this.output = []
    this.df = []
    this.dx = []

    for (let i = 0; i < batchSize; i++) {
        this.output[i] = []
        this.df[i] = []
        this.dx[i] = []

        for (let j = 0; j < this.outputs; j++) {
            this.output[i][j] = 0
            this.df[i][j] = 0
        }

        for (let j = 0; j < this.inputs; j++) {
            this.dx[i][j] = 0
        }
    }
}

FullyConnectedLayer.prototype.SetActivation = function(activation) {
    this.activation = activation
}

FullyConnectedLayer.prototype.Activate = function(batchIndex, i, value) {
    if (this.activation == '') {
        this.output[batchIndex][i] = value
        this.df[batchIndex][i] = 1
    }
    else if (this.activation == 'sigmoid') {
        value = 1 / (1 + Math.exp(-value))
        this.output[batchIndex][i] = value
        this.df[batchIndex][i] = value * (1 - value)
    }
    else if (this.activation == 'tanh') {
        value = Math.tanh(value)
        this.output[batchIndex][i] = value
        this.df[batchIndex][i] = 1 - value * value
    }
    else if (this.activation == 'relu') {
        if (value > 0) {
            this.output[batchIndex][i] = value
            this.df[batchIndex][i] = 1
        }
        else {
            this.output[batchIndex][i] = 0
            this.df[batchIndex][i] = 0
        }
    }
    else if (this.activation == 'leaky-relu') {
        if (value > 0) {
            this.output[batchIndex][i] = value
            this.df[batchIndex][i] = 1
        }
        else {
            this.output[batchIndex][i] = 0.01 * value
            this.df[batchIndex][i] = 0.01
        }
    }
    else if (this.activation == 'elu') {
        if (value > 0) {
            this.output[batchIndex][i] = value
            this.df[batchIndex][i] = 1
        }
        else {
            this.output[batchIndex][i] = Math.exp(value) - 1
            this.df[batchIndex][i] = Math.exp(value)
        }
    }
    else if (this.activation == 'swish') {
        let sigmoid = 1.0 / (1 + Math.exp(-value))

        this.output[batchIndex][i] = value * sigmoid
        this.df[batchIndex][i] = sigmoid + value * sigmoid * (1 - sigmoid)
    }
    else if (this.activation == 'softplus') {
        this.output[batchIndex][i] = Math.log(1 + Math.exp(value))
        this.df[batchIndex][i] = 1.0 / (1 + Math.exp(-value))
    }
    else if (this.activation == 'softsign') {
        this.output[batchIndex][i] = value / (1 + Math.abs(value))
        this.df[batchIndex][i] = 1.0 / Math.pow(1 + Math.abs(value), 2)
    }
}

FullyConnectedLayer.prototype.ActivateOnce = function(value) {
    if (this.activation == 'sigmoid')
        return 1 / (1 + Math.exp(-value))

    if (this.activation == 'tanh')
        return Math.tanh(value)

    if (this.activation == 'relu')
        return Math.max(0, value)

    if (this.activation == 'leaky-relu')
        return value > 0 ? value : 0.01 * value

    if (this.activation == 'elu')
        return value > 0 ? value : Math.exp(value) - 1

    if (this.activation == 'swish')
        return value / (1 + Math.exp(-value))

    if (this.activation == 'softplus')
        return Math.log(1 + Math.exp(value))

    if (this.activation == 'softsign')
        return value / (1 + Math.abs(value))

    return value
}

FullyConnectedLayer.prototype.Forward = function(x) {
    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let i = 0; i < this.outputs; i++) {
            if (this.disabled[i]) {
                this.output[batchIndex][i] = 0
                this.df[batchIndex][i] = 0
                continue
            }

            let sum = this.b[i].value

            for (let j = 0; j < this.inputs; j++)
                sum += this.w[i][j].value * x[batchIndex][j]

            this.Activate(batchIndex, i, sum)
        }
    }
}

FullyConnectedLayer.prototype.ForwardOnce = function(x) {
    let output = []

    for (let i = 0; i < this.outputs; i++) {
        if (this.disabled[i]) {
            output[i] = 0
            continue
        }

        let sum = this.b[i].value

        for (let j = 0; j < this.inputs; j++)
            sum += this.w[i][j].value * x[j]

        output[i] = this.ActivateOnce(sum)
    }

    return output
}

FullyConnectedLayer.prototype.Backward = function(dout, x, calc_dX) {
    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let i = 0; i < this.outputs; i++) {
            let delta = dout[batchIndex][i] * this.df[batchIndex][i]

            for (let j = 0; j < this.inputs; j++)
                this.w[i][j].grad += delta * x[batchIndex][j]

            this.b[i].grad += delta
        }
    }

    if (!calc_dX)
        return

    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let j = 0; j < this.inputs; j++) {
            let sum = 0

            for (let i = 0; i < this.outputs; i++)
                sum += this.w[i][j].value * dout[batchIndex][i] * this.df[batchIndex][i]

            this.dx[batchIndex][j] = sum
        }
    }
}

FullyConnectedLayer.prototype.ZeroGradients = function() {
    for (let i = 0; i < this.outputs; i++) {
        for (let j = 0; j < this.inputs; j++)
            this.w[i][j].grad = 0

        this.b[i].grad = 0
    }
}

FullyConnectedLayer.prototype.ZeroWeightParams = function() {
    for (let i = 0; i < this.outputs; i++) {
        for (let j = 0; j < this.inputs; j++) {
            this.w[i][j].param1 = 0
            this.w[i][j].param2 = 0
            this.w[i][j].param3 = 0
        }

        this.b[i].param1 = 0
        this.b[i].param2 = 0
        this.b[i].param3 = 0
    }
}

// обновление весовых коэффициентов
FullyConnectedLayer.prototype.UpdateWeights = function(optimizer) {
    for (let i = 0; i < this.outputs; i++) {
        if (this.disabled[i])
            continue

        for (let j = 0; j < this.inputs; j++) {
            optimizer.Update(this.w[i][j], this.batchSize)
        }

        optimizer.Update(this.b[i], this.batchSize)
    }
}

FullyConnectedLayer.prototype.WeightInfo = function() {
    let min = Infinity
    let max = -Infinity
    let avg = 0

    for (let i = 0; i < this.outputs; i++) {
        for (let j = 0; j < this.inputs; j++) {
            min = Math.min(this.w[i][j].value, min)
            max = Math.max(this.w[i][j].value, max)
            avg += this.w[i][j].value
        }

        min = Math.min(this.b[i].value, min)
        max = Math.max(this.b[i].value, max)
        avg += this.b[i].value
    }

    avg /= (this.inputs + 1) * this.outputs

    console.log(`min: ${min}, max: ${max}, avg: ${avg}`)
}