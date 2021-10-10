function WordEmbeddingVisualizer(viewBox, leftcontrolsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox

    this.InitEmbeddingSecion()
    this.InitWordSection()
    this.InitView()
}

WordEmbeddingVisualizer.prototype.InitEmbeddingSecion = function() {
    let embeddingSection = MakeSection('Файл с представлением')
    this.leftControlsBox.appendChild(embeddingSection)

    this.embeddingBox = MakeSelect('embedding-box', {
        'load': 'Загрузить файл',
        'data/computer_security.json': 'компьютерная безопасность (73 Mb)',
        'data/computer_security_lower.json': 'компьютерная безопасность (lower, 64 Mb)',
        'data/news.json': 'новости с wikinews (117 Mb)',
        'data/news_lower.json': 'новости с wikinews (lower, 109 Mb)'
    }, 'load')
    this.embeddingBox.addEventListener('change', () => this.ChangeEmbedding())

    this.loadBtn = MakeButton('load-btn', 'Загрузить')
    this.pathDiv = MakeDiv('path-div', 'файл не выбран', 'centere')
    this.fileInput = MakeFileInput('.json', () => this.ChangeFile())
    this.loadBtn.addEventListener('click', () => { this.fileInput.click() })

    MakeLabeledBlock(embeddingSection, this.embeddingBox, '', 'control-block centered')
    this.loadBlock = MakeLabeledBlock(embeddingSection, this.loadBtn, '', 'control-block centered')
    this.loadBlock.appendChild(this.pathDiv)
}

WordEmbeddingVisualizer.prototype.InitWordSection = function() {
    this.wordSection = MakeSection('Параметры векторов')
    this.leftControlsBox.appendChild(this.wordSection)

    this.wordsInput = MakeTextInput('words-input', 'king - man + woman')
    this.topCountBox = MakeNumberInput('top-count-box', 10, 1, 1, 20, 'range')
    this.pcaCountBox = MakeNumberInput('pca-count-box', 25, 1, 5, 100, 'range')
    this.metricBox = MakeSelect('metric-box', { 'cos': 'косинусное', 'l2': 'L2 норма'}, 'cos')

    this.calcBtn = MakeButton('load-btn', 'Найти')
    this.calcBtn.addEventListener('click', () => this.Calculate())

    this.wordsTable = MakeDiv('words-table', '')

    MakeLabeledBlock(this.wordSection, this.wordsInput, '<b>Выражение из слов</b>')
    MakeLabeledRange(this.wordSection, this.topCountBox, '<b>Количество выводимых слов<br></b>', () => { return this.topCountBox.value }, 'control-block no-margin')
    MakeLabeledRange(this.wordSection, this.pcaCountBox, '<b>Количество слов для PCA<br></b>', () => { return this.pcaCountBox.value }, 'control-block no-margin')
    MakeLabeledBlock(this.wordSection, this.metricBox, '<b>Метрика схожести</b>', 'control-block no-margin')
    MakeLabeledBlock(this.wordSection, this.calcBtn, '', 'control-block centered')
    MakeLabeledBlock(this.wordSection, this.wordsTable, '')
    this.wordSection.style.display = 'none'
}

WordEmbeddingVisualizer.prototype.InitView = function() {
    this.pcaSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.pcaSVG.style.width = '100%'
    this.pcaSVG.style.height = '100%'

    this.pcaGraphic = document.createElementNS("http://www.w3.org/2000/svg", "g")
    this.pcaSVG.appendChild(this.pcaGraphic)
    this.pcaSVG.addEventListener('mousewheel', (e) => this.ScrollPCA(e))

    this.viewBox.appendChild(this.pcaSVG)
}

WordEmbeddingVisualizer.prototype.ChangeEmbedding = function() {
    let embedding = this.embeddingBox.value

    if (embedding == 'load') {
        this.loadBlock.style.display = ''
    }
    else {
        this.loadBlock.style.display = 'none'
        this.wordSection.style.display = 'none'
        this.wordsTable.innerHTML = ''

        this.LoadEmbedding(embedding)
    }
}

WordEmbeddingVisualizer.prototype.ChangeFile = function() {
    if (this.fileInput.files.length == 0)
        return

    let file = this.fileInput.files[0]
    this.pathDiv.innerHTML = file.name
    this.wordSection.style.display = 'none'
    this.wordsTable.innerHTML = ''

    let reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => this.LoadFile(JSON.parse(reader.result))
}

WordEmbeddingVisualizer.prototype.LoadEmbedding = function(src) {
    $.getJSON(src, (data) => this.LoadFile(data))
}

WordEmbeddingVisualizer.prototype.LoadFile = function(data) {
    this.embedding = data['embedding']
    this.size = data['size']
    this.wordSection.style.display = ''
}

WordEmbeddingVisualizer.prototype.MakePCAPoint = function(word, x, y, radius = 15) {
    let point = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    point.setAttribute('cx', x)
    point.setAttribute('cy', y)
    point.setAttribute('r', radius)
    point.setAttribute('fill', '#7699d4')
    point.setAttribute('stroke', '#000')
    point.setAttribute('stroke-width', '1px')
    this.pcaGraphic.appendChild(point)

    let text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.textContent = word
    text.setAttribute('y', y - radius)
    text.setAttribute('dominant-baseline', 'middle')

    if (x < this.pcaSVG.clientWidth / 2) {
        text.setAttribute('x', x + radius)
        text.setAttribute('text-anchor', 'start')
    }
    else {
        text.setAttribute('x', x - radius)
        text.setAttribute('text-anchor',  'end')
    }

    this.pcaGraphic.appendChild(text)

    point.addEventListener('mouseover', () => this.BringToFront(point, text))
    point.addEventListener('mousemove', () => this.BringToFront(point, text))
    point.addEventListener('mouseleave', () => this.ResetPoints())

    text.addEventListener('mouseover', () => this.BringToFront(point, text))
    text.addEventListener('mousemove', () => this.BringToFront(point, text))
    text.addEventListener('mouseleave', () => this.ResetPoints())
}

WordEmbeddingVisualizer.prototype.BringToFront = function(point, text) {
    this.pcaGraphic.removeChild(point)
    this.pcaGraphic.removeChild(text)

    for (let child of this.pcaGraphic.children) {
        if (child.tagName == 'text') {
            child.setAttribute('fill', '#ddd')
        }
        else if (child.tagName == 'circle') {
            child.setAttribute('fill', '#ddd')
            child.setAttribute('stroke', '#bbb')
        }
    }

    text.setAttribute('fill', '#000')
    point.setAttribute('fill', '#7699d4')
    point.setAttribute('stroke', '#000')

    this.pcaGraphic.appendChild(point)
    this.pcaGraphic.appendChild(text)
}

WordEmbeddingVisualizer.prototype.ResetPoints = function() {
    for (let child of this.pcaGraphic.children) {
        if (child.tagName == 'text') {
            child.setAttribute('fill', '#000')
        }
        else if (child.tagName == 'circle') {
            child.setAttribute('fill', '#7699d4')
            child.setAttribute('stroke', '#000')
        }
    }
}

WordEmbeddingVisualizer.prototype.ScrollPCA = function(e) {
    if (e.shiftKey) {
        this.offsetX -= Math.sign(e.deltaY) * 20
    }
    else if (e.altKey) {
        this.offsetY -= Math.sign(e.deltaY) * 20
    }
    else {
        let scale = e.deltaY < 0 ? 1.25 : 0.8
        this.pcaScale *= scale
        this.offsetX = (this.offsetX - e.offsetX) * scale + e.offsetX
        this.offsetY = (this.offsetY - e.offsetY) * scale + e.offsetY
    }

    e.preventDefault()
    this.pcaGraphic.setAttribute('transform', `translate(${this.offsetX} ${this.offsetY}) scale(${this.pcaScale})`)
}

WordEmbeddingVisualizer.prototype.DrawPCA = function(words, computed) {
    let xmin = Infinity
    let xmax = -Infinity

    let ymin = Infinity
    let ymax = -Infinity

    for (let i = 0; i < words.length; i++) {
        xmin = Math.min(xmin, computed[0][i])
        xmax = Math.max(xmax, computed[0][i])

        ymin = Math.min(ymin, computed[1][i])
        ymax = Math.max(ymax, computed[1][i])
    }

    this.pcaGraphic.innerHTML = ''
    this.pcaScale = 1
    this.offsetX = 0
    this.offsetY = 0
    this.pcaGraphic.setAttribute('transform', `translate(${this.offsetX} ${this.offsetY}) scale(${this.pcaScale})`)

    let radius = 7
    let padding = 10
    let width = this.pcaSVG.clientWidth - 2 * (padding + radius)
    let height = this.pcaSVG.clientHeight - 2 * (padding + radius)

    for (let i = 0; i < words.length; i++) {
        let x = padding + radius + (computed[0][i] - xmin) / (xmax - xmin) * width
        let y = padding + radius + (computed[1][i] - ymin) / (ymax - ymin) * height

        this.MakePCAPoint(words[i], x, y, radius)
    }
}

WordEmbeddingVisualizer.prototype.PCA = function(words) {
    let data = []

    for (let word of words)
        data.push(this.embedding[word].vector)

    let vectors = PCA.getEigenVectors(data)
    let computed = PCA.computeAdjustedData(data, vectors[0], vectors[1]).adjustedData

    this.DrawPCA(words, computed)
}

WordEmbeddingVisualizer.prototype.Dot = function(a, b) {
    let dot = 0

    for (let i = 0; i < this.size; i++)
        dot += a[i] * b[i]

    return dot
}

WordEmbeddingVisualizer.prototype.CosineSimilarity = function(a, b) {
    return this.Dot(a.vector, b.vector) / (a.len * b.len)
}

WordEmbeddingVisualizer.prototype.L2Similarity = function(a, b) {
    let norm = 0

    for (let i = 0; i < this.size; i++)
        norm += (a.vector[i] - b.vector[i]) * (a.vector[i] - b.vector[i])

    return 1 - Math.sqrt(norm) / (a.len * b.len)
}

WordEmbeddingVisualizer.prototype.Similarity = function(a, b) {
    let metric = this.metricBox.value

    if (metric == 'cos')
        return this.CosineSimilarity(a, b)

    if (metric == 'l2')
        return this.L2Similarity(a, b)

    return 0
}

WordEmbeddingVisualizer.prototype.Combination = function(words, weights) {
    let v = new Array(this.size).fill(0)

    for (let i = 0; i < words.length; i++) {
        let vector = this.embedding[words[i]]

        if (vector == undefined) {
            console.log('word "' + words[i] + '" was skipped')
            continue
        }

        for (let j = 0; j < this.size; j++)
            v[j] += vector.vector[j] * weights[i]
    }

    return v
}

WordEmbeddingVisualizer.prototype.GetTopWords = function(v, count) {
    let len = Math.sqrt(this.Dot(v, v))

    if (len == 0)
        len = 1

    let node = {vector: v, len: len}
    let words = PartialSort(Object.keys(this.embedding), count, (a, b) => { return this.Similarity(node, this.embedding[b]) - this.Similarity(node, this.embedding[a])})
    let similarities = []

    for (let i = 0; i < count; i++)
        similarities.push(this.Similarity(node, this.embedding[words[i]]))

    return { words: words, similarities: similarities }
}

WordEmbeddingVisualizer.prototype.PrintTopWords = function(top, count) {
    this.wordsTable.innerHTML = ''

    for (let i = 0; i < count; i++) {
        this.wordsTable.innerHTML += (i + 1) + '. <b>' + top.words[i] + '</b> (' + (Math.round(top.similarities[i] * 1000) / 1000) + ')<br>'
    }
}

// TODO: fix expression parsing
WordEmbeddingVisualizer.prototype.Calculate = function() {
    let expression = this.wordsInput.value.match(/\+|\-|[^\s]+/gi)
    let weights = [1]
    let words = [expression[0]]
    let start = 1

    if (expression[0] == '-') {
        start = 2
        weights[0] = -1
        words[0] = expression[1]
    }

    for (let i = start; i < expression.length; i += 2) {
        if (expression[i] == '-') {
            weights.push(-1)
        }
        else if (expression[i] == '+') {
            weights.push(1)
        }

        words.push(expression[i + 1])
    }

    let topCount = +this.topCountBox.value
    let pcaCount = +this.pcaCountBox.value
    let count = Math.max(topCount, pcaCount)

    let v = this.Combination(words, weights)
    let top = this.GetTopWords(v, count)
    
    this.PrintTopWords(top, topCount)

    let pcaWords = []

    for (word of words)
        if (word in this.embedding)
            pcaWords.push(word)

    for (word of top.words)
        pcaWords.push(word)

    this.PCA(pcaWords)
}