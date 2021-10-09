function WordEmbeddingVisualizer(viewBox, leftcontrolsBox, topControlsBox) {
    this.viewBox = viewBox
    this.leftControlsBox = leftcontrolsBox
    this.topControlsBox = topControlsBox

    this.InitEmbeddingSecion()
    this.InitWordSection()
}

WordEmbeddingVisualizer.prototype.InitEmbeddingSecion = function() {
    let embeddingSection = MakeSection('Файл с представлением')
    this.leftControlsBox.appendChild(embeddingSection)

    this.loadBtn = MakeButton('load-btn', 'Загрузить')
    this.pathDiv = MakeDiv('path-div', 'файл не выбран', 'centere')
    this.fileInput = MakeFileInput('.json', () => this.ChangeFile())
    this.loadBtn.addEventListener('click', () => { this.fileInput.click() })

    let block = MakeLabeledBlock(embeddingSection, this.loadBtn, '', 'control-block centered')
    block.appendChild(this.pathDiv)
}

WordEmbeddingVisualizer.prototype.InitWordSection = function() {
    this.wordSection = MakeSection('Параметры векторов')
    this.leftControlsBox.appendChild(this.wordSection)

    this.wordsInput = MakeTextInput('words-input', 'king - man + woman')
    this.topCountBox = MakeNumberInput('top-count-box', 10, 1, 1, 20, 'range')
    this.metricBox = MakeSelect('metric-box', { 'cos': 'косинусное', 'l2': 'L2 норма'}, 'cos')

    this.calcBtn = MakeButton('load-btn', 'Найти')
    this.calcBtn.addEventListener('click', () => this.Calculate())

    this.wordsTable = MakeDiv('words-table', '')

    MakeLabeledBlock(this.wordSection, this.wordsInput, '<b>Выражение из слов</b>')
    MakeLabeledRange(this.wordSection, this.topCountBox, '<b>Количество выводимых слов<br></b>', () => { return this.topCountBox.value }, 'control-block no-margin')
    MakeLabeledBlock(this.wordSection, this.metricBox, '<b>Метрика схожести</b>', 'control-block no-margin')
    MakeLabeledBlock(this.wordSection, this.calcBtn, '', 'control-block centered')
    MakeLabeledBlock(this.wordSection, this.wordsTable, '')
    this.wordSection.style.display = 'none'
}

WordEmbeddingVisualizer.prototype.ChangeFile = function() {
    if (this.fileInput.files.length == 0)
        return

    let file = this.fileInput.files[0]
    this.pathDiv.innerHTML = file.name

    let reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => this.LoadFile(reader.result)
}

WordEmbeddingVisualizer.prototype.LoadFile = function(text) {
    let t0 = performance.now()
    let data = JSON.parse(text)

    this.embedding = data['embedding']
    this.size = data['size']
    this.wordSection.style.display = ''

    let t1 = performance.now()
    console.log('Load time:', t1 - t0, 'ms (' + Object.keys(this.embedding).length + ')')
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

WordEmbeddingVisualizer.prototype.PrintTopWords = function(top) {
    this.wordsTable.innerHTML = ''

    for (let i = 0; i < top.words.length; i++) {
        this.wordsTable.innerHTML += (i + 1) + '. <b>' + top.words[i] + '</b> (' + (Math.round(top.similarities[i] * 1000) / 1000) + ')<br>'
    }
}

// TODO: fix expression parsing
WordEmbeddingVisualizer.prototype.Calculate = function() {
    let t0 = performance.now()
    let expression = this.wordsInput.value.match(/\+|\-|[^\s]+/gi)
    let weights = [1]
    let words = [expression[0]]

    for (let i = 1; i < expression.length; i += 2) {
        if (expression[i] == '-') {
            weights.push(-1)
        }
        else if (expression[i] == '+') {
            weights.push(1)
        }

        words.push(expression[i + 1])
    }

    let count = +this.topCountBox.value
    let v = this.Combination(words, weights)
    let top = this.GetTopWords(v, count)
    
    this.PrintTopWords(top)

    let t1 = performance.now()
    console.log('Calculate time:', t1 - t0, 'ms')
}