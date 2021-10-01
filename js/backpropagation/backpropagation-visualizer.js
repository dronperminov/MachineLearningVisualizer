function BackpropagationVisualizer(viewBox, leftcontrolsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox

    this.InitView()
    this.InitSizes()
}

BackpropagationVisualizer.prototype.AddEventListener = function(component, eventName, event, needCall = false) {
    component.addEventListener(eventName, event)

    if (needCall) {
        event()
    }
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

    this.animateButton = MakeButton('animate-btn', 'Запустить')

    MakeLabeledRange(sizesSection, this.inputCountBox, '<b>Количество входов</b>', () => this.inputCountBox.value )
    MakeLabeledBlock(sizesSection, this.activationBox, '<b>Функция активации</b><br>')
    MakeLabeledBlock(sizesSection, this.animateButton, '', 'centered control-block')

    this.AddEventListener(this.inputCountBox, 'input', () => this.ChangeInputCount(), true)
    this.AddEventListener(this.activationBox, 'change', () => this.ChangeActivation())
    this.AddEventListener(this.animateButton, 'click', () => this.Animate())
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

BackpropagationVisualizer.prototype.Animate = function() {
    let index = 0

    let interval = setInterval(() => {
        if (index >= this.commands.length) {
            clearInterval(interval)
            return
        }

        this.ExecuteCommand(this.commands[index++])
    }, 500)
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

    this.y.Evaluate()
    this.y.Backward(1)

    for (let i = this.graph.length - 1; i >= 0; i--)
        this.graph[i].ToSVG(this.svg)

    this.commands = this.MakeCommands()
}

BackpropagationVisualizer.prototype.ChangeInputCount = function() {
    this.InitializeGraph()
}

BackpropagationVisualizer.prototype.ChangeActivation = function() {
    this.InitializeGraph()
}