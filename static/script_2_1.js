const socket = io();
const room = window.room;
const sessionId = window.session_id;

let selectedRole = null;
let otherPlayer = null;

// Подключаемся к игровой комнате
socket.emit('join_game_room', { room, session_id: sessionId });

// В начале файла добавьте
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

// И измените функцию confirmLeave
function confirmLeave() {
  if (confirm('Вы уверены, что хотите покинуть игру? Это завершит игру для всех участников.')) {
    socket.emit('leave_game', { room, session_id: sessionId });
    // Добавьте перенаправление сразу после отправки события
    window.location.href = `/game?room=${room}`;
  }
}

// Обработчики событий
socket.on('role_assigned', (data) => {
  if (data.session_id === sessionId) {
    selectedRole = data.role;
    updateRoleUI();
    document.getElementById('status-message').textContent = `Вы выбрали роль: ${getRoleName(data.role)}`;
  } else {
    otherPlayer = {
      id: data.session_id,
      role: data.role
    };
    document.getElementById('status-message').textContent = 
      `Другой игрок выбрал роль: ${getRoleName(data.role)}`;
  }
  checkStartConditions();
});

socket.on('role_taken', (data) => {
  alert(`Роль "${getRoleName(data.role)}" уже занята другим игроком!`);
});

socket.on('game_started', () => {
  document.getElementById('status-message').textContent = 'Игра началась!';
  // Здесь будет переход к игровому процессу
});

socket.on('player_left', () => {
  if (confirm('Другой игрок покинул игру. Вернуться в комнату?')) {
    window.location.href = `/game?room=${room}`;
  }
});

socket.on('force_leave', () => {
  window.location.href = `/game?room=${room}`;
});

// Функции
function getRoleName(role) {
  return role === 'guesser' ? 'Угадывающий' : 'Загадывающий';
}

function chooseRole(role) {
  if (selectedRole) {
    alert(`Вы уже выбрали роль: ${getRoleName(selectedRole)}`);
    return;
  }
  socket.emit('select_role', { room, session_id: sessionId, role });
}

function updateRoleUI() {
  document.querySelectorAll('.role-button').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  if (selectedRole === 'guesser') {
    document.getElementById('role-guesser').classList.add('selected');
  } else if (selectedRole === 'creator') {
    document.getElementById('role-creator').classList.add('selected');
  }
}

function checkStartConditions() {
  const startBtn = document.getElementById('start-game');
  if (selectedRole && otherPlayer && otherPlayer.role && 
      selectedRole !== otherPlayer.role) {
    startBtn.disabled = false;
  } else {
    startBtn.disabled = true;
  }
}

function startGame() {
  if (selectedRole && otherPlayer && selectedRole !== otherPlayer.role) {
    socket.emit('start_game', { room });
  }
}

function confirmLeave() {
  if (confirm('Вы уверены, что хотите покинуть игру? Это завершит игру для всех участников.')) {
    socket.emit('leave_game', { room, session_id: sessionId });
  }
}

// Обработка выхода из игры
function leaveGame() {
    if (confirm('Вы уверены, что хотите покинуть игру?')) {
        socket.emit('leave_game', { 
            room: window.room, 
            session_id: window.session_id 
        });
    }
}

// Обработка команды на выход
socket.on('force_leave', () => {
    window.location.href = `/game?room=${window.room}`;
});

socket.on('player_left', (data) => {
    console.log(`Игрок ${data.session_id} покинул игру`);
    alert('Другой игрок покинул игру. Вы будете перенаправлены.');
    window.location.href = `/game?room=${window.room}`;
});