function Weight() {
    this.value = Math.random() - 0.5
    this.grad = 0
    this.param1 = 0
    this.param2 = 0
}

Weight.prototype.Copy = function() {
    let weight = new Weight()

    weight.value = this.value
    weight.grad = this.grad
    weight.param1 = this.param1
    weight.param2 = this.param2

    return weight
}