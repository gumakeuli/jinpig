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

        // 깜빡임 효과 (아이작 스타일)
        this.blinkTimer = 0;
        this.blinkInterval = 0.15; // 0.15초마다 깜빡임
        this.visible = true;

        // 스케일 애니메이션
        this.scaleTimer = 0;
        this.scale = 1;
    }

    update(deltaTime, canvasWidth, canvasHeight, roomBounds) {
        if (!this.active) return;

        // 깜빡임 효과
        this.blinkTimer += deltaTime;
        if (this.blinkTimer >= this.blinkInterval) {
            this.visible = !this.visible;
            this.blinkTimer = 0;
        }

        // 부드러운 스케일 애니메이션 (크기가 약간 변하는 효과)
        this.scaleTimer += deltaTime * 3;
        this.scale = 1 + Math.sin(this.scaleTimer) * 0.1; // 0.9 ~ 1.1 사이로 변함
    }

    draw(ctx) {
        if (!this.active || !this.visible) return;

        // 스케일 애니메이션 적용
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        const x = this.x - scaledWidth / 2;
        const y = this.y - scaledHeight / 2;

        if (this.image.complete) {
            ctx.drawImage(this.image, x, y, scaledWidth, scaledHeight);
        } else {
            // 로딩 중엔 노란 별 모양
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, (this.width / 2) * this.scale, 0, Math.PI * 2);
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
