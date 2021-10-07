const SVM_DATA_SIZE = 500

function SupportVectorMachineVisualizer(viewBox, leftcontrolsBox, topControlsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox
    this.topControlsBox = topControlsBox

    this.InitControls()
}

SupportVectorMachineVisualizer.prototype.AddEventListener = function(component, eventName, event, needCall = false) {
    component.addEventListener(eventName, event)

    if (needCall) {
        event()
    }
}

SupportVectorMachineVisualizer.prototype.InitButtonsSection = function() {
    let buttonsSection = MakeSection('')
    this.leftControlsBox.appendChild(buttonsSection)

    let buttonsSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    buttonsSVG.setAttribute('width', '270')
    buttonsSVG.setAttribute('height', '60')
    buttonsSVG.style.userSelect = 'none'
    buttonsSVG.style.marginBottom = '-5px'

    this.resetButton = MakeCircleButton(80, 30, '⭮', 'Сбросить', 18, () => this.ResetTrain())
    this.trainButton = MakeCircleButton(135, 30, '⏵', 'Обучить', 25, () => { this.Train() })
    this.stepButton = MakeCircleButton(190, 30, '⏯', 'Шаг', 18, () => { this.StopTrain(); this.StepTrain() })

    buttonsSVG.appendChild(this.resetButton.button)
    buttonsSVG.appendChild(this.resetButton.text)

    buttonsSVG.appendChild(this.trainButton.button)
    buttonsSVG.appendChild(this.trainButton.text)

    buttonsSVG.appendChild(this.stepButton.button)
    buttonsSVG.appendChild(this.stepButton.text)

    buttonsSection.appendChild(buttonsSVG)
}

SupportVectorMachineVisualizer.prototype.InitTrainSection = function() {
    let trainSection = MakeSection('Параметры обучения')
    this.leftControlsBox.appendChild(trainSection)

    this.svmLambdaBox = MakeNumberInput('svm-C-box', 0.001, 0.001, 0.1, 10)
    this.learningRateBox = MakeNumberInput('learning-rate-box', 0.01, 0.001, 0.001, 10)

    this.kernelBox = MakeSelect('kernel-box', {
        'linear': 'линейная',
        // 'rbf': 'RBF',
    }, 'linear')

    MakeLabeledBlock(trainSection, this.svmLambdaBox, '<b>Значение регуляризации</b (&lambda)</b>')
    MakeLabeledBlock(trainSection, this.learningRateBox, '<b>Скорость обучения (&eta;)</b>')
    MakeLabeledBlock(trainSection, this.kernelBox, '<b>Ядерная функция</b><br>', 'control-block no-margin')

    this.AddEventListener(this.svmLambdaBox, 'input', () => this.svm.SetLambda(+this.svmLambdaBox.value))
    this.AddEventListener(this.svmLambdaBox, 'keydown', (e) => { if (e.key == '-' || e.key == '+') e.preventDefault() })

    this.AddEventListener(this.learningRateBox, 'keydown', (e) => { if (e.key == '-' || e.key == '+') e.preventDefault() })

    this.AddEventListener(this.kernelBox, 'change', () => this.ChangeKernel())
}

SupportVectorMachineVisualizer.prototype.InitDataSection = function() {
    let dataSection = MakeSection('Данные')
    this.leftControlsBox.appendChild(dataSection)

    this.dataTypeBox = MakeSelect('data-type-box', {
        SPIRAL_DATA: 'спираль',
        CIRCLE_DATA: 'окружность',
        SQUARE_DATA: 'квадраты',
        AREAS_DATA: 'две области',
        MOONS_DATA: 'moons'
    }, SPIRAL_DATA)

    this.dataTestPartBox = MakeNumberInput('data-test-part-box', 0.5, 0.05, 0.1, 0.9, 'range')
    this.dataNoisePartBox = MakeNumberInput('data-noise-part-box', 0.0, 0.05, 0, 0.5, 'range')

    this.regenerateButton = MakeButton('data-regenerate-btn', 'Сгенерировать')

    this.dataCount = SVM_DATA_SIZE

    MakeLabeledBlock(dataSection, this.dataTypeBox, '<b>Тип данных</b><br>')
    MakeLabeledRange(dataSection, this.dataTestPartBox, '<b>Доля тестовых данных<br>', () => { return Math.round(this.dataTestPartBox.value * 100) + '%' }, 'control-block no-margin')
    MakeLabeledRange(dataSection, this.dataNoisePartBox, '<b>Шум<br>', () => { return Math.round(this.dataNoisePartBox.value * 100) + '%' }, 'control-block no-margin')
    MakeLabeledBlock(dataSection, this.regenerateButton, '', 'centered control-block')

    this.AddEventListener(this.dataTypeBox, 'change', () => this.UpdateData(false))
    this.AddEventListener(this.dataTestPartBox, 'input', () => this.UpdateData(false))
    this.AddEventListener(this.dataNoisePartBox, 'input', () => this.UpdateData(false))
    this.AddEventListener(this.regenerateButton, 'click', () => this.UpdateData(false))
}

SupportVectorMachineVisualizer.prototype.InitSVM = function() {
    let lambda = +this.svmLambdaBox.value
    this.svm = new SupportVectorMachine(2, lambda)
    this.isTraining = false
}

SupportVectorMachineVisualizer.prototype.InitControls = function() {
    this.InitButtonsSection()
    this.InitTrainSection()
    this.InitDataSection()
    this.InitSVM()
    this.InitView()

    this.UpdateData()
}

SupportVectorMachineVisualizer.prototype.AppendLossComponents = function(section) {
    this.lossSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")

    this.trainLossPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    this.testLossPath = document.createElementNS("http://www.w3.org/2000/svg", "path")

    this.trainLossBox = MakeSpan('train-loss-box', '')
    this.testLossBox = MakeSpan('test-loss-box', '')
    this.epochBox = MakeSpan('epoch-box', '')
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
    div.appendChild(this.epochBox)
    div.appendChild(document.createElement('br'))
    div.appendChild(this.trainLossBox)
    div.appendChild(document.createElement('br'))
    div.appendChild(this.testLossBox)
    div.appendChild(document.createElement('br'))
    div.appendChild(this.lossSVG)

    MakeLabeledBlock(section, div, '', 'control-block no-margin')
}

SupportVectorMachineVisualizer.prototype.InitView = function() {
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
    MakeLabeledBlock(cell2, this.showDiscreteBox, 'Показать выход дискретно', 'control-block no-margin no-h-padding')

    this.AppendLossComponents(cell2)
    this.viewBox.appendChild(table)

    this.AddEventListener(this.showTestBox, 'change', () => this.DrawDataset())
    this.AddEventListener(this.showDiscreteBox, 'change', () => this.DrawDataset())
}

/****************************************** HELPERS SECTION ******************************************/
SupportVectorMachineVisualizer.prototype.PointToVector = function(x, y) {
    return [x, y]
}

SupportVectorMachineVisualizer.prototype.ConvertDataToSVM = function(data) {
    let result = { x: [], y: [], length: data.length }

    for (let i = 0; i < data.length; i++) {
        result.x[i] = this.PointToVector(data.points[i].x, data.points[i].y)
        result.y[i] = data.labels[i] == 0 ? 1 : -1
    }

    return result
}

SupportVectorMachineVisualizer.prototype.AppendLoss = function(losses, loss, path) {
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

/****************************************** UPDATE SECTION ******************************************/
SupportVectorMachineVisualizer.prototype.UpdateLossesInfo = function(trainLoss, testLoss) {
    this.trainLossBox.innerHTML = 'Ошибка на train: ' + Math.round(trainLoss * 10000) / 10000
    this.testLossBox.innerHTML = 'Ошибка на test: ' + Math.round(testLoss * 10000) / 10000
    this.epochBox.innerHTML = 'Эпоха: ' + this.epoch
}

SupportVectorMachineVisualizer.prototype.UpdateLosses = function() {
    let trainLoss = this.svm.ComputeCostOnData(this.trainSVMData)
    let testLoss = this.svm.ComputeCostOnData(this.trainSVMData)

    this.UpdateLossesInfo(trainLoss, testLoss)
}

SupportVectorMachineVisualizer.prototype.UpdateCanvasData = function() {
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

SupportVectorMachineVisualizer.prototype.UpdateSVMData = function() {
    this.svm.Reset()

    this.trainSVMData = this.ConvertDataToSVM(this.trainData)
    this.testSVMData = this.ConvertDataToSVM(this.testData)
    this.canvasData = this.UpdateCanvasData()

    this.UpdateLosses()
}

SupportVectorMachineVisualizer.prototype.UpdateData = function(resetTrain = true) {
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
        this.UpdateSVMData()
    }

    this.DrawDataset()
}

// TODO
SupportVectorMachineVisualizer.prototype.ChangeKernel = function() {

}

/****************************************** TRAIN SECTION ******************************************/
SupportVectorMachineVisualizer.prototype.ResetLosses = function() {
    this.trainLosses = []
    this.testLosses = []

    this.trainLossPath.setAttribute('d', '')
    this.testLossPath.setAttribute('d', '')

    this.minLoss = Infinity
    this.maxLoss = -Infinity
}

SupportVectorMachineVisualizer.prototype.ResetTrain = function(needResetSVM = true) {
    this.StopTrain()

    if (needResetSVM) {
        this.svm.Reset()
    }

    this.epoch = 0

    this.UpdateSVMData()
    this.ResetLosses()
    this.DrawDataset()
}

SupportVectorMachineVisualizer.prototype.StopTrain = function() {
    if (!this.isTraining)
        return

    this.trainButton.text.textContent = '⏵'
    this.isTraining = false
}

SupportVectorMachineVisualizer.prototype.StartTrain = function() {
    if (this.isTraining)
        return

    this.trainButton.text.textContent = '⏸'
    this.isTraining = true

    requestAnimationFrame(() => this.LoopTrain())
}

SupportVectorMachineVisualizer.prototype.StepTrain = function() {
    let learningRate = +this.learningRateBox.value
    this.svm.TrainEpoch(this.trainSVMData, learningRate)

    let trainLoss = this.svm.ComputeCostOnData(this.trainSVMData, this.lossFunction)
    let testLoss = this.svm.ComputeCostOnData(this.testSVMData, this.lossFunction)

    this.minLoss = Math.min(this.minLoss, Math.min(trainLoss, testLoss))
    this.maxLoss = Math.max(this.maxLoss, Math.max(trainLoss, testLoss))

    this.epoch++
    this.AppendLoss(this.trainLosses, trainLoss, this.trainLossPath)
    this.AppendLoss(this.testLosses, testLoss, this.testLossPath)
    this.UpdateLossesInfo(trainLoss, testLoss)

    this.DrawDataset()

    console.log('epoch: ' + this.epoch, 'loss: ' + trainLoss, 'test: ' + testLoss)
}

SupportVectorMachineVisualizer.prototype.Train = function() {
    if (!this.isTraining) {
        this.StartTrain()
    }
    else {
        this.StopTrain()
    }
}

SupportVectorMachineVisualizer.prototype.LoopTrain = function() {
    if (!this.isTraining)
        return

    this.StepTrain()
    requestAnimationFrame(() => this.LoopTrain())
}

/****************************************** DRAW HELPERS ******************************************/
SupportVectorMachineVisualizer.prototype.MixColor = function(color1, color2, t) {
    t = Math.max(0, Math.min(1, t))

    return [
        Math.floor(color1[0] * t + color2[0] * (1 - t)),
        Math.floor(color1[1] * t + color2[1] * (1 - t)),
        Math.floor(color1[2] * t + color2[2] * (1 - t)),
    ]
}

SupportVectorMachineVisualizer.prototype.GetColorByOutput = function(output, isDiscrete) {
    let label = output > 0 ? 0 : 1
    let colors = [[221, 115, 115], [118, 153, 212]]

    return isDiscrete ? colors[label] : this.MixColor(colors[label], [255, 255, 255], Math.abs(output))
}

/****************************************** DRAW SECTION ******************************************/
SupportVectorMachineVisualizer.prototype.DrawSVM = function(ctx, canvas) {
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let index = 0
    let isDiscrete = this.showDiscreteBox.checked

    for (let i = 0; i < canvas.height * canvas.width; i++) {
        let output = this.svm.PredictOne(this.canvasData[i])
        let color = this.GetColorByOutput(output, isDiscrete)

        data.data[index++] = color[0]
        data.data[index++] = color[1]
        data.data[index++] = color[2]
        index++
    }

    ctx.putImageData(data, 0, 0)
}

SupportVectorMachineVisualizer.prototype.DrawData = function(ctx, canvas, data, colors, border, radius) {
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

SupportVectorMachineVisualizer.prototype.DrawDataset = function() {
    this.dataCtx.fillRect(0, 0, this.dataCanvas.width, this.dataCanvas.height)

    this.DrawSVM(this.dataCtx, this.dataCanvas)
    this.DrawData(this.dataCtx, this.dataCanvas, this.trainData, ['#dd7373', '#7699d4'], '#fff', 3)

    if (this.showTestBox.checked) {
        this.DrawData(this.dataCtx, this.dataCanvas, this.testData, ['#ba274a', '#2191fb'], '#000', 3)
    }
}
