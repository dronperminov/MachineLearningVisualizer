function SupportVectorMachine(n, lambda) {
    this.n = n
    this.lambda = lambda

    this.Reset()
}

SupportVectorMachine.prototype.Reset = function() {   
    this.w = []
    this.b = new Weight()

    for (let i = 0; i <= this.n; i++) {
        this.w[i] = new Weight()
        this.w[i].value = 0
    }

    this.b.value = 0
}

SupportVectorMachine.prototype.SetLambda = function(lambda) {
    this.lambda = lambda
}

SupportVectorMachine.prototype.PredictOne = function(x) {
    let output = -this.b.value

    for (let i = 0; i < this.n; i++)
        output += x[i] * this.w[i].value

    return output
}

SupportVectorMachine.prototype.Predict = function(x) {
    let output = []

    for (let i = 0; i < x.length; i++)
        output[i] = this.PredictOne(x[i])

    return output
}

SupportVectorMachine.prototype.ComputeCost = function(x, y, output) {
    let distances = []
    let distanceSum = 0;

    for (let i = 0; i < x.length; i++) {
        distances[i] = Math.max(0, 1 - y[i] * output[i])
        distanceSum += distances[i]
    }

    return distanceSum / x.length
}

SupportVectorMachine.prototype.ComputeCostOnData = function(data) {
    return this.ComputeCost(data.x, data.y, this.Predict(data.x))
}

SupportVectorMachine.prototype.TrainOnExample = function(x, y, learningRate) {
    let output = this.PredictOne(x)
    let condition = y * output

    if (condition >= 1) {
        for (let i = 0; i < this.n; i++) {
            this.w[i].value -= learningRate * this.lambda * this.w[i].value
        }
    }
    else {
        for (let i = 0; i < this.n; i++) {
            this.w[i].value -= learningRate * (this.lambda * this.w[i].value - x[i] * y)
        }   

        this.b.value -= learningRate * y
    }
}

SupportVectorMachine.prototype.TrainEpoch = function(data, learningRate) {
    let loss = 0

    for (let i = 0; i < data.length; i++) {
        this.TrainOnExample(data.x[i], data.y[i], learningRate)
    }

    return loss / data.length
}