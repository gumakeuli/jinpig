// 발사체 클래스
class Projectile {
    constructor(x, y, dirX, dirY, damage = 1) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;

        // 이동
        this.speed = 400; // 픽셀/초
        this.dirX = dirX;
        this.dirY = dirY;

        // 속성
        this.damage = damage;
        this.active = true;
    }

    // 업데이트
    update(deltaTime, canvasWidth, canvasHeight) {
        // 이동
        this.x += this.dirX * this.speed * deltaTime;
        this.y += this.dirY * this.speed * deltaTime;

        // 화면 밖으로 나가면 비활성화
        if (this.x < 0 || this.x > canvasWidth ||
            this.y < 0 || this.y > canvasHeight) {
            this.active = false;
        }
    }

    // 그리기
    draw(ctx) {
        // 노란 원형 발사체
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // 테두리
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 충돌 체크용 경계 가져오기
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
