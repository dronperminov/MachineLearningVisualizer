const NEURAL_NETWORK_DATA_SIZE = 500

function NeuralNetworkVisualizer(viewBox, leftcontrolsBox, topControlsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox
    this.topControlsBox = topControlsBox

    this.InitControls()
}

NeuralNetworkVisualizer.prototype.InitTrainSection = function() {
    let trainSection = MakeSection('Параметры обучения')
    this.leftControlsBox.appendChild(trainSection)

    this.learningRateBox = MakeNumberInput('learning-rate-box', 0.01, 0.001, 0.001, 10)
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

    MakeLabeledBlock(trainSection, this.learningRateBox, '<b>Скорость обучения</b>')
    MakeLabeledBlock(trainSection, this.activationBox, '<b>Функция активации</b><br>')
    MakeLabeledBlock(trainSection, this.optimizerBox, '<b>Оптимизатор</b><br>')
    MakeLabeledRange(trainSection, this.batchSizeBox, '<b>Размер батча</b><br>', () => { return this.batchSizeBox.value })

    this.AddEventListener(this.learningRateBox, 'keydown', (e) => { if (e.key == '-' || e.key == '+') e.preventDefault() })
    this.AddEventListener(this.learningRateBox, 'input', () => this.optimizer.SetLearningRate(+this.learningRateBox.value))
    this.AddEventListener(this.activationBox, 'change', () => this.network.SetActivation(this.activationBox.value))
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

    this.showTestBox = MakeCheckBox('show-test-data-box')
    this.showDiscreteBox = MakeCheckBox('show-discrete-box')
    this.regenerateButton = MakeButton('data-regenerate-btn', 'Сгенерировать')

    this.dataCount = NEURAL_NETWORK_DATA_SIZE

    MakeLabeledBlock(dataSection, this.dataTypeBox, '<b>Тип данных</b><br>')
    MakeLabeledRange(dataSection, this.dataTestPartBox, '<b>Доля тестовых данных<br>', () => { return Math.round(this.dataTestPartBox.value * 100) + '%' }, 'control-block no-margin')
    MakeLabeledRange(dataSection, this.dataNoisePartBox, '<b>Шум<br>', () => { return Math.round(this.dataNoisePartBox.value * 100) + '%' }, 'control-block no-margin')
    MakeLabeledBlock(dataSection, this.showTestBox, 'Показать тестовые данные', 'control-block no-margin')
    MakeLabeledBlock(dataSection, this.showDiscreteBox, 'Показать выход дискретно')
    MakeLabeledBlock(dataSection, this.regenerateButton, '', 'centered control-block')

    this.AddEventListener(this.dataTypeBox, 'change', () => this.UpdateData())
    this.AddEventListener(this.dataTestPartBox, 'input', () => this.UpdateData(false))
    this.AddEventListener(this.dataNoisePartBox, 'input', () => this.UpdateData(false))
    this.AddEventListener(this.regenerateButton, 'click', () => this.UpdateData(false))
    this.AddEventListener(this.showTestBox, 'change', () => this.DrawDataset())
    this.AddEventListener(this.showDiscreteBox, 'change', () => this.DrawDataset())
}

NeuralNetworkVisualizer.prototype.InitNetwork = function() {
    let activation = this.activationBox.value
    this.network = new NeuralNetwork(5)

    this.network.AddLayer({ 'name': 'fc', 'size': 8, 'activation': activation })
    this.network.AddLayer({ 'name': 'fc', 'size': 8, 'activation': activation })
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

NeuralNetworkVisualizer.prototype.StepTrain = function() {
    let loss = this.network.TrainEpoch(this.batches, this.batchSize, this.optimizer, MSE)

    this.epoch++

    this.DrawDataset()

    console.log('epoch: ' + this.epoch, 'loss: ' + loss)
}

NeuralNetworkVisualizer.prototype.LoopTrain = function() {
    if (!this.isTraining)
        return

    this.StepTrain()
    requestAnimationFrame(() => this.LoopTrain())
}

NeuralNetworkVisualizer.prototype.UpdateNetworkData = function() {
    let trainData = this.ConvertDataToNetwork(this.trainData)
    let testData = this.ConvertDataToNetwork(this.testData)

    this.batchSize = +this.batchSizeBox.value
    this.batches = this.SplitOnBatches(trainData, this.batchSize)
}

NeuralNetworkVisualizer.prototype.InitOptimizer = function() {
    let learningRate = +this.learningRateBox.value
    let algorithm = this.optimizerBox.value

    this.optimizer = new Optimizer(learningRate, algorithm)
}

NeuralNetworkVisualizer.prototype.ResetTrain = function(needResetNetwork = true) {
    this.StopTrain()
    this.UpdateNetworkData()
    this.InitOptimizer()

    this.epoch = 0

    if (needResetNetwork) {
        this.InitNetwork()
    }

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

NeuralNetworkVisualizer.prototype.PointToVector = function(p) {
    // return [p.x, p.y, Math.sin(p.x), Math.sin(p.y)]
    // return [Math.sin(p.x), Math.sin(p.y)]
    // return [p.x, p.y]
    return [p.x, p.y, p.x * p.x, p.y * p.y, p.x * p.y]
}

NeuralNetworkVisualizer.prototype.ConvertDataToNetwork = function(data) {
    let result = { x: [], y: [], length: data.length }

    for (let i = 0; i < data.length; i++) {
        result.x[i] = this.PointToVector(data.points[i])
        result.y[i] = [data.labels[i] == 0 ? 1 : -1]
    }

    return result
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

NeuralNetworkVisualizer.prototype.InitView = function() {
    this.dataCanvas = document.createElement('canvas')
    this.dataCtx = this.dataCanvas.getContext('2d')
    this.dataCanvas.width = 300 // TODO
    this.dataCanvas.height = 300 // TODO

    this.viewBox.appendChild(this.dataCanvas)
}

NeuralNetworkVisualizer.prototype.InitControls = function() {
    this.InitView()
    this.InitTopControls()

    this.InitTrainSection()
    this.InitDataSection()

    this.UpdateData()
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

NeuralNetworkVisualizer.prototype.DrawNetwork = function(ctx, canvas, colors) {
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let index = 0
    let white = [255, 255, 255]
    let isDiscrete = this.showDiscreteBox.checked

    this.network.SetBatchSize(1)

    for (let i = 0; i < canvas.height; i++) {
        for (let j = 0; j < canvas.width; j++) {
            let x = j * 2 / canvas.width - 1
            let y = i * 2 / canvas.height - 1
            let point = { x: x, y: y }

            let output = this.network.Forward([this.PointToVector(point)])[0][0]
            let label = output > 0 ? 0 : 1
            let color = isDiscrete ? colors[label] : this.MixColor(colors[label], white, Math.abs(output))

            data.data[index++] = color[0]
            data.data[index++] = color[1]
            data.data[index++] = color[2]
            index++
        }
    }

    ctx.putImageData(data, 0, 0)
}

NeuralNetworkVisualizer.prototype.DrawDataset = function() {
    this.dataCtx.fillRect(0, 0, this.dataCanvas.width, this.dataCanvas.height)

    this.DrawNetwork(this.dataCtx, this.dataCanvas, [[221, 115, 115], [118, 153, 212]])
    this.DrawData(this.dataCtx, this.dataCanvas, this.trainData, ['#dd7373', '#7699d4'], '#fff', 3)

    if (this.showTestBox.checked) {
        this.DrawData(this.dataCtx, this.dataCanvas, this.testData, ['#ba274a', '#2191fb'], '#000', 3)
    }
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
