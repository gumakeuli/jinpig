// 유틸리티 함수들

// AABB (Axis-Aligned Bounding Box) 충돌 감지
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 원형 충돌 감지
function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

// 거리 계산
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// 랜덤 정수 생성
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 랜덤 실수 생성
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 배열에서 랜덤 요소 선택
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}
