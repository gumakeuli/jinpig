// 별의 소리 클래스
class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.active = true;

        // 이미지 로드
        this.image = new Image();
        this.image.src = 'assets/images/8.webp';

        // 떠다니는 효과 (아이작 골드 스타일)
        this.baseY = y; // 기본 Y 위치
        this.floatTimer = Math.random() * Math.PI * 2; // 랜덤 시작 위치
        this.floatSpeed = 2; // 떠다니는 속도
        this.floatRange = 8; // 위아래로 움직이는 범위 (픽셀)
    }

    update(deltaTime, canvasWidth, canvasHeight, roomBounds) {
        if (!this.active) return;

        // 떠다니는 효과 (sin 파동)
        this.floatTimer += deltaTime * this.floatSpeed;
        this.y = this.baseY + Math.sin(this.floatTimer) * this.floatRange;
    }

    draw(ctx) {
        if (!this.active) return;

        const x = this.x - this.width / 2;
        const y = this.y - this.height / 2;

        if (this.image.complete) {
            ctx.drawImage(this.image, x, y, this.width, this.height);
        } else {
            // 로딩 중엔 노란 별 모양
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 충돌 박스
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
