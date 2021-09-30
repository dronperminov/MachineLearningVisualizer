function Weight() {
    this.value = Math.random() - 0.5
    this.grad = 0
    this.param1 = 0
    this.param2 = 0
    this.param3 = 0
}

Weight.prototype.Copy = function() {
    let weight = new Weight()

    weight.value = this.value
    weight.grad = this.grad
    weight.param1 = this.param1
    weight.param2 = this.param2
    weight.param3 = this.param3

    return weight
}