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

        // 물리 효과
        this.vx = (Math.random() - 0.5) * 100; // 랜덤 수평 속도
        this.vy = -150 - Math.random() * 50; // 위로 튀어오름
        this.gravity = 500; // 중력
        this.bounce = 0.3; // 바운스 감쇠
        this.friction = 0.95; // 마찰

        // 수명
        this.lifetime = 5; // 5초 후 사라짐
        this.age = 0;

        // 깜빡임 효과
        this.blinkTimer = 0;
        this.blinkInterval = 0.1;
        this.visible = true;
    }

    update(deltaTime, canvasWidth, canvasHeight, roomBounds) {
        if (!this.active) return;

        this.age += deltaTime;

        // 수명 체크
        if (this.age >= this.lifetime) {
            this.active = false;
            return;
        }

        // 물리 업데이트
        this.vy += this.gravity * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // 마찰
        this.vx *= this.friction;

        // 바닥 충돌 (방 경계)
        if (this.y + this.height / 2 >= roomBounds.bottom) {
            this.y = roomBounds.bottom - this.height / 2;
            this.vy = -this.vy * this.bounce;

            // 거의 멈춤
            if (Math.abs(this.vy) < 50) {
                this.vy = 0;
            }
        }

        // 벽 충돌
        if (this.x - this.width / 2 <= roomBounds.left) {
            this.x = roomBounds.left + this.width / 2;
            this.vx = -this.vx * this.bounce;
        }
        if (this.x + this.width / 2 >= roomBounds.right) {
            this.x = roomBounds.right - this.width / 2;
            this.vx = -this.vx * this.bounce;
        }

        // 수명 마지막 2초일 때 깜빡임
        if (this.lifetime - this.age < 2) {
            this.blinkTimer += deltaTime;
            if (this.blinkTimer >= this.blinkInterval) {
                this.visible = !this.visible;
                this.blinkTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.active || !this.visible) return;

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
