function BackpropagationVisualizer(viewBox, leftcontrolsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox

    this.InitView()
    this.InitButtonsSection()
    this.InitSizes()

    this.isStarted = false
}

BackpropagationVisualizer.prototype.AddEventListener = function(component, eventName, event, needCall = false) {
    component.addEventListener(eventName, event)

    if (needCall) {
        event()
    }
}

BackpropagationVisualizer.prototype.InitButtonsSection = function() {
    let buttonsSection = MakeSection('')
    this.leftControlsBox.appendChild(buttonsSection)

    let buttonsSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    buttonsSVG.setAttribute('width', '270')
    buttonsSVG.setAttribute('height', '60')
    buttonsSVG.style.userSelect = 'none'
    buttonsSVG.style.marginBottom = '-5px'

    this.resetButton = MakeCircleButton(80, 30, '⭮', 'Сбросить', 18, () => { this.StopAnimate(); this.InitializeGraph() })
    this.animateButton = MakeCircleButton(135, 30, '⏵', 'Запустить', 25, () => { this.Animate() })
    this.stepButton = MakeCircleButton(190, 30, '⏯', 'Шаг', 18, () => { this.StopAnimate(); this.StepAnimate() })

    buttonsSVG.appendChild(this.resetButton.button)
    buttonsSVG.appendChild(this.resetButton.text)

    buttonsSVG.appendChild(this.animateButton.button)
    buttonsSVG.appendChild(this.animateButton.text)

    buttonsSVG.appendChild(this.stepButton.button)
    buttonsSVG.appendChild(this.stepButton.text)

    buttonsSection.appendChild(buttonsSVG)
}

BackpropagationVisualizer.prototype.InitSizes = function() {
    let sizesSection = MakeSection('Параметры графа')
    this.leftControlsBox.appendChild(sizesSection)

    this.inputCountBox = MakeNumberInput('input-count-box', 2, 1, 1, 4, 'range')
    this.activationBox = MakeSelect('activation-box', {
        'tanh': 'tanh',
        'sigmoid': 'sigmoid',
        'relu': 'ReLU',
    }, 'tanh')

    this.targetBox = MakeNumberInput('input-count-box', -1, 0.01, -Infinity, Infinity, 'number')

    this.lossBox = MakeSelect('loss-box', {
        'mse': 'MSE',
        'mae': 'MAE',
        'bce': 'binary-cross-entropy',
        'logcosh': 'Logcosh',
    }, 'mse')

    this.needUpdateBox = MakeCheckBox('need-update-box', true)
    this.learningRateBox = MakeNumberInput('learning-rate-box', 0.4, 0.01, 0.01, 10, 'number')
    this.timeBox = MakeNumberInput('time-box', 100, 10, 0, 1000, 'number')

    MakeLabeledRange(sizesSection, this.inputCountBox, '<b>Количество входов</b>', () => this.inputCountBox.value )
    MakeLabeledBlock(sizesSection, this.activationBox, '<b>Функция активации</b><br>')
    MakeLabeledBlock(sizesSection, this.lossBox, '<b>Функция потерь (ошибки)</b><br>')
    MakeLabeledBlock(sizesSection, this.targetBox, '<b>Ожидаемое значение</b><br>')
    MakeLabeledBlock(sizesSection, this.needUpdateBox, '<b>Обновлять веса</b><br>')
    MakeLabeledBlock(sizesSection, this.learningRateBox, '<b>Шаг обновления</b><br>')
    MakeLabeledBlock(sizesSection, this.timeBox, '<b>Время перехода</b><br>')

    this.AddEventListener(this.inputCountBox, 'input', () => this.ChangeInputCount(), true)
    this.AddEventListener(this.activationBox, 'change', () => this.ChangeActivation())
    this.AddEventListener(this.lossBox, 'change', () => this.Recalculate())
    this.AddEventListener(this.targetBox, 'input', () => this.Recalculate())
    this.AddEventListener(this.needUpdateBox, 'change', () => this.learningRateBox.parentNode.parentNode.style.display = this.needUpdateBox.checked ? '' : 'none')
}

BackpropagationVisualizer.prototype.InitView = function() {
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.svg.style.width = '100%'
    this.svg.style.height = '100%'
    this.svg.style.minHeight = '900px'
    this.viewBox.appendChild(this.svg)
}

BackpropagationVisualizer.prototype.SetValue = function(node) {
    let value = Math.random() * 2 - 1

    node.SetValue(Math.floor(value * 20) / 10)
}

BackpropagationVisualizer.prototype.ExecuteCommand = function(command) {
    if (command.type == 'value') {
        command.node.VisibilityValue(true)
    }
    else if (command.type == 'dx') {
        command.node.VisibilityDx(true)
    }
    else if (command.type == 'grad') {
        command.node.VisibilityGrad(true)
    }
}

BackpropagationVisualizer.prototype.UpdateWeights = function() {
    for (let w of this.w) {
        w.value -= +this.learningRateBox.value * w.grad
        w.UpdateValues()
    }

    this.b.value -= +this.learningRateBox.value * this.b.grad
    this.b.UpdateValues()
}

BackpropagationVisualizer.prototype.Reset = function() {
    this.Recalculate()

    for (let node of this.graph) {
        node.InitVisibility()
    }
}

BackpropagationVisualizer.prototype.LoopAnimate = function(currTime) {
    if (!this.isStarted)
        return

    if (currTime - this.prevTime > +this.timeBox.value) {
        this.StepAnimate()
        this.prevTime = currTime
    }

    requestAnimationFrame((t) => this.LoopAnimate(t))
}

BackpropagationVisualizer.prototype.StartAnimate = function() {
    if (this.isStarted)
        return

    this.animateButton.text.textContent = '⏸'
    this.isStarted = true
    this.prevTime = 0
    this.LoopAnimate()
}

BackpropagationVisualizer.prototype.StopAnimate = function() {
    if (!this.isStarted)
        return

    this.animateButton.text.textContent = '⏵'
    this.isStarted = false
}

BackpropagationVisualizer.prototype.StepAnimate = function() {
    if (this.commandIndex < this.commands.length) {
        this.ExecuteCommand(this.commands[this.commandIndex++])
        return
    }

    if (this.needUpdateBox.checked) {
        this.UpdateWeights()
    }

    this.commandIndex = 0
    this.Reset()
}

BackpropagationVisualizer.prototype.Animate = function() {
    if (!this.isStarted) {
        this.StartAnimate()
    }
    else {
        this.StopAnimate()
    }
}

BackpropagationVisualizer.prototype.MakeCommands = function() {
    let inputCount = +this.inputCountBox.value
    let commands = []

    for (let i = inputCount * 2 + 1; i < this.graph.length; i++) {
        commands.push({ node: this.graph[i], type: 'value' })
        commands.push({ node: this.graph[i], type: 'dx' })
    }

    for (let i = this.graph.length - 1; i >= 0; i--) {
        commands.push({ node: this.graph[i], type: 'grad' })
    }

    return commands
}

BackpropagationVisualizer.prototype.CalculateLoss = function(y, t) {
    if (this.lossBox.value == 'mse')
        return { delta: 2 * (y - t), loss: (y - t) * (y - t) }

    if (this.lossBox.value == 'mae')
        return { delta: Math.sign(y - t), loss: Math.abs(y - t) }

    if (this.lossBox.value == 'logcosh')
        return { delta: Math.tanh(y - t), loss: Math.log(Math.cosh(y - t)) }

    return { delta: 0, loss: 0 }
}

BackpropagationVisualizer.prototype.Recalculate = function() {
    let output = this.y.Evaluate()
    let target = +this.targetBox.value
    let loss = this.CalculateLoss(output, target)

    console.log('output:', output)
    console.log('target:', target)
    console.log('loss:', loss.loss)
    console.log('delta:', loss.delta)

    this.y.Backward(loss.delta)

    for (let node of this.graph) {
        node.UpdateValues()
    }
}

BackpropagationVisualizer.prototype.SetActivation = function(node) {
    let activation = this.activationBox.value
    let activations = { 'tanh': 'tanh', 'relu': 'ReLU', 'sigmoid': 'σ' }
    let nums = '₁₂₃₄₅₆₇₈'

    node.textNode.textContent = 'y=' + activations[activation] + '(v' + nums[this.inputCountBox.value*2-1] + ')'
}

BackpropagationVisualizer.prototype.InitializeGraph = function() {
    let inputCount = +this.inputCountBox.value
    let activation = this.activationBox.value

    let inputsRadius = 25
    let operationsRadius = 50

    let paddingX = 80
    let paddingY = 20
    let deltaY = 100
    let deltaX = 250
    let nums = '₁₂₃₄₅₆₇₈'

    this.x = []
    this.w = []
    this.prods = []
    this.sums = []
    this.graph = []

    for (let i = 0; i < inputCount; i++) {
        let y1 = paddingY + inputsRadius + deltaY * (i * 2 + 0)
        let y2 = paddingY + inputsRadius + deltaY * (i * 2 + 1)

        let xi = new Node(paddingX + inputsRadius, y1, inputsRadius, 'variable', `x${nums[i]}`)
        let wi = new Node(paddingX + inputsRadius, y2, inputsRadius, 'variable', `w${nums[i]}`)

        let prod = new Node(paddingX + inputsRadius + deltaX, (y1 + y2) / 2, operationsRadius, '*', `v${nums[i]}=x${nums[i]}∙w${nums[i]}`, [xi, wi])

        this.SetValue(xi)
        this.SetValue(wi)

        this.x.push(xi)
        this.w.push(wi)
        this.prods.push(prod)
        this.graph.push(xi)
        this.graph.push(wi)

        if (i == 1) {
            this.sums.push(new Node(paddingX + inputsRadius + deltaX * 2, (y1 + y2) / 2 - deltaY, operationsRadius, '+', `v${nums[i + inputCount - 1]}=v${nums[i - 1]}+v${nums[i]}`, [this.prods[i - 1], prod]))
        }
        else if (i > 1) {
            this.sums.push(new Node(paddingX + inputsRadius + deltaX * 2, (y1 + y2) / 2 - deltaY, operationsRadius, '+', `v${nums[i + inputCount - 1]}=v${nums[i + inputCount - 2]}+v${nums[i]}`, [this.sums[i - 2], prod]))
        }
    }

    this.b = new Node(paddingX + inputsRadius, paddingY + inputsRadius + deltaY * inputCount * 2, inputsRadius, 'variable', 'b')
    this.SetValue(this.b)

    if (inputCount > 1) {
        this.sums.push(new Node(paddingX + inputsRadius + deltaX * 2, paddingY + inputsRadius + deltaY * inputCount * 2, operationsRadius, '+', `v${nums[inputCount*2-1]}=v${nums[inputCount*2-2]}+b`, [this.sums[inputCount - 2], this.b]))
    }
    else {
        this.sums.push(new Node(paddingX + inputsRadius + deltaX * 2, paddingY + inputsRadius + deltaY * inputCount * 2, operationsRadius, '+',  `v${nums[inputCount*2-1]}=v${nums[inputCount*2-2]}+b`, [this.prods[0], this.b]))
    }

    this.y = new Node(paddingX + inputsRadius + deltaX * 3, paddingY + inputsRadius + deltaY * inputCount * 2, operationsRadius, activation, 'y=' + activation, [this.sums[inputCount - 1]])

    this.svg.innerHTML = ''

    this.graph.push(this.b)

    for (let prod of this.prods)
        this.graph.push(prod)

    for (let sum of this.sums)
        this.graph.push(sum)

    this.graph.push(this.y)

    for (let i = this.graph.length - 1; i >= 0; i--)
        this.graph[i].ToSVG(this.svg)

    this.SetActivation(this.y)
    this.Reset()

    this.commands = this.MakeCommands()
    this.commandIndex = 0
}

BackpropagationVisualizer.prototype.ChangeInputCount = function() {
    this.InitializeGraph()
}

BackpropagationVisualizer.prototype.ChangeActivation = function() {
    this.y.type = this.activationBox.value
    this.SetActivation(this.y)
    this.Recalculate()
}