function LossFunction() {

}

LossFunction.prototype.EvaluateDeltas = function(y, t, deltas) {
    let loss = 0

    for (let i = 0; i < y.length; i++) {
        let e = y[i] - t[i]
        deltas[i] = 2*e
        loss += e*e
    }

    return loss
}

LossFunction.prototype.Evaluate = function(y, t) {
    let loss = 0

    for (let i = 0; i < y.length; i++) {
        let e = y[i] - t[i]
        loss += e*e
    }

    return loss
}
