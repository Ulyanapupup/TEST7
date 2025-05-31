const socket = io();
const roomCode = window.roomCode;
const sessionId = window.sessionId;

let selectedRole = null;
let playersReady = 0;

// Инициализация подключения к комнате
socket.emit('join_game_room', { room: roomCode, session_id: sessionId });

// Обработчики событий Socket.IO
socket.on('role_assigned', (data) => {
  if (data.session_id === sessionId) {
    selectedRole = data.role;
    updateRoleUI();
  }
});

socket.on('roles_updated', (data) => {
  updatePlayersStatus(data.roles);
  checkStartConditions(data.roles);
});

socket.on('game_started', () => {
  document.getElementById('gameStatus').textContent = 'Игра началась!';
  document.getElementById('startGameBtn').style.display = 'none';
});

socket.on('player_left', () => {
  alert('Другой игрок покинул игру. Возвращаемся в комнату...');
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

function updatePlayersStatus(roles) {
  const statusElement = document.getElementById('gameStatus');
  let statusText = '';
  
  for (const [playerId, role] of Object.entries(roles)) {
    if (playerId === sessionId) continue;
    
    statusText += `Игрок ${playerId.substring(0, 5)}... выбрал роль: `;
    statusText += role === 'hider' ? 'Загадывающий' : 'Угадывающий';
    statusText += '\n';
  }
  
  statusElement.textContent = statusText || 'Другой игрок еще не выбрал роль';
}

function checkStartConditions(roles) {
  const startBtn = document.getElementById('startGameBtn');
  const rolesList = Object.values(roles);
  
  // Проверяем, что есть оба типа ролей
  const hasHider = rolesList.includes('hider');
  const hasGuesser = rolesList.includes('guesser');
  
  if (hasHider && hasGuesser && rolesList.length === 2) {
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
    window.location.href = `/game?room=${roomCode}`;
  }
}

// Инициализация UI
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('guesserBtn').textContent = 'Угадывающий';
  document.getElementById('hiderBtn').textContent = 'Загадывающий';
});