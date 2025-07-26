import { onCanvasChange } from './drawing.js';


const socket = io();
const svgViewport = document.getElementById('svg-viewport');
const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const deleteRoomBtn = document.getElementById('delete-room');
let currentRoomId = null;


createRoomBtn.addEventListener('click', () => {
  socket.emit('create-room');
});


deleteRoomBtn.addEventListener('click', () => {
  if (currentRoomId) {
    const confirmDelete = confirm("Are you sure you want to delete this room?");
    if (confirmDelete) {
      socket.emit('delete-room', currentRoomId);
    }
  } else {
    alert('Not in a room.');
  }
});


socket.on('room-deleted', () => {
  alert('⚠️ Room was deleted. Returning to personal board.');
  currentRoomId = null;
  svgViewport.innerHTML = '';
   window.history.pushState({}, '', '/'); 
});

joinRoomBtn.addEventListener('click', () => {
  const roomId = prompt('Enter the Room ID to join:');
  if (roomId && roomId.trim() !== '') {
    socket.emit('join-room', roomId.trim());
  } else {
    alert('Room ID cannot be empty.');
  }
});

socket.on('room-created', (roomId) => {
  alert(`Room created! Your Room ID: ${roomId}`);
  window.history.pushState(null, null, `?room=${roomId}`);
  socket.emit('join-room', roomId);
});

socket.on('joined-room', (roomId) => {
  alert(`✅ You have joined room: ${roomId}`);
  currentRoomId = roomId;
  window.history.pushState(null, null, `?room=${roomId}`);
  const svgViewport = document.getElementById('svg-viewport');
  svgViewport.innerHTML = '';
});

socket.on('clear-board', () => {
  svgViewport.innerHTML = '';
});


onCanvasChange((change) => {
  if (currentRoomId) {
    socket.emit('canvas-change', { roomId: currentRoomId, change });
  }
});

// Apply incoming changes from server
socket.on('canvas-change', ({ change }) => {
if (change.type === 'pen') {

  const existing = Array.from(svgViewport.children).find(
    el => el.tagName === 'path' && el.getAttribute('data-id') === change.id
  );
  if (existing) svgViewport.removeChild(existing);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', change.path);
  path.setAttribute('stroke', change.stroke);
  path.setAttribute('stroke-width', change.width);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('data-id', change.id); 
  svgViewport.appendChild(path);
}

  else if (change.type === 'shape' || change.type === 'move' || change.type === 'resize') {
  const children = Array.from(svgViewport.children);
  for (let el of children) {
    if (el.getAttribute('data-id') === change.id) {
      svgViewport.removeChild(el);
      break;
    }
  }

  const shape = document.createElementNS('http://www.w3.org/2000/svg', change.shape);
  for (const [key, val] of Object.entries(change.attributes)) {
    shape.setAttribute(key, val);
  }

  shape.setAttribute('data-id', change.id || 'remote-' + crypto.randomUUID());

  if (change.shape.toLowerCase() === 'text') {
    if (change.content !== undefined) {
      shape.textContent = change.content;
    } else {
      
      const original = children.find(el => el.getAttribute('data-id') === change.id);
      if (original) shape.textContent = original.textContent;
    }
  }

  svgViewport.appendChild(shape);
}

  else if (change.type === 'curve') {
  
  const existing = Array.from(svgViewport.children).find(
    el => el.tagName === 'path' && el.getAttribute('data-id') === change.id
  );
  if (existing) {
    svgViewport.removeChild(existing);
  }

  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', change.path);
  path.setAttribute('stroke', change.stroke);
  path.setAttribute('stroke-width', change.width);
  path.setAttribute('fill', 'transparent');
  path.setAttribute('data-id', change.id || 'remote-' + crypto.randomUUID());
  svgViewport.appendChild(path);
}


  else if (change.type === 'text') {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    for (const [key, val] of Object.entries(change.attributes)) {
      text.setAttribute(key, val);
    }
    text.setAttribute('data-id', change.id || 'remote-' + crypto.randomUUID());
    text.textContent = change.content;
    svgViewport.appendChild(text);
  }

  else if (change.type === 'erase') {
    const children = Array.from(svgViewport.children);
    for (let el of children) {
      if (
        el.tagName.toLowerCase() === change.shape.toLowerCase() &&
        el.getAttribute('data-id') === change.id
      ) {
        svgViewport.removeChild(el);
        break;
      }
    }
  }

  else if (change.type === 'clear') {
    svgViewport.innerHTML = '';
  }
  
});
socket.on('error', (message) => {
  alert(message);
  window.history.pushState({}, '', '/');
  currentRoomId=null
});
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (roomId) {
    socket.emit('join-room', roomId);
  }
});