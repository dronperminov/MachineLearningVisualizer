function Optimizer(learningRate, lambda = 0, algorithm = 'sgd') {
    this.learningRate = learningRate
    this.lambda = lambda
    this.algorithm = algorithm
    this.update = this.UpdateSGD
    this.epoch = 1

    if (this.algorithm == 'sgdm') {
        this.beta = 0.9
        this.update = this.UpdateMomentumSGD
    }
    else if (this.algorithm == 'nag') {
        this.beta = 0.9
        this.update = this.UpdateNAG
    }
    else if (this.algorithm == 'adam') {
        this.beta1 = 0.9
        this.beta2 = 0.999
        this.update = this.UpdateAdam
    }
    else if (this.algorithm == 'nadam') {
        this.beta1 = 0.9
        this.beta2 = 0.999
        this.update = this.UpdateNAdam
    }
}

Optimizer.prototype.SetLearningRate = function(learningRate) {
    this.learningRate = learningRate
}

Optimizer.prototype.SetRegularization = function(lambda) {
    this.lambda = lambda
}

Optimizer.prototype.UpdateSGD = function(weight, batchSize) {
    weight.value -= this.learningRate / batchSize * weight.grad
}

Optimizer.prototype.UpdateMomentumSGD = function(weight, batchSize) {
    weight.param1 = this.beta * weight.param1 + this.learningRate / batchSize * weight.grad
    weight.value -= weight.param1
}

Optimizer.prototype.UpdateNAG = function(weight, batchSize) {
    let prev = weight.param1
    weight.param1 = this.beta * weight.param1 - this.learningRate / batchSize * weight.grad
    weight.value += this.beta * (weight.param1 - prev) + weight.param1
}

Optimizer.prototype.UpdateNAdam = function(weight, batchSize) {
    let mt1 = weight.param1 / (1 - Math.pow(this.beta1, this.epoch))

    weight.param1 = this.beta1 * weight.param1 + (1 - this.beta1) * weight.grad
    weight.param2 = this.beta2 * weight.param2 + (1 - this.beta2) * weight.grad * weight.grad

    let Vt = weight.param1 / (1 - Math.pow(this.beta1, this.epoch))
    let St = weight.param2 / (1 - Math.pow(this.beta2, this.epoch))

    weight.value -= this.learningRate / batchSize * (this.beta1 * mt1 + (1 - this.beta1) / (1 - Math.pow(this.beta1, this.epoch)) * weight.grad) / (Math.sqrt(St) + 1e-7)
}

Optimizer.prototype.UpdateAdam = function(weight, batchSize) {
    weight.param1 = this.beta1 * weight.param1 + (1 - this.beta1) * weight.grad
    weight.param2 = this.beta2 * weight.param2 + (1 - this.beta2) * weight.grad * weight.grad

    let mt = weight.param1 / (1 - Math.pow(this.beta1, this.epoch))
    let vt = weight.param2 / (1 - Math.pow(this.beta2, this.epoch))

    weight.value -= this.learningRate / batchSize * mt / (Math.sqrt(vt) + 1e-8)
}

Optimizer.prototype.Update = function(weight, batchSize) {
    weight.value -= this.learningRate * this.lambda / batchSize * weight.value
    this.update(weight, batchSize)
}

Optimizer.prototype.UpdateEpoch = function() {
    this.epoch++
}