const socket = io();
const room = window.room;
const sessionId = window.session_id;

let myRole = null;
let opponentRole = null;

// Подключение к комнате
socket.emit('join_game_room', { room, session_id: sessionId });

// Обработчики событий
socket.on('role_update', (data) => {
    console.log('Получено обновление ролей:', data);
    
    // Обновляем свою роль
    if (data.your_role) {
        myRole = data.your_role;
        document.getElementById('status-message').textContent = `Вы выбрали роль: ${getRoleName(myRole)}`;
    }
    
    // Находим роль противника
    opponentRole = Object.keys(data.roles).find(role => 
        data.roles[role] && data.roles[role] !== sessionId
    );
    
    updateUI();
});

socket.on('role_taken', (data) => {
    alert(`Роль "${getRoleName(data.role)}" уже занята!`);
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

// Функции
function getRoleName(role) {
    return role === 'guesser' ? 'Угадывающий' : 'Загадывающий';
}

function chooseRole(role) {
    if (myRole) {
        alert(`Вы уже выбрали роль ${getRoleName(myRole)}`);
        return;
    }
    socket.emit('select_role', { room, session_id: sessionId, role });
}

function startGame() {
    if (myRole && opponentRole) {
        socket.emit('start_game', { room });
    } else {
        alert('Не все роли выбраны!');
    }
}

function updateUI() {
    // Обновляем кнопки ролей
    document.querySelectorAll('.role-button').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
    });
    
    if (myRole) {
        document.getElementById(`role-${myRole}`).classList.add('selected');
        document.getElementById(`role-${myRole}`).disabled = true;
    }
    
    if (opponentRole) {
        document.getElementById(`role-${opponentRole}`).disabled = true;
        document.getElementById('status-message').textContent += 
            `\nДругой игрок выбрал роль: ${getRoleName(opponentRole)}`;
    }
    
    // Активируем кнопку старта если обе роли выбраны
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