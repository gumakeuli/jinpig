class GifSlash {
    constructor(x, y, angle, damage, imagePath) {
        this.x = x;
        this.y = y;
        this.initialAngle = angle; // 초기 각도 저장
        this.angle = angle;
        this.damage = damage;
        this.active = true;

        this.lifetime = 1.5; // GIF 재생 시간 (3번 베기 애니메이션 전체 재생)
        this.timer = 0;
        this.orbitRadius = 60; // 플레이어로부터의 거리

        this.width = 300; // 이펙트 크기 증가 (150 -> 300)
        this.height = 300;

        // DOM 요소 생성
        this.element = document.createElement('img');
        this.element.src = `${imagePath}?t=${Date.now()}`; // 캐시 방지 (GIF 처음부터 재생)
        this.element.style.position = 'absolute';
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.transformOrigin = 'center';
        this.element.style.pointerEvents = 'none'; // 마우스 이벤트 통과
        this.element.style.zIndex = '1000'; // 캔버스 위에 표시 (높은 우선순위)

        // 게임 영역에 추가
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.appendChild(this.element);
        }

        this.hitEnemies = [];
    }

    update(deltaTime, playerX, playerY, cameraX, cameraY) {
        this.timer += deltaTime;

        // 플레이어를 따라다니기 (플레이어 기준으로 일정 거리 유지)
        // 오른쪽 아래로 오프셋 추가
        this.x = playerX + Math.cos(this.angle) * this.orbitRadius + 20;
        this.y = playerY + Math.sin(this.angle) * this.orbitRadius + 40;

        // 화면상 위치 계산
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // DOM 요소 위치 업데이트
        this.element.style.left = `${screenX - this.width / 2}px`;
        this.element.style.top = `${screenY - this.height / 2}px`;

        // 회전 적용 (마우스 방향으로 고정)
        this.element.style.transform = `rotate(${this.angle}rad)`;

        if (this.timer >= this.lifetime) {
            this.active = false;
            this.removeElement();
        }
    }

    draw(ctx) {
        // DOM으로 표시하므로 캔버스에는 그리지 않음 (디버그용 히트박스만 가능)
        // this.drawDebugHitbox(ctx);
    }

    drawDebugHitbox(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    checkCollision(enemy) {
        if (!this.active) return false;

        // 간단한 원형 충돌 or AABB
        // 여기서는 이펙트 중심 기준 원형 충돌로 처리 (회전 무시)
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 이펙트 반지름 + 적 반지름
        const hitRadius = this.width / 2 * 0.8; // 80% 크기
        const enemyRadius = enemy.width / 2;

        return dist < hitRadius + enemyRadius;
    }

    removeElement() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
