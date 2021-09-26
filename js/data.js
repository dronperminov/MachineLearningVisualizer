const SPIRAL_DATA = 'SPIRAL_DATA'
const CIRCLE_DATA = 'CIRCLE_DATA'
const AREAS_DATA = 'AREAS_DATA'
const SQUARE_DATA = 'SQUARE_DATA'

function DataGenerator(mode, noise = 0) {
    this.mode = mode
    this.noise = noise

    if (mode == AREAS_DATA) {
        this.radius = 0.5

        do {
            this.center1 = this.GetRandomPoint(-this.radius, this.radius, -this.radius, this.radius)
            this.center2 = this.GetRandomPoint(-this.radius, this.radius, -this.radius, this.radius)
        } while (!this.IsNormalCenters())
    }
}

DataGenerator.prototype.IsNormalCenters = function() {
    let dx = this.center1.x - this.center2.x
    let dy = this.center1.y - this.center2.y
    return dx*dx + dy*dy > this.radius * this.radius * 4
}

DataGenerator.prototype.Random = function(a = -1, b = 1) {
    return a + Math.random() * (b - a)
}

DataGenerator.prototype.GetRandomPoint = function(a = -1, b = 1, c = -1, d = 1) {
    let x = this.Random(a, b)
    let y = this.Random(c, d)

    return { x: x, y: y }
}

DataGenerator.prototype.GetRandomPointInCircle = function(center, maxRadius) {
    let alpha = this.Random(0, Math.PI * 2)
    let radius = this.Random(0, maxRadius)
    let x = center.x + radius * Math.cos(alpha)
    let y = center.y + radius * Math.sin(alpha)

    return { x: x, y: y }
}

DataGenerator.prototype.GetSpiralPoint = function(angle, isSecond) {
    let r = angle + this.Random(-0.1, 0.1)
    let t = 1.25*angle*2*Math.PI

    if (isSecond) {
        t += Math.PI
    }

    return { x: r * Math.sin(t), y: r * Math.cos(t) }
}

DataGenerator.prototype.GetCirclePoint = function(isSecond) {
    let r = isSecond ? this.Random(0.6, 0.85) : this.Random(0, 0.4)
    let t = this.Random(0, 2 * Math.PI)

    return { x: r * Math.sin(t), y: r * Math.cos(t) }
}

DataGenerator.prototype.GeneratePoints = function(count) {
    let points = []
    let labels = []

    for (let i = 0; i < count; i++) {
        let isSecond = i % 2 == 0
        let point = null

        if (this.mode == SPIRAL_DATA) {
            point = this.GetSpiralPoint(i / count, isSecond)
        }
        else if (this.mode == CIRCLE_DATA) {
            point = this.GetCirclePoint(isSecond)
        }
        else if (this.mode == SQUARE_DATA) {
            point = this.GetRandomPoint()
            isSecond = (point.x < 0) == (point.y < 0)
        }
        else if (this.mode == AREAS_DATA) {
            point = this.GetRandomPointInCircle(isSecond ? this.center1 : this.center2, this.radius)
        }
        else {
            point = this.GetRandomPoint()
        }

        if (Math.random() < this.noise) {
            isSecond = !isSecond
        }

        points.push(point)
        labels.push(isSecond ? 1 : 0)
    }

    return {points: points, labels: labels, length: count}
}