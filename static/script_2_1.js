const socket = io();
const room = window.room;
const sessionId = window.session_id;

let myRole = null;
let opponentRole = null;

// Подключение к комнате
socket.emit('join_game_room', { room, session_id: sessionId });

// Обработчики событий
socket.on('roles_updated', (data) => {
    console.log('Обновление ролей:', data);
    
    // Определяем свою роль
    myRole = Object.keys(data.roles).find(role => data.roles[role] === sessionId);
    
    // Определяем роль оппонента
    opponentRole = Object.keys(data.roles).find(role => 
        data.roles[role] && data.roles[role] !== sessionId
    );
    
    updateUI();
});

socket.on('role_taken', (data) => {
    alert(`Роль "${getRoleName(data.role)}" уже занята другим игроком!`);
});

socket.on('game_started', () => {
    if (myRole === 'creator') {
        window.location.href = `/game_creator?room=${room}`;
    } else {
        window.location.href = `/game_guesser?room=${room}`;
    }
});

socket.on('player_left', () => {
    alert('Другой игрок покинул игру. Вы будете перенаправлены в комнату.');
    window.location.href = `/game?room=${room}`;
});

// Вспомогательные функции
function getRoleName(role) {
    return role === 'guesser' ? 'Угадывающий' : 'Загадывающий';
}

function chooseRole(role) {
    if (myRole === role) return;
    
    socket.emit('select_role', { 
        room: room, 
        session_id: sessionId, 
        role: role 
    });
}

function startGame() {
    if (myRole && opponentRole) {
        socket.emit('start_game', { room });
    } else {
        alert('Оба игрока должны выбрать разные роли!');
    }
}

function updateUI() {
    // Обновляем кнопки ролей
    const guesserBtn = document.getElementById('role-guesser');
    const creatorBtn = document.getElementById('role-creator');
    
    guesserBtn.classList.toggle('selected', myRole === 'guesser');
    creatorBtn.classList.toggle('selected', myRole === 'creator');
    
    // Блокируем занятые роли
    guesserBtn.disabled = opponentRole === 'guesser';
    creatorBtn.disabled = opponentRole === 'creator';
    
    // Обновляем статус
    let statusMessage = myRole ? `Вы: ${getRoleName(myRole)}` : 'Выберите роль';
    if (opponentRole) {
        statusMessage += ` | Оппонент: ${getRoleName(opponentRole)}`;
    }
    document.getElementById('status-message').textContent = statusMessage;
    
    // Активируем кнопку старта
    document.getElementById('start-game').disabled = !(myRole && opponentRole);
}

function leaveGame() {
    if (confirm('Вы уверены, что хотите покинуть игру?')) {
        socket.emit('leave_game', { room, session_id: sessionId });
        window.location.href = `/game?room=${room}`;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('role-guesser').addEventListener('click', () => chooseRole('guesser'));
    document.getElementById('role-creator').addEventListener('click', () => chooseRole('creator'));
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('leave-game').addEventListener('click', leaveGame);
});