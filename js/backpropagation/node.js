function Node(x, y, radius, type, text, inputs = []) {
    this.x = x
    this.y = y
    this.radius = radius

    this.type = type
    this.text = text
    this.inputs = inputs

    this.value = null
    this.grad = null
    this.dx = []

    for (let input of inputs) {
        this.dx.push(null)
    }
}

Node.prototype.SetValue = function(value) {
    this.value = value
}

Node.prototype.EvaluateOperation = function() {
    let arg1 = this.inputs[0].Evaluate()
    let arg2 = this.inputs[1].Evaluate()

    if (this.type == '*') {
        this.value = arg1 * arg2
        this.dx = [arg2, arg1]
    }
    else if (this.type == '+') {
        this.value = arg1 + arg2
        this.dx = [1, 1]
    }
    else if (this.type == '-') {
        this.value = arg1 - arg2
        this.dx = [1, 1]
    }
}

Node.prototype.EvaluateFunction = function() {
    if (this.type == 'sigmoid') {
        this.value = 1 / (1 + Math.exp(-this.inputs[0].Evaluate()))
        this.dx = [this.value * (1 - this.value)]
    }
    else if (this.type == 'tanh') {
        this.value = Math.tanh(this.inputs[0].Evaluate())
        this.dx = [1 - this.value * this.value]
    }
    else if (this.type == 'relu') {
        this.value = Math.max(0, this.inputs[0].Evaluate())
        this.dx = [this.value > 0 ? 1 : 0]
    }
}

Node.prototype.Evaluate = function() {
    if (this.type == '*' || this.type == '+' || this.type == '-' || this.type == '/') {
        this.EvaluateOperation()
    }
    else if (this.type == 'tanh' || this.type == 'sigmoid' || this.type == 'relu') {
        this.EvaluateFunction()
    }
    else {
        this.dx = [1]
    }

    return this.value
}

Node.prototype.Backward = function(delta) {
    this.grad = delta

    for (let i = 0; i < this.inputs.length; i++) {
        this.inputs[i].Backward(delta * this.dx[i])
    }
}

Node.prototype.MakeRect = function(x, y, w, h, color = '#fff', border = '#000') {
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")

    rect.setAttribute('x', x - w / 2)
    rect.setAttribute('y', y - h / 2)
    rect.setAttribute('width', w)
    rect.setAttribute('height', h)

    rect.setAttribute('fill', color)
    rect.setAttribute('stroke', border)
    rect.setAttribute('stroke-width', '1px')

    return rect
}

Node.prototype.MakeCircle = function(x, y, radius, color = '#fff') {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")

    circle.setAttribute('cx', x)
    circle.setAttribute('cy', y)
    circle.setAttribute('r', radius)
    circle.setAttribute('fill', color)
    circle.setAttribute('stroke', '#000')
    circle.setAttribute('stroke-width', '1px')

    return circle
}

Node.prototype.MakeText = function(x, y, content, color = '#000', fontSize = null) {
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text")

    text.textContent = content
    text.setAttribute('x', x)
    text.setAttribute('y', y)
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('fill', color)

    if (fontSize !== null) {
        text.style.fontSize = fontSize + 'px'
    }

    return text
}

Node.prototype.MakeLine = function(x1, y1, x2, y2) {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "path")
    line.setAttribute('stroke', '#000')
    line.setAttribute('fill', 'none')
    line.setAttribute('stroke-width', '2px')
    line.setAttribute('d', `M${x1} ${y1} L${x2} ${y2}`)

    return line
}

Node.prototype.VisibilityValue = function(isVisible) {
    this.valueRect.style.display = isVisible ? '' : 'none'
    this.valueText.style.display = isVisible ? '' : 'none'
}

Node.prototype.VisibilityGrad = function(isVisible) {
    this.gradRect.style.display = isVisible ? '' : 'none'
    this.gradText.style.display = isVisible ? '' : 'none'

    if (this.type != 'variable')
        return

    if (isVisible) {
        this.valueRect.setAttribute('y', this.y - 27.5)
        this.valueText.setAttribute('y', this.y - 15)
    }
    else {
        this.valueRect.setAttribute('y', this.y - 12.5)
        this.valueText.setAttribute('y', this.y)
    }
}

Node.prototype.VisibilityDx = function(isVisible) {
    for (let i = 0; i < this.inputs.length; i++) {
        this.dfRects[i].style.display = isVisible ? '' : 'none'
        this.dfTexts[i].style.display = isVisible ? '' : 'none'
    }
}

Node.prototype.Round = function(x) {
    if (x === null)
        return ''

    return Math.round(x * 10000) / 10000
}

Node.prototype.MakeDf = function(svg) {
    for (let i = 0; i < this.inputs.length; i++) {
        let x1 = this.inputs[i].x
        let y1 = this.inputs[i].y

        let x2 = this.x
        let y2 = this.y

        svg.appendChild(this.MakeLine(x1, y1, x2, y2))

        let x = (x1 + x2) / 2
        let y = (y1 + y2) / 2

        if (x1 == x2) {
            x += 30
        }
        else if (y1 == y2) {
            y -= 20
        }
        else if (y1 > y2) {
            y += 25
        }
        else if (y1 < y2) {
            y -= 25
        }

        this.dfRects.push(this.MakeRect(x, y, 50, 25, '#f8cecc', '#f44336'))
        this.dfTexts.push(this.MakeText(x, y, this.Round(this.dx[i]), '#000', 14))
    }
}

Node.prototype.ToSVG = function(svg) {
    if (this.type == 'variable') {
        this.valueRect = this.MakeRect(this.x - this.radius - 30, this.y - 15, 50, 25, '#d5e8d4', '#4caf50')
        this.valueText = this.MakeText(this.x - this.radius - 30, this.y - 15, this.Round(this.value), '#000', 14)

        this.gradRect = this.MakeRect(this.x - this.radius - 30, this.y + 15, 50, 25, '#ffe6cc', '#ffc107')
        this.gradText = this.MakeText(this.x - this.radius - 30, this.y + 15, this.Round(this.grad), '#000', 14)
    }
    else {
        this.valueRect = this.MakeRect(this.x, this.y - 28, 50, 25, '#d5e8d4', '#4caf50')
        this.valueText = this.MakeText(this.x, this.y - 28, this.Round(this.value), '#000', 14)

        this.gradRect = this.MakeRect(this.x, this.y + 28, 50, 25, '#ffe6cc', '#ffc107')
        this.gradText = this.MakeText(this.x, this.y + 28, this.Round(this.grad), '#000', 14)

        this.dfRects = []
        this.dfTexts = []

        this.MakeDf(svg)
    }

    svg.appendChild(this.MakeCircle(this.x, this.y, this.radius))
    svg.appendChild(this.MakeText(this.x, this.y, this.text))

    svg.appendChild(this.valueRect)
    svg.appendChild(this.valueText)

    svg.appendChild(this.gradRect)
    svg.appendChild(this.gradText)

    for (let i = 0; i < this.inputs.length; i++) {
        svg.appendChild(this.dfRects[i])
        svg.appendChild(this.dfTexts[i])
    }

    if (this.type != 'variable') {
        this.VisibilityValue(false)
    }

    this.VisibilityGrad(false)
    this.VisibilityDx(false)
}