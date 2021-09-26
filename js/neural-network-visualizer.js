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
    this.activationBox = MakeSelect('activation-box', {'tanh': 'tanh', 'sigmoid': 'sigmoid', 'relu': 'ReLU'}, 'sigmoid')
    this.optimizerBox = MakeSelect('optimizer-box', {'sgd': 'SGD', 'sgdm': 'SGD momentum', 'adam': 'Adam', 'nag': 'NAG'}, 'adam')

    MakeLabeledBlock(trainSection, this.learningRateBox, '<b>Скорость обучения</b>')
    MakeLabeledBlock(trainSection, this.activationBox, '<b>Функция активации</b><br>')
    MakeLabeledBlock(trainSection, this.optimizerBox, '<b>Оптимизатор</b><br>')
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
    this.regenerateButton = MakeButton('data-regenerate-btn', 'Сгенерировать')

    this.dataCount = NEURAL_NETWORK_DATA_SIZE

    MakeLabeledBlock(dataSection, this.dataTypeBox, '<b>Тип данных</b><br>')
    MakeLabeledRange(dataSection, this.dataTestPartBox, '<b>Доля тестовых данных<br>', () => { return Math.round(this.dataTestPartBox.value * 100) + '%' })
    MakeLabeledRange(dataSection, this.dataNoisePartBox, '<b>Шум<br>', () => { return Math.round(this.dataNoisePartBox.value * 100) + '%' })
    MakeLabeledBlock(dataSection, this.showTestBox, 'Показать тестовые данные')
    MakeLabeledBlock(dataSection, this.regenerateButton, '', 'centered control-block')

    this.AddEventListener(this.dataTypeBox, 'change', () => this.UpdateData(), true)
    this.AddEventListener(this.dataTestPartBox, 'input', () => this.UpdateData())
    this.AddEventListener(this.dataNoisePartBox, 'input', () => this.UpdateData())
    this.AddEventListener(this.regenerateButton, 'click', () => this.UpdateData())
    this.AddEventListener(this.showTestBox, 'change', () => this.DrawDataset(this.dataCtx, this.dataCanvas))
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

    this.InitTrainSection()
    this.InitDataSection()
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

NeuralNetworkVisualizer.prototype.DrawDataset = function(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.DrawData(ctx, canvas, this.trainData, ['#dd7373', '#7699d4'], '#fff', 3)

    if (this.showTestBox.checked) {
        this.DrawData(ctx, canvas, this.testData, ['#ba274a', '#2191fb'], '#000', 3)
    }
}

NeuralNetworkVisualizer.prototype.UpdateData = function() {
    let type = this.dataTypeBox.value
    let part = +this.dataTestPartBox.value
    let noise = +this.dataNoisePartBox.value

    let dataGenerator = new DataGenerator(type, noise)

    let testCount = Math.floor(this.dataCount * part)
    let trainCount = this.dataCount - testCount

    this.testData = dataGenerator.GeneratePoints(testCount)
    this.trainData = dataGenerator.GeneratePoints(trainCount)

    this.DrawDataset(this.dataCtx, this.dataCanvas)
}
