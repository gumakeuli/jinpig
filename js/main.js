// 게임 인스턴스
let game;

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 캔버스 요소 가져오기
        const canvas = document.getElementById('gameCanvas');

        // Game 클래스가 정의되어 있는지 확인
        if (typeof Game === 'undefined') {
            alert('게임 초기화 오류: Game 클래스를 찾을 수 없습니다.\njs/game.js 파일이 제대로 로드되지 않았습니다.');
            console.error('Game class is not defined. Check if js/game.js loaded correctly.');
            return;
        }

        // 게임 인스턴스 생성
        game = new Game(canvas);

        // 초기 화면 그리기
        game.drawStartScreen();

        // 버튼 이벤트 리스너 설정
        setupButtons();
    } catch (error) {
        console.error('Initialization Error:', error);
        alert('게임 초기화 오류: ' + error.message + '\n' + error.stack);
    }
});

window.onerror = function (message, source, lineno, colno, error) {
    alert('Global Error: ' + message + '\nLine: ' + lineno + '\nSource: ' + source);
    return false;
};

function setupButtons() {
    const startBtn = document.getElementById('startBtn');
    const gameTitle = document.getElementById('gameTitle');

    // 게임 시작 버튼
    startBtn.addEventListener('click', () => {
        console.log('Game Start Button Clicked');
        if (game) {
            game.start();
            // 타이틀 화면 숨기기
            gameTitle.style.display = 'none';
        } else {
            console.error('Game instance not initialized');
        }
    });

    // 엔터키로 게임 시작
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && gameTitle.style.display !== 'none') {
            game.start();
            gameTitle.style.display = 'none';
        }
    });
}

// 게임 오버 시 타이틀 다시 표시
function showTitle() {
    const gameTitle = document.getElementById('gameTitle');
    gameTitle.style.display = 'block';
}

// 페이지를 벗어날 때 경고
window.addEventListener('beforeunload', (e) => {
    if (game && game.isRunning) {
        e.preventDefault();
        e.returnValue = '';
    }
});
