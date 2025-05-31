const socket = io();
const roomCode = window.roomCode;
const sessionId = window.sessionId;

let selectedRole = null;
let otherPlayerRole = null;

// Инициализация подключения к комнате
socket.emit('join_game_room', { room: roomCode, session_id: sessionId });

// Обработчики событий Socket.IO
socket.on('role_assigned', (data) => {
  if (data.session_id === sessionId) {
    selectedRole = data.role;
    updateRoleUI();
  }
  if (data.session_id !== sessionId) {
    otherPlayerRole = data.role;
    updatePlayersStatus();
  }
});

socket.on('roles_updated', (data) => {
  // Обновляем информацию о других игроках
  for (const [playerId, role] of Object.entries(data.roles)) {
    if (playerId !== sessionId) {
      otherPlayerRole = role;
    }
  }
  updatePlayersStatus();
  checkStartConditions();
});

socket.on('game_started', () => {
  document.getElementById('gameStatus').textContent = 'Игра началась!';
  document.getElementById('startGameBtn').style.display = 'none';
});

socket.on('force_leave', () => {
  window.location.href = `/game?room=${roomCode}`;
});

// Функции UI
function selectRole(role) {
  if (selectedRole) {
    alert(`Вы уже выбрали роль: ${selectedRole === 'hider' ? 'Загадывающий' : 'Угадывающий'}`);
    return;
  }
  
  socket.emit('select_role', { 
    room: roomCode, 
    session_id: sessionId, 
    role: role 
  });
}

function updateRoleUI() {
  const guesserBtn = document.getElementById('guesserBtn');
  const hiderBtn = document.getElementById('hiderBtn');
  const roleStatus = document.getElementById('roleStatus');
  
  if (selectedRole === 'guesser') {
    guesserBtn.classList.add('selected');
    hiderBtn.classList.remove('selected');
    roleStatus.textContent = 'Вы выбрали роль: Угадывающий';
  } else if (selectedRole === 'hider') {
    hiderBtn.classList.add('selected');
    guesserBtn.classList.remove('selected');
    roleStatus.textContent = 'Вы выбрали роль: Загадывающий';
  }
}

function updatePlayersStatus() {
  const statusElement = document.getElementById('gameStatus');
  
  if (otherPlayerRole) {
    statusElement.textContent = `Другой игрок выбрал роль: ${
      otherPlayerRole === 'hider' ? 'Загадывающий' : 'Угадывающий'
    }`;
  } else {
    statusElement.textContent = 'Другой игрок еще не выбрал роль';
  }
}

function checkStartConditions() {
  const startBtn = document.getElementById('startGameBtn');
  
  if (selectedRole && otherPlayerRole && selectedRole !== otherPlayerRole) {
    startBtn.style.display = 'inline-block';
  } else {
    startBtn.style.display = 'none';
  }
}

function startGame() {
  socket.emit('start_game_request', { room: roomCode });
}

function confirmLeave() {
  if (confirm('Вы уверены, что хотите покинуть игру? Это завершит игру для всех участников.')) {
    socket.emit('leave_game', { room: roomCode, session_id: sessionId });
  }
}

// Инициализация UI
document.addEventListener('DOMContentLoaded', () => {
  updateRoleUI();
  updatePlayersStatus();
  checkStartConditions();
});