// 발사체 클래스
class Projectile {
    constructor(x, y, dirX, dirY, damage = 1, isEnemy = false) {
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
        this.isEnemy = isEnemy;
        this.color = null;
        this.isOpal = false; // 오팔 총 효과
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
        if (this.isOpal) {
            // 오팔 총 효과 (신비로운 광채)
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width);
            gradient.addColorStop(0, '#ffffff'); // 중심은 흰색
            gradient.addColorStop(0.5, '#ccffff'); // 중간은 연한 하늘색
            gradient.addColorStop(1, '#ffccff'); // 끝은 연한 분홍색

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2 + 2, 0, Math.PI * 2); // 약간 더 크게
            ctx.fill();

            // 빛나는 테두리
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0; // 초기화
        } else {
            // 기본 발사체
            ctx.fillStyle = this.color || '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // 테두리
            ctx.strokeStyle = this.isEnemy ? '#ffffff' : '#ffaa00';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
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
