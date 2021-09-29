const NEURAL_NETWORK_DATA_SIZE = 500
const NEURAL_NETWORK_MAX_NEURONS_IN_LAYER = 10

function NeuralNetworkVisualizer(viewBox, leftcontrolsBox, topControlsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox
    this.topControlsBox = topControlsBox

    this.inputNames = ['x', 'y', 'x²', 'y²', 'xy', 'sin x', 'sin y']
    this.inputUsed = [true, true, true, true, true, false, false]
    this.activationsText = { 'sigmoid': 'σ', 'tanh': 'tanh', 'relu': 'ReLU'}

    this.InitControls()
    this.InitEvents()
}

NeuralNetworkVisualizer.prototype.InitTrainSection = function() {
    let trainSection = MakeSection('Параметры обучения')
    this.leftControlsBox.appendChild(trainSection)

    this.learningRateBox = MakeNumberInput('learning-rate-box', 0.01, 0.001, 0.001, 10)
    this.regularizationBox = MakeNumberInput('regularization-box', 0.001, 0.001, 0, 10)
    this.activationBox = MakeSelect('activation-box', {'tanh': 'tanh', 'sigmoid': 'sigmoid', 'relu': 'ReLU'}, 'tanh')

    this.learningRateBox.setAttribute('pattern', '\d+')
    this.optimizerBox = MakeSelect('optimizer-box', {
        'sgd': 'SGD',
        'sgdm': 'SGD momentum',
        'adam': 'Adam',
        'nag': 'NAG',
        'nadam' : 'NAdam'
    }, 'nadam')

    this.batchSizeBox = MakeNumberInput('batch-size-box', 4, 1, 1, 32, 'range')

    MakeLabeledBlock(trainSection, this.learningRateBox, '<b>Скорость обучения (&eta;)</b>')
    MakeLabeledBlock(trainSection, this.regularizationBox, '<b>L2 регуляризация (&lambda;)</b>')
    MakeLabeledBlock(trainSection, this.activationBox, '<b>Функция активации</b><br>')
    MakeLabeledBlock(trainSection, this.optimizerBox, '<b>Оптимизатор</b><br>')
    MakeLabeledRange(trainSection, this.batchSizeBox, '<b>Размер батча</b><br>', () => { return this.batchSizeBox.value }, 'control-block no-margin')

    this.AddEventListener(this.learningRateBox, 'keydown', (e) => { if (e.key == '-' || e.key == '+') e.preventDefault() })
    this.AddEventListener(this.learningRateBox, 'input', () => this.optimizer.SetLearningRate(+this.learningRateBox.value))

    this.AddEventListener(this.regularizationBox, 'input', () => this.optimizer.SetRegularization(+this.regularizationBox.value))
    this.AddEventListener(this.regularizationBox, 'keydown', (e) => { if (e.key == '-' || e.key == '+') e.preventDefault() })

    this.AddEventListener(this.activationBox, 'change', () => this.ChangeNetworkActivation())
    this.AddEventListener(this.optimizerBox, 'change', () => this.InitOptimizer())
    this.AddEventListener(this.batchSizeBox, 'input', () => this.UpdateNetworkData())
}

NeuralNetworkVisualizer.prototype.InitDataSection = function() {
    let dataSection = MakeSection('Данные')
    this.leftControlsBox.appendChild(dataSection)

    this.dataTypeBox = MakeSelect('data-type-box', {
        SPIRAL_DATA: 'спираль',
        CIRCLE_DATA: 'окружность',
        SQUARE_DATA: 'квадраты',
        AREAS_DATA: 'две области'
    }, SPIRAL_DATA, () => this.UpdateDataType())

    this.dataTestPartBox = MakeNumberInput('data-test-part-box', 0.5, 0.05, 0.1, 0.9, 'range')
    this.dataNoisePartBox = MakeNumberInput('data-noise-part-box', 0.0, 0.05, 0, 0.5, 'range')

    this.regenerateButton = MakeButton('data-regenerate-btn', 'Сгенерировать')

    this.dataCount = NEURAL_NETWORK_DATA_SIZE

    MakeLabeledBlock(dataSection, this.dataTypeBox, '<b>Тип данных</b><br>')
    MakeLabeledRange(dataSection, this.dataTestPartBox, '<b>Доля тестовых данных<br>', () => { return Math.round(this.dataTestPartBox.value * 100) + '%' }, 'control-block no-margin')
    MakeLabeledRange(dataSection, this.dataNoisePartBox, '<b>Шум<br>', () => { return Math.round(this.dataNoisePartBox.value * 100) + '%' }, 'control-block no-margin')
    MakeLabeledBlock(dataSection, this.regenerateButton, '', 'centered control-block')

    this.AddEventListener(this.dataTypeBox, 'change', () => this.UpdateData(false))
    this.AddEventListener(this.dataTestPartBox, 'input', () => this.UpdateData(false))
    this.AddEventListener(this.dataNoisePartBox, 'input', () => this.UpdateData(false))
    this.AddEventListener(this.regenerateButton, 'click', () => this.UpdateData(false))
}

NeuralNetworkVisualizer.prototype.InitNetworkArchitecture = function() {
    this.networkSVG.innerHTML = ''

    this.neuronRadius = 22

    this.layers = this.MakeNetworkNeurons()
    this.weights = this.MakeNetworkWeights()
    this.texts = this.MakeNetworkTexts()
    this.canvases = this.MakeNetworkCanvases()
    this.canvasesCtx = []
    this.canvasesData = []

    for (let i = 0; i < this.layers.length; i++) {
        this.canvasesCtx[i] = []
        this.canvasesData[i] = []

        for (let j = 0; j < this.layers[i].length; j++) {
            this.networkSVG.appendChild(this.layers[i][j])
            this.networkSVG.appendChild(this.texts[i][j])

            if (i == 0 || i == this.layers.length - 1)
                continue

            this.networkSVG.parentElement.insertBefore(this.canvases[i][j], this.networkSVG)
            this.canvasesCtx[i].push(this.canvases[i][j].getContext('2d'))
            this.canvasesCtx[i][j].fillStyle = '#fff'
            this.canvasesCtx[i][j].fillRect(0, 0, this.canvases[i][j].width, this.canvases[i][j].height)
            this.canvasesData[i].push(this.canvasesCtx[i][j].getImageData(0, 0, this.canvases[i][j].width, this.canvases[i][j].height))
        }
    }

    this.DrawNetworkArchitecture()
}

NeuralNetworkVisualizer.prototype.InitNetwork = function() {
    let activation = this.activationBox.value
    this.network = new NeuralNetwork(7)
    this.lossFunction = new LossFunction()

    this.network.AddLayer({ 'name': 'fc', 'size': 8, 'activation': activation })
    this.network.AddLayer({ 'name': 'fc', 'size': 4, 'activation': activation })
    this.network.AddLayer({ 'name': 'fc', 'size': 1, 'activation': 'tanh' })

    this.isTraining = false
}

NeuralNetworkVisualizer.prototype.SplitOnBatches = function(data, batchSize, isRandom = false) {
    let x = []
    let y = []

    for (let i = 0; i < data.length; i += batchSize) {
        let batchX = []
        let batchY = []

        for (j = 0; j < batchSize; j++) {
            let index = isRandom ? Math.floor(Math.random() * data.length) : (i + j) % data.length
            batchX.push(data.x[index])
            batchY.push(data.y[index])
        }

        x.push(batchX)
        y.push(batchY)
    }

    return { x: x, y: y, length: x.length }
}

NeuralNetworkVisualizer.prototype.ChangeNetworkActivation = function() {
    let activation = this.activationBox.value

    this.network.SetActivation(activation)

    for (let i = 1; i < this.layers.length; i++)
        for (let j=  0; j < this.layers[i].length; j++)
            this.texts[i][j].textContent = this.activationsText[activation]

    this.DrawDataset()
    this.DrawNetworkArchitecture()
}

NeuralNetworkVisualizer.prototype.ResetLosses = function() {
    this.trainLosses = []
    this.testLosses = []

    this.trainLossPath.setAttribute('d', '')
    this.testLossPath.setAttribute('d', '')

    this.minLoss = Infinity
    this.maxLoss = -Infinity
}

NeuralNetworkVisualizer.prototype.AppendLoss = function(losses, loss, path) {
    losses.push(loss)

    if (losses.length == 1)
        return

    let width = +this.lossSVG.getAttribute('width')
    let height = +this.lossSVG.getAttribute('height')
    let padding = 3
    let points = ''

    for (let i = 0; i < losses.length; i++) {
        let loss = (losses[i] - this.minLoss) / (this.maxLoss - this.minLoss)
        let x = padding + i / (losses.length - 1) * (width - 2 * padding)
        let y = height - padding - loss * (height - 2 * padding)
        points += `${i == 0 ? 'M' : ' L'} ${x} ${y}`
    }

    path.setAttribute('d', points)
}

NeuralNetworkVisualizer.prototype.StepTrain = function() {
    this.network.TrainEpoch(this.batches, this.batchSize, this.optimizer, this.lossFunction)

    let trainLoss = this.network.CalculateLossOnData(this.trainNetworkData, this.lossFunction)
    let testLoss = this.network.CalculateLossOnData(this.testNetworkData, this.lossFunction)

    this.minLoss = Math.min(this.minLoss, Math.min(trainLoss, testLoss))
    this.maxLoss = Math.max(this.maxLoss, Math.max(trainLoss, testLoss))

    this.epoch++
    this.AppendLoss(this.trainLosses, trainLoss, this.trainLossPath)
    this.AppendLoss(this.testLosses, testLoss, this.testLossPath)
    this.UpdateLossesInfo(trainLoss, testLoss)
    this.DrawNetworkArchitecture()

    if (this.epoch % 4 == 0 || !this.isTraining) {
        this.DrawDataset()
    }

    console.log('epoch: ' + this.epoch, 'loss: ' + trainLoss, 'test: ' + testLoss)
}

NeuralNetworkVisualizer.prototype.LoopTrain = function() {
    if (!this.isTraining)
        return

    this.StepTrain()
    requestAnimationFrame(() => this.LoopTrain())
}

NeuralNetworkVisualizer.prototype.ConvertDataToNetwork = function(data) {
    let result = { x: [], y: [], length: data.length }

    for (let i = 0; i < data.length; i++) {
        result.x[i] = this.PointToVector(data.points[i].x, data.points[i].y)
        result.y[i] = [data.labels[i] == 0 ? 1 : -1]
    }

    return result
}

NeuralNetworkVisualizer.prototype.UpdateCanvasData = function() {
    let canvasData = []

    for (let i = 0; i < this.dataCanvas.height; i++) {
        for (let j = 0; j < this.dataCanvas.width; j++) {
            let x = j * 2 / this.dataCanvas.width - 1
            let y = i * 2 / this.dataCanvas.height - 1

            canvasData.push(this.PointToVector(x, y))
        }
    }

    return canvasData
}

NeuralNetworkVisualizer.prototype.UpdateLossesInfo = function(trainLoss, testLoss) {
    this.trainLossBox.innerHTML = 'Ошибка на train: ' + Math.round(trainLoss * 10000) / 10000
    this.testLossBox.innerHTML = 'Ошибка на test: ' + Math.round(testLoss * 10000) / 10000
}

NeuralNetworkVisualizer.prototype.GetNeuronsData = function() {
    let data = []
    let points = []

    let size = 2 * this.neuronRadius + 1

    for (let i = -this.neuronRadius; i <= this.neuronRadius; i++) {
        for (let j = -this.neuronRadius; j <= this.neuronRadius; j++) {
            if (i*i + j*j > (this.neuronRadius + 2) * (this.neuronRadius + 2))
                continue

            data.push(this.PointToVector(j * 2 / size, i * 2 / size))
            points.push({ x: j + this.neuronRadius, y: i + this.neuronRadius })
        }
    }

    return {data: data, points: points, length: data.length}
}

NeuralNetworkVisualizer.prototype.UpdateNetworkData = function() {
    this.trainNetworkData = this.ConvertDataToNetwork(this.trainData)
    this.testNetworkData = this.ConvertDataToNetwork(this.testData)

    this.batchSize = +this.batchSizeBox.value
    this.batches = this.SplitOnBatches(this.trainNetworkData, this.batchSize)
    this.canvasData = this.UpdateCanvasData()
    this.neuronsData = this.GetNeuronsData()

    let trainLoss = this.network.CalculateLossOnData(this.trainNetworkData, this.lossFunction)
    let testLoss = this.network.CalculateLossOnData(this.testNetworkData, this.lossFunction)

    this.UpdateLossesInfo(trainLoss, testLoss)
}

NeuralNetworkVisualizer.prototype.InitOptimizer = function() {
    let learningRate = +this.learningRateBox.value
    let regularization = +this.regularizationBox.value
    let algorithm = this.optimizerBox.value

    this.optimizer = new Optimizer(learningRate, regularization, algorithm)
}

NeuralNetworkVisualizer.prototype.ResetTrain = function(needResetNetwork = true) {
    this.StopTrain()

    if (needResetNetwork) {
        this.InitNetwork()
        this.InitNetworkArchitecture()
        this.DrawNetworkArchitecture()
    }

    this.epoch = 0

    this.UpdateNetworkData()
    this.InitOptimizer()
    this.ResetLosses()
    this.DrawDataset()
}

NeuralNetworkVisualizer.prototype.StopTrain = function() {
    if (!this.isTraining)
        return

    this.trainButton.value = 'Обучить'
    this.isTraining = false
}

NeuralNetworkVisualizer.prototype.StartTrain = function() {
    if (this.isTraining)
        return

    this.trainButton.value = 'Остановить'
    this.isTraining = true

    requestAnimationFrame(() => this.LoopTrain())
}

NeuralNetworkVisualizer.prototype.TrainNetwork = function() {
    if (!this.isTraining) {
        this.StartTrain()
    }
    else {
        this.StopTrain()
    }
}

NeuralNetworkVisualizer.prototype.PointToVector = function(x, y) {
    x *= 5
    y *= 5

    let vector = [x, y, x * x, y * y, x * y, Math.sin(x), Math.sin(y)]

    for (let i = 0; i < vector.length; i++)
        if (!this.inputUsed[i])
            vector[i] = 0

    return vector
}

NeuralNetworkVisualizer.prototype.InitTopControls = function() {
    this.resetButton = MakeButton('reset-btn', 'Сбросить')
    this.trainButton = MakeButton('train-btn', 'Обучить')
    this.stepButton = MakeButton('step-btn', 'Шаг')

    this.topControlsBox.appendChild(this.resetButton)
    this.topControlsBox.appendChild(this.trainButton)
    this.topControlsBox.appendChild(this.stepButton)

    this.AddEventListener(this.resetButton, 'click', () => { this.ResetTrain() })
    this.AddEventListener(this.trainButton, 'click', () => { this.TrainNetwork() })
    this.AddEventListener(this.stepButton, 'click', () => { this.StopTrain(); this.StepTrain(); })
}

NeuralNetworkVisualizer.prototype.AppendLossComponents = function(section) {
    this.lossSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")

    this.trainLossPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    this.testLossPath = document.createElementNS("http://www.w3.org/2000/svg", "path")

    this.trainLossBox = MakeSpan('train-loss-box', '')
    this.testLossBox = MakeSpan('test-loss-box', '')
    this.testLossBox.style.color = '#0a0'

    this.lossSVG.setAttribute('width', '300')
    this.lossSVG.setAttribute('height', '120')

    this.trainLossPath.setAttribute("class", 'line-path')
    this.trainLossPath.setAttribute("stroke", '#000')
    this.lossSVG.appendChild(this.trainLossPath)

    this.testLossPath.setAttribute("class", 'line-path')
    this.testLossPath.setAttribute("stroke", '#0a0')
    this.lossSVG.appendChild(this.testLossPath)

    let div = MakeDiv('loss-block', '')
    div.appendChild(document.createElement('hr'))
    div.appendChild(this.trainLossBox)
    div.appendChild(document.createElement('br'))
    div.appendChild(this.testLossBox)
    div.appendChild(document.createElement('br'))
    div.appendChild(this.lossSVG)

    MakeLabeledBlock(section, div, '', 'control-block no-margin')
}

NeuralNetworkVisualizer.prototype.ChangeInputUsed = function(index) {
    let count = 0
    for (let i = 0; i < this.inputUsed.length; i++)
        if (this.inputUsed[i])
            count++

    if (count == 1 && this.inputUsed[index])
        return

    this.inputUsed[index] = !this.inputUsed[index]
    this.UpdateNetworkData()
    this.DrawNetworkArchitecture()
    this.DrawDataset()
}

NeuralNetworkVisualizer.prototype.MakeNetworkNeurons = function() {
    let width = this.networkSVG.clientWidth
    let height = this.networkSVG.clientHeight
    let padding = 10

    let layersCount = this.network.layers.length
    let deltaWidth = Math.floor(width / layersCount)
    let deltaHeight = Math.floor(height / NEURAL_NETWORK_MAX_NEURONS_IN_LAYER)
    let layers = []

    for (let i = 0; i < layersCount; i++) {
        let size = this.network.layers[i].inputs
        let layer = []

        for (let j = 0; j < size; j++) {
            let neuron = document.createElementNS("http://www.w3.org/2000/svg", "circle")
            let x = padding + this.neuronRadius + i * deltaWidth
            let y = padding + this.neuronRadius + j * deltaHeight

            neuron.setAttribute('cx', x)
            neuron.setAttribute('cy', y)
            neuron.setAttribute('r', this.neuronRadius)
            neuron.setAttribute('fill', '#fff')
            neuron.setAttribute('stroke', '#000')
            neuron.setAttribute('stroke-width', '2px')

            if (i == 0) {
                neuron.onclick = () => this.ChangeInputUsed(j)
            }

            layer.push(neuron)
        }

        layers.push(layer)
    }

    let out = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    out.setAttribute('cx', padding + this.neuronRadius + layersCount * deltaWidth)
    out.setAttribute('cy', padding + this.neuronRadius)
    layers.push([out])

    return layers
}

NeuralNetworkVisualizer.prototype.MakeNetworkWeights = function() {
    let weights = []

    for (let index = 0; index < this.layers.length - 1; index++) {
        weights[index] = []

        for (let i = 0; i < this.layers[index].length; i++) {
            weights[index][i] = []

            for (let j = 0; j < this.layers[index + 1].length; j++) {
                let edge = document.createElementNS("http://www.w3.org/2000/svg", "path")
                this.networkSVG.appendChild(edge)
                weights[index][i][j] = edge
            }
        }
    }

    return weights
}

NeuralNetworkVisualizer.prototype.MakeNetworkTexts = function() {
    let texts = []

    for (let i = 0; i < this.layers.length; i++) {
        texts[i] = []

        for (let j = 0; j < this.layers[i].length; j++) {
            let text = document.createElementNS("http://www.w3.org/2000/svg", "text")

            if (i == 0) {
                text.textContent = this.inputNames[j]
            }
            else {
                text.textContent = this.activationsText[this.activationBox.value]
            }

            text.setAttribute('x', this.layers[i][j].getAttribute('cx'))
            text.setAttribute('y', this.layers[i][j].getAttribute('cy'))
            text.setAttribute('dominant-baseline', 'middle')
            text.setAttribute('text-anchor', 'middle')
            text.setAttribute('class', 'neuron')

            texts[i].push(text)
        }
    }

    return texts
}

NeuralNetworkVisualizer.prototype.MakeNetworkCanvases = function() {
    let canvases = []

    for (let i = 1; i < this.layers.length - 1; i++) {
        canvases[i] = []

        for (let j = 0; j < this.layers[i].length; j++) {
            let canvas = document.createElement('canvas')

            canvas.style.position = 'absolute'
            canvas.style.top = (this.layers[i][j].getAttribute('cy') - this.neuronRadius + 1) + 'px'
            canvas.style.left = (this.layers[i][j].getAttribute('cx') - this.neuronRadius + 1) + 'px'
            canvas.style.border = 'none'
            canvas.style.borderRadius = '100%'

            canvas.width = (this.neuronRadius * 2 - 2)
            canvas.height = (this.neuronRadius * 2 - 2)

            canvases[i].push(canvas)
        }
    }

    return canvases
}

NeuralNetworkVisualizer.prototype.DrawNetworkArchitecture = function() {
    for (let index = 0; index < this.layers.length - 1; index++) {
        for (let i = 0; i < this.layers[index].length; i++) {
            let x1 = +this.layers[index][i].getAttribute('cx')
            let y1 = +this.layers[index][i].getAttribute('cy')

            for (let j = 0; j < this.layers[index + 1].length; j++) {
                let weight = this.network.layers[index].w[j][i].value
                let stroke = Math.max(0.5, Math.min(7, Math.abs(weight)))

                let x2 = +this.layers[index + 1][j].getAttribute('cx')
                let y2 = +this.layers[index + 1][j].getAttribute('cy')

                this.weights[index][i][j].setAttribute('fill', 'none')

                if (index == 0 && !this.inputUsed[i])  {
                    this.weights[index][i][j].setAttribute('stroke', 'none')
                }
                else {
                    this.weights[index][i][j].setAttribute('stroke', weight > 0 ? '#dd7373' : '#7699d4')
                    this.weights[index][i][j].setAttribute('stroke-width', stroke + 'px')
                }

                this.weights[index][i][j].setAttribute('d', `M${x1} ${y1} C ${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`)
            }
        }
    }

    for (let i = 0; i < this.inputNames.length; i++) {
        this.layers[0][i].setAttribute('class', 'neuron ' + (this.inputUsed[i] ? 'used-neuron' : 'non-used-neuron'))
        this.texts[0][i].setAttribute('class',  'neuron ' + (this.inputUsed[i] ? 'used-neuron-text' : 'non-used-neuron-text'))
    }
}

NeuralNetworkVisualizer.prototype.DrawNetworkNeurons = function() {
    let isDiscrete = this.showDiscreteBox.checked

    for (let index = 0; index < this.neuronsData.length; index++) {
        let outputs = this.network.PredictLayers(this.neuronsData.data[index])
        let point = this.neuronsData.points[index]

        for (let i = 1; i < this.layers.length - 1; i++) {
            for (let j = 0; j < this.layers[i].length; j++) {
                let color = this.GetColorByOutput(outputs[i - 1][j], isDiscrete)
                let index = (point.y * this.canvases[i][j].width + point.x) * 4

                this.canvasesData[i][j].data[index] = color[0]
                this.canvasesData[i][j].data[index + 1] = color[1]
                this.canvasesData[i][j].data[index + 2] = color[2]
            }
        }
    }

    for (let i = 1; i < this.layers.length - 1; i++) {
        for (let j = 0; j < this.layers[i].length; j++) {
            this.canvasesCtx[i][j].putImageData(this.canvasesData[i][j], 0, 0)
        }
    }
}

NeuralNetworkVisualizer.prototype.InitView = function() {
    this.dataCanvas = document.createElement('canvas')
    this.dataCtx = this.dataCanvas.getContext('2d')
    this.dataCanvas.width = 300
    this.dataCanvas.height = 300

    this.showTestBox = MakeCheckBox('show-test-data-box')
    this.showDiscreteBox = MakeCheckBox('show-discrete-box')

    this.networkSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.networkSVG.style.width = '100%'
    this.networkSVG.style.height = '100%'

    let table = MakeDiv('', '', 'table')
    let cell1 = MakeDiv('', '', 'table-cell')
    let cell2 = MakeDiv('', '', 'table-cell no-margin')

    cell1.appendChild(this.networkSVG)
    cell2.style.width = this.dataCanvas.width + 'px'

    table.appendChild(cell1)
    table.appendChild(cell2)

    MakeLabeledBlock(cell2, this.dataCanvas, '', 'control-block no-margin no-h-padding')
    MakeLabeledBlock(cell2, this.showTestBox, 'Показать тестовые данные', 'control-block no-margin no-h-padding')
    MakeLabeledBlock(cell2, this.showDiscreteBox, 'Показать выход дискретно', 'control-block no-h-padding')
    this.AppendLossComponents(cell2)
    this.viewBox.appendChild(table)

    this.AddEventListener(this.showTestBox, 'change', () => this.DrawDataset())
    this.AddEventListener(this.showDiscreteBox, 'change', () => this.DrawDataset())
}

NeuralNetworkVisualizer.prototype.InitControls = function() {
    this.InitTopControls()

    this.InitTrainSection()
    this.InitDataSection()
    this.InitView()

    this.UpdateData()
}

NeuralNetworkVisualizer.prototype.Resize = function() {
    let cell = this.networkSVG.parentElement

    while (cell.children[0].tagName == 'CANVAS')
        cell.removeChild(cell.children[0])

    this.InitNetworkArchitecture()
    this.DrawNetworkNeurons()
}

NeuralNetworkVisualizer.prototype.InitEvents = function() {
    window.addEventListener('resize', () => this.Resize())
}

NeuralNetworkVisualizer.prototype.AddEventListener = function(component, eventName, event, needCall = false) {
    component.addEventListener(eventName, event)

    if (needCall) {
        event()
    }
}

NeuralNetworkVisualizer.prototype.DrawData = function(ctx, canvas, data, colors, border, radius) {
    for (let i = 0; i < data.points.length; i++) {
        let x = (data.points[i].x + 1) / 2 * canvas.width
        let y = (data.points[i].y + 1) / 2 * canvas.height

        ctx.fillStyle = colors[data.labels[i]]
        ctx.strokeStyle = border
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
    }
}

NeuralNetworkVisualizer.prototype.MixColor = function(color1, color2, t) {
    t = Math.max(0, Math.min(1, t))

    return [
        Math.floor(color1[0] * t + color2[0] * (1 - t)),
        Math.floor(color1[1] * t + color2[1] * (1 - t)),
        Math.floor(color1[2] * t + color2[2] * (1 - t)),
    ]
}

NeuralNetworkVisualizer.prototype.GetColorByOutput = function(output, isDiscrete) {
    let label = output > 0 ? 0 : 1
    let colors = [[221, 115, 115], [118, 153, 212]]
    let discreteColors = [[230, 155, 155], [142, 171, 219]]

    return isDiscrete ? discreteColors[label] : this.MixColor(colors[label], [255, 255, 255], Math.abs(output))
}

NeuralNetworkVisualizer.prototype.DrawNetwork = function(ctx, canvas) {
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let index = 0
    let isDiscrete = this.showDiscreteBox.checked

    for (let i = 0; i < canvas.height * canvas.width; i++) {
        let output = this.network.Predict(this.canvasData[i])[0]
        let color = this.GetColorByOutput(output, isDiscrete)

        data.data[index++] = color[0]
        data.data[index++] = color[1]
        data.data[index++] = color[2]
        index++
    }

    ctx.putImageData(data, 0, 0)
}

NeuralNetworkVisualizer.prototype.DrawDataset = function() {
    setTimeout(() => {
        this.dataCtx.fillRect(0, 0, this.dataCanvas.width, this.dataCanvas.height)

        this.DrawNetwork(this.dataCtx, this.dataCanvas)
        this.DrawData(this.dataCtx, this.dataCanvas, this.trainData, ['#dd7373', '#7699d4'], '#fff', 3)

        if (this.showTestBox.checked) {
            this.DrawData(this.dataCtx, this.dataCanvas, this.testData, ['#ba274a', '#2191fb'], '#000', 3)
        }

        this.DrawNetworkNeurons()
    }, 0)
}

NeuralNetworkVisualizer.prototype.UpdateData = function(resetTrain = true) {
    let type = this.dataTypeBox.value
    let part = +this.dataTestPartBox.value
    let noise = +this.dataNoisePartBox.value

    let dataGenerator = new DataGenerator(type, noise)

    let testCount = Math.floor(this.dataCount * part)
    let trainCount = this.dataCount - testCount

    this.testData = dataGenerator.GeneratePoints(testCount)
    this.trainData = dataGenerator.GeneratePoints(trainCount)

    if (resetTrain) {
        this.ResetTrain()
    }
    else {
        this.UpdateNetworkData()
    }

    this.DrawDataset()
}
