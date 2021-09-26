function Optimizer(learningRate) {
    this.learningRate = learningRate
}

Optimizer.prototype.Update = function(weight, gradient) {
    weight -= this.learningRate * gradient
    return weight
}