function MakeTextInput(id, value) {
    let input = document.createElement('input')
    
    input.type = 'text'
    input.id = id
    input.value = value

    return input
}

function MakeNumberInput(id, value, step, min, max, type = 'number') {
    let input = document.createElement('input')
    
    input.type = type
    input.id = id

    input.step = step
    input.min = min
    input.max = max

    input.value = value

    return input
}

function MakeCheckBox(id, checked = false) {
    let checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = id
    checkbox.checked = checked
    return checkbox
}

function MakeSelect(id, values, selected = null) {
    let select = document.createElement('select')
    select.id = id

    for (let value of Object.keys(values)) {
        let option = document.createElement('option')
        option.value = value
        option.text = values[value]

        if (value == selected) {
            option.selected = true
        }

        select.appendChild(option)
    }

    return select
}

function MakeSpan(id, text) {
    let span = document.createElement('span')
    span.id = id
    span.innerHTML = text
    return span
}

function MakeDiv(id, text, className = '') {
    let div = document.createElement('div')
    div.id = id
    div.className = className
    div.innerHTML = text
    return div
}

function MakeButton(id, text) {
    let button = document.createElement('input')
    button.type = 'submit'
    button.id = id
    button.value = text
    return button
}

function MakeFileInput(accept, onchange) {
    let fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = accept
    fileInput.onchange = onchange
    return fileInput
}

function MakeSection(text, className = 'controls-section') {
    let section = document.createElement('div')
    section.className = className

    if (text != '') {
        let header = document.createElement('div')
        header.className = 'header'
        header.innerHTML = text

        section.appendChild(header)
    }

    return section
}

function MakeLabeledBlock(parent, block, text, className = 'control-block') {
    let div = document.createElement('div')
    div.className = className

    if (text != '') {
        let label = document.createElement('label')

        label.innerHTML = text
        label.appendChild(block)

        if (block.type == 'checkbox') {
            div.appendChild(block)
            label.setAttribute('for', block.id)
        }

        div.appendChild(label)
    }
    else {
        div.appendChild(block)
    }

    parent.appendChild(div)

    return div
}

function MakeLabeledRange(parent, range, text, onchange, className = 'control-block') {
    let block = MakeLabeledBlock(parent, range, text, className)
    let div = MakeDiv('value-' + range.id, '', 'centered font-less')
    block.appendChild(div)

    let label = block.children[0]
    range.oninput = function() {
        div.innerHTML = onchange()
    }

    range.oninput()
}

function MakeCircleButton(x, y, value, hint, radius, onclick) {
    let button = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    button.setAttribute('cx', x)
    button.setAttribute('cy', y)
    button.setAttribute('r', radius)
    button.setAttribute('class', 'button')
    button.setAttribute('stroke-width', '1px')
    button.onclick = onclick

    let text = document.createElementNS("http://www.w3.org/2000/svg", "text")

    text.textContent = value
    text.setAttribute('x', x)
    text.setAttribute('y', y)
    text.setAttribute('class', 'button-text')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('text-anchor', 'middle')
    text.onclick = onclick

    let title = document.createElementNS("http://www.w3.org/2000/svg", "title")
    title.textContent = hint
    button.appendChild(title)

    return {button: button, text: text}
}