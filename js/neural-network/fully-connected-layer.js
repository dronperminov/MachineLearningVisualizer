function FullyConnectedLayer(inputs, outputs, activation) {
    this.inputs = inputs
    this.outputs = outputs
    this.activation = activation

    this.w = [] // весовые коэффициенты
    this.dw = [] // градиенты весовых коэффициентов

    this.b = [] // веса смещения
    this.db = [] // градиенты весов смещения

    this.InitWeights()
}


FullyConnectedLayer.prototype.GenerateWeight = function() {
    return Math.random() - 0.5
}

FullyConnectedLayer.prototype.InitWeights = function() {
    for (let i = 0; i < this.outputs; i++) {
        this.w[i] = []
        this.dw[i] = []

        for (let j = 0; j < this.inputs; j++) {
            this.w[i][j] = this.GenerateWeight()
            this.dw[i][j] = 0
        }

        this.b[i] = this.GenerateWeight()
        this.db[i] = 0
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
}

FullyConnectedLayer.prototype.Forward = function(x) {
    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let i = 0; i < this.outputs; i++) {
            let sum = this.b[i]

            for (let j = 0; j < this.inputs; j++)
                sum += this.w[i][j] * x[batchIndex][j]

            this.Activate(batchIndex, i, sum)
        }
    }
}

FullyConnectedLayer.prototype.Backward = function(dout, x, calc_dX) {
    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let i = 0; i < this.outputs; i++) {
            let delta = dout[batchIndex][i] * this.df[batchIndex][i]

            for (let j = 0; j < this.inputs; j++)
                this.dw[i][j] += delta * x[batchIndex][j]

            this.db[i] += delta
        }
    }

    if (!calc_dX)
        return

    for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        for (let j = 0; j < this.inputs; j++) {
            let sum = 0

            for (let i = 0; i < this.outputs; i++)
                sum += this.w[i][j] * dout[batchIndex][i] * this.df[batchIndex][i]

            this.dx[batchIndex][j] = sum
        }
    }
}

// обновление весовых коэффициентов
FullyConnectedLayer.prototype.UpdateWeights = function(optimizer) {
    for (let i = 0; i < this.outputs; i++) {
        for (let j = 0; j < this.inputs; j++) {
            this.w[i][j] = optimizer.Update(this.w[i][j], this.dw[i][j] / this.batchSize)
            this.dw[i][j] = 0
        }

        this.b[i] = optimizer.Update(this.b[i], this.db[i] / this.batchSize)
        this.db[i] = 0
    }
}
