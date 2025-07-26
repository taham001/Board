let changeCallback = null;

export function onCanvasChange(cb) {
  changeCallback = cb;
}

function notifyChange(data) {
  if (changeCallback) {
    changeCallback(data);
  }
}


const svgNS = 'http://www.w3.org/2000/svg';

const svg = document.getElementById('svg');

const svgViewport = document.getElementById('svg-viewport');
const bgColor = document.getElementById('bg-color');

const bgButton = document.getElementById('applyBtn');

bgButton.addEventListener('click', () => {
  document.body.style.backgroundColor = bgColor.value;
});

document.body.style.backgroundColor = bgColor.value;

const toolButtons = {
  pan: document.getElementById('pan'),
  pen: document.getElementById('pen'),
  line: document.getElementById('line'),
  rect: document.getElementById('rect'),
  circle: document.getElementById('circle'),
  oval: document.getElementById('oval'),
  text: document.getElementById('text'),
  eraser: document.getElementById('eraser'),
  move: document.getElementById('move'),
  resize: document.getElementById('resize'),
  clear: document.getElementById('clear'),
  curve: document.getElementById('curve'),
};

const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const boardContainer = document.getElementById('board-container');

let tool = 'pan';
let drawing = false;
let startX = 0, startY = 0;
let currentShape = null;
let selectedElement = null;

let activeTextBox = null;
let curveStartX = 0, curveStartY = 0;
let currentPath = null;
let curveData = null;
let offsetX = 0;
let offsetY = 0;
let scale = 1;

let panStartX = 0;
let panStartY = 0;
let stroke = null;
let isPanning = false;
let erasing = false;
let penStrokes = [];
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartR = 0;
let resizeStartRX = 0;
let resizeStartRY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

let isDrawing = false;

function resizeBoard() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
}
window.addEventListener('resize', resizeBoard);
resizeBoard();
updateCursor(tool);


for (const [name, btn] of Object.entries(toolButtons)) {
  btn.addEventListener('click', () => {
    tool = name;
    Object.values(toolButtons).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateCursor(tool);




    drawing = false;
    currentShape = null;
    selectedElement = null;
    if (activeTextBox) {
      svgViewport.removeChild(activeTextBox);

      activeTextBox = null;
    }
  });
}

toolButtons.pan.classList.add('active');
function redraw() {

  svgViewport.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);

}
function getTransformedCoords(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const screenCTM = svgViewport.getScreenCTM();
  if (!screenCTM) return { x: 0, y: 0 };
  const svgP = pt.matrixTransform(screenCTM.inverse());
  return { x: svgP.x, y: svgP.y };
}









boardContainer.addEventListener('mousedown', (e) => {
  if (tool === 'pan') {

    e.preventDefault();
    isPanning = true;
    boardContainer.classList.add('grabbing');
    panStartX = e.clientX;
    panStartY = e.clientY;

  }
});
boardContainer.addEventListener('mousemove', (e) => {
  if (tool === 'pan' && isPanning) {
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    offsetX += dx / scale;
    offsetY += dy / scale;

    panStartX = e.clientX;
    panStartY = e.clientY;
    redraw()
  }
});

boardContainer.addEventListener('mouseup', () => {
  if (tool === 'pan' && isPanning) {
    isPanning = false;
    boardContainer.classList.remove('grabbing');
  }
});

boardContainer.addEventListener('mouseleave', () => {
  if (tool === 'pan' && isPanning) {
    isPanning = false;
    boardContainer.classList.remove('grabbing');
  }
});
boardContainer.addEventListener('wheel', (e) => {
  e.preventDefault();

  const zoomFactor = 1.1;
  let oldScale = scale;

  if (e.deltaY < 0) {
    scale *= zoomFactor;
  } else {
    scale /= zoomFactor;
  }


  scale = Math.min(Math.max(scale, 0.1), 10);

  const rect = boardContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  offsetX -= (mouseX / oldScale - mouseX / scale);
  offsetY -= (mouseY / oldScale - mouseY / scale);

  redraw();
});
function updateCursor(tool) {
  switch (tool) {
    case 'pen':

      svg.style.cursor = 'crosshair';
      boardContainer.style.cursor = 'default';
      break;
    case 'line':
    case 'curve':
    case 'rect':
    case 'circle':
    case 'oval':
    case 'resize':
      svg.style.cursor = 'crosshair';

      boardContainer.style.cursor = 'default';
      break;
    case 'text':
      svg.style.cursor = 'text';

      boardContainer.style.cursor = 'default';
      break;
    case 'eraser':

      svg.style.cursor = 'cell';
      boardContainer.style.cursor = 'default';
      break;
    case 'move':
      svg.style.cursor = 'move';

      boardContainer.style.cursor = 'default';
      break;
    case 'pan':



      svg.style.cursor = 'grab';
      boardContainer.style.cursor = 'grab';

      break;
    default:

      svg.style.cursor = 'grab';
      boardContainer.style.cursor = 'grab';
  }
}


svg.addEventListener('mousedown', e => {

  const t = tool;
  const tgt = e.target;
  const { x, y } = getTransformedCoords(e);

  if (t === 'pen') {
    drawing = true;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('stroke', colorPicker.value);
    path.setAttribute('stroke-width', sizePicker.value);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('data-id', 'shape-' + crypto.randomUUID());
    currentPath = path;
    penStrokes = [`M ${x} ${y}`];
    svgViewport.appendChild(path);
    return;
  }
  if (t === 'eraser' && tgt !== svg) {
    svgViewport.removeChild(tgt);
    const tag = tgt.tagName.toLowerCase();
    const attrs = {};
    for (let attr of tgt.getAttributeNames()) {
      attrs[attr] = tgt.getAttribute(attr);
    }

    notifyChange({
      type: 'erase',
      shape: tag,
      attributes: attrs,
      id: tgt.getAttribute('data-id'),
    });
    return;
  }


  if (t === 'move' && tgt !== svg) {
    const tag = tgt.tagName.toLowerCase();

    selectedElement = tgt;
    const bbox = tgt.getBBox();
    if (tag === 'circle' || tag === 'ellipse') {

      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      dragOffsetX = x - centerX;
      dragOffsetY = y - centerY;
    }
    else if (tag === 'text') {
      const xAttr = parseFloat(tgt.getAttribute('x')) || 0;
      const yAttr = parseFloat(tgt.getAttribute('y')) || 0;
      dragOffsetX = x - xAttr;
      dragOffsetY = y - yAttr;
    } else {
      dragOffsetX = x - bbox.x;
      dragOffsetY = y - bbox.y;
    }
    startX = x;
    startY = y;
    return;
  }

  if (t === 'resize' && ['rect', 'circle', 'ellipse'].includes(tgt.tagName.toLowerCase())) {
    selectedElement = tgt;
    startX = x;
    startY = y;

    const tag = tgt.tagName.toLowerCase();

    if (tag === 'rect') {
      resizeStartWidth = parseFloat(tgt.getAttribute('width'));
      resizeStartHeight = parseFloat(tgt.getAttribute('height'));
    } else if (tag === 'circle') {
      resizeStartR = parseFloat(tgt.getAttribute('r'));
    } else if (tag === 'ellipse') {
      resizeStartRX = parseFloat(tgt.getAttribute('rx'));
      resizeStartRY = parseFloat(tgt.getAttribute('ry'));
    }

    return;
  }

  if (t === 'curve') {
    if (tgt.tagName === 'path') {

      selectedElement = tgt;

      const d = tgt.getAttribute('d');
      const match = d.match(/M\s+([\d.]+)\s+([\d.]+)\s+Q\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);

      if (match) {
        const [, x1, y1, cx, cy, x2, y2] = match.map(Number);
        curveData = { x1, y1, cx, cy, x2, y2 };
        offsetX = x - cx;
        offsetY = y - cy;
        startX = x;
        startY = y;
      }
    } else {

      isDrawing = true;
      startX = x;
      startY = y;

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('stroke', colorPicker.value);
      path.setAttribute('stroke-width', sizePicker.value);
      path.setAttribute('fill', 'transparent');
      const id = 'shape-' + crypto.randomUUID();
      path.setAttribute('data-id', id);
      svgViewport.appendChild(path);

      selectedElement = path;
    }
  }
  if (['line', 'rect', 'circle', 'oval'].includes(t)) {
    drawing = true;
    startX = x; startY = y;
    currentShape = document.createElementNS(svgNS,
      t === 'oval' ? 'ellipse' : t);
    // initial attributes
    if (t === 'line') {
      currentShape.setAttribute('x1', startX);
      currentShape.setAttribute('y1', startY);
      currentShape.setAttribute('x2', startX);
      currentShape.setAttribute('y2', startY);
    } else if (t === 'rect') {
      currentShape.setAttribute('x', startX);
      currentShape.setAttribute('y', startY);
      currentShape.setAttribute('width', 0);
      currentShape.setAttribute('height', 0);
    } else if (t === 'circle') {
      currentShape.setAttribute('cx', startX);
      currentShape.setAttribute('cy', startY);
      currentShape.setAttribute('r', 0);
    }

    else {
      currentShape.setAttribute('cx', startX);
      currentShape.setAttribute('cy', startY);
      currentShape.setAttribute('rx', 0);
      currentShape.setAttribute('ry', 0);
    }

    currentShape.setAttribute('stroke', colorPicker.value);
    currentShape.setAttribute('stroke-width', sizePicker.value);
    currentShape.setAttribute('fill', 'none');
    currentShape.setAttribute('data-id', 'shape-' + crypto.randomUUID());
    svgViewport.appendChild(currentShape);
    return;
  }
});


svg.addEventListener('mousemove', e => {
  const t = tool;
  const { x, y } = getTransformedCoords(e);
  if (t === 'pen' && drawing && currentPath) {
    penStrokes.push(`L ${x} ${y}`);
    currentPath.setAttribute('d', penStrokes.join(' '));
    const d = penStrokes.join(' ');
    const attrs = {};
    for (let attr of currentPath.getAttributeNames()) {
      attrs[attr] = currentPath.getAttribute(attr);
    }
    notifyChange({
      type: 'pen',
      path: d,
      shape: 'path',
      id: currentPath.getAttribute('data-id'),
      stroke: colorPicker.value,
      width: sizePicker.value,
      attributes: attrs
    });
    return;
  }
  if (t === 'curve') {
    if (curveData) {

      const newCX = x
      const newCY = y
      const { x1, y1, x2, y2 } = curveData;

      const d = `M ${x1} ${y1} Q ${newCX} ${newCY} ${x2} ${y2}`;
      selectedElement.setAttribute('d', d);
      const attrs = {};
      for (let attr of selectedElement.getAttributeNames()) {
        attrs[attr] = selectedElement.getAttribute(attr);
      }
      notifyChange({
        type: 'curve',
        shape: 'path',
        id: selectedElement.getAttribute('data-id'),
        path: d,
        stroke: selectedElement.getAttribute('stroke'),
        width: selectedElement.getAttribute('stroke-width'),
        attributes: attrs
      });
    } else if (isDrawing && selectedElement) {


      const cx = (startX + x) / 2;
      const cy = (startY + y) / 2;

      const d = `M ${startX} ${startY} Q ${cx} ${cy} ${x} ${y}`;
      selectedElement.setAttribute('d', d);
    }
  }

  if (t === 'resize' && selectedElement) {
    const dx = x - startX;
    const dy = y - startY;

    const tag = selectedElement.tagName.toLowerCase();

    if (tag === 'rect') {
      selectedElement.setAttribute('width', Math.max(1, resizeStartWidth + dx));
      selectedElement.setAttribute('height', Math.max(1, resizeStartHeight + dy));
    } else if (tag === 'circle') {
      selectedElement.setAttribute('r', Math.max(1, resizeStartR + dx));
    } else if (tag === 'ellipse') {
      selectedElement.setAttribute('rx', Math.max(1, resizeStartRX + dx));
      selectedElement.setAttribute('ry', Math.max(1, resizeStartRY + dy));
    }
  }

  if (t === 'move' && selectedElement) {
    const tag = selectedElement.tagName.toLowerCase();
    if (tag === 'rect' || tag === 'foreignObject') {
      selectedElement.setAttribute('x', x - dragOffsetX);
      selectedElement.setAttribute('y', y - dragOffsetY);
    } else if (tag === 'circle' || tag === 'ellipse') {
      selectedElement.setAttribute('cx', x - dragOffsetX);
      selectedElement.setAttribute('cy', y - dragOffsetY);
    } else if (tag === 'line') {
      const dx = x - startX;
      const dy = y - startY;

      const x1 = parseFloat(selectedElement.getAttribute('x1'));
      const y1 = parseFloat(selectedElement.getAttribute('y1'));
      const x2 = parseFloat(selectedElement.getAttribute('x2'));
      const y2 = parseFloat(selectedElement.getAttribute('y2'));

      selectedElement.setAttribute('x1', x1 + dx);
      selectedElement.setAttribute('y1', y1 + dy);
      selectedElement.setAttribute('x2', x2 + dx);
      selectedElement.setAttribute('y2', y2 + dy);


      startX = x;
      startY = y;
    } else if (tag === 'text') {
      const newX = x - dragOffsetX;
      const newY = y - dragOffsetY;

      selectedElement.setAttribute('x', newX);
      selectedElement.setAttribute('y', newY);

      const attrs = {};
      for (let attr of selectedElement.getAttributeNames()) {
        attrs[attr] = selectedElement.getAttribute(attr);
      }

      notifyChange({
        type: 'move',
        shape: 'text',
        id: selectedElement.getAttribute('data-id'),
        attributes: attrs,
        content: selectedElement.textContent
      });
      return;
    }

    else if (tag === 'path') {
      const d = selectedElement.getAttribute('d');
      const match = d.match(/M\s+([\d.]+)\s+([\d.]+)\s+Q\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);

      if (match) {
        const [, x1, y1, cx, cy, x2, y2] = match.map(Number);

        const dx = x - startX;
        const dy = y - startY;

        const newX1 = x1 + dx;
        const newY1 = y1 + dy;
        const newCX = cx + dx;
        const newCY = cy + dy;
        const newX2 = x2 + dx;
        const newY2 = y2 + dy;

        const newD = `M ${newX1} ${newY1} Q ${newCX} ${newCY} ${newX2} ${newY2}`;
        selectedElement.setAttribute('d', newD);

        startX = x;
        startY = y;
      }
    }
    const attrs = {};
    for (let attr of selectedElement.getAttributeNames()) {
      attrs[attr] = selectedElement.getAttribute(attr);
    }
    notifyChange({
      type: 'move',
      shape: selectedElement.tagName,
      id: selectedElement.getAttribute('data-id'),
      attributes: attrs
    });
    return;
  }


  if (drawing && currentShape) {
    if (t === 'line') {
      currentShape.setAttribute('x2', x);
      currentShape.setAttribute('y2', y);
    } else if (t === 'rect') {
      currentShape.setAttribute('x', Math.min(startX, x));
      currentShape.setAttribute('y', Math.min(startY, y));
      currentShape.setAttribute('width', Math.abs(x - startX));
      currentShape.setAttribute('height', Math.abs(y - startY));
    } else if (t === 'circle') {
      const r = Math.hypot(x - startX, y - startY);
      currentShape.setAttribute('r', r);
    } else if (t === 'oval') {
      currentShape.setAttribute('rx', Math.abs(x - startX));
      currentShape.setAttribute('ry', Math.abs(y - startY));
    }

  }
});


svg.addEventListener('mouseup', () => {
  drawing = false;
  if (currentShape && ['rect', 'circle', 'ellipse', 'line'].includes(currentShape.tagName)) {
    const tag = currentShape.tagName;
    const attrs = {};

    for (let attr of currentShape.getAttributeNames()) {
      attrs[attr] = currentShape.getAttribute(attr);
    }

    notifyChange({
      type: 'shape',
      shape: tag,
      attributes: attrs,
      id: currentShape.getAttribute('data-id')
    });
  }
  if (tool === 'curve' && selectedElement) {
    const d = selectedElement.getAttribute('d');
    notifyChange({
      type: 'curve',
      path: d,
      stroke: selectedElement.getAttribute('stroke'),
      width: selectedElement.getAttribute('stroke-width')
      , id: selectedElement.getAttribute('data-id')
    });
  }
  if (tool === 'resize' && selectedElement) {
    const tag = selectedElement.tagName;
    const attrs = {};
    for (let attr of selectedElement.getAttributeNames()) {
      attrs[attr] = selectedElement.getAttribute(attr);
    }
    notifyChange({
      type: 'resize',
      shape: tag,
      attributes: attrs,
      id: selectedElement.getAttribute('data-id')
    });
  }
  currentShape = null;

  selectedElement = null;

  curveData = null;
  currentPath = null;
  resizeStartWidth = 0;
  resizeStartHeight = 0;
  resizeStartR = 0;
  resizeStartRX = 0;
  resizeStartRY = 0;
  dragOffsetX = 0;
  dragOffsetY = 0;

});


svg.addEventListener('click', e => {
  if (tool !== 'text' || e.target !== svg) return;

  if (activeTextBox) {
    svgViewport.removeChild(activeTextBox);
    activeTextBox = null;
  }
  const { x, y } = getTransformedCoords(e);
  const fo = document.createElementNS(svgNS, 'foreignObject');
  fo.setAttribute('x', x);
  fo.setAttribute('y', y);
  fo.setAttribute('width', 200);
  fo.setAttribute('height', 50);

  const div = document.createElement('div');
  div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  div.contentEditable = true;
  div.style.border = '1px solid blue';
  div.style.padding = '4px';
  div.style.font = `${8 + parseInt(sizePicker.value) * 2}px sans-serif`;
  div.style.color = colorPicker.value;

  fo.appendChild(div);
  svgViewport.appendChild(fo);
  div.focus();
  activeTextBox = fo;

  div.addEventListener('blur', () => {
    const txt = div.innerText.trim();
    svgViewport.removeChild(fo);
    activeTextBox = null;
    if (txt) {
      const textEl = document.createElementNS(svgNS, 'text');
      textEl.setAttribute('x', x);
      textEl.setAttribute('y', y + 16);
      textEl.setAttribute('fill', colorPicker.value);
      textEl.setAttribute('font-size', 8 + parseInt(sizePicker.value) * 2);
      textEl.textContent = txt;
      textEl.setAttribute('data-id', 'shape-' + crypto.randomUUID());
      svgViewport.appendChild(textEl);
      notifyChange({
        type: 'text',
        shape: 'text',
        id: textEl.getAttribute('data-id'),
        attributes: {
          x,
          y: y + 16,
          fill: colorPicker.value,
          'font-size': 8 + parseInt(sizePicker.value) * 2
        },
        content: txt
      });

    }
  });
});

toolButtons.clear.addEventListener('click', () => {
  selectedElement = null;
  svgViewport.innerHTML = '';
  notifyChange({ type: 'clear' });
});
