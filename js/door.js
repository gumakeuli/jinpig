// 문 클래스
class Door {
    constructor(direction, canvasWidth, canvasHeight) {
        this.direction = direction; // 'top', 'bottom', 'left', 'right'
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.doorWidth = 80;
        this.doorHeight = 48;
        this.wallThickness = 48;

        this.active = true; // 문이 활성화되어 있는지
        this.isOpen = false; // 문이 열려있는지 (처음엔 닫혀있음)

        // 방향에 따라 문 위치 설정
        this.setPosition();
    }

    // 문 열기
    open() {
        this.isOpen = true;
    }

    // 문 닫기
    close() {
        this.isOpen = false;
    }

    setPosition() {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        switch(this.direction) {
            case 'top':
                this.x = centerX - this.doorWidth / 2;
                this.y = 0;
                this.width = this.doorWidth;
                this.height = this.wallThickness;
                break;
            case 'bottom':
                this.x = centerX - this.doorWidth / 2;
                this.y = this.canvasHeight - this.wallThickness;
                this.width = this.doorWidth;
                this.height = this.wallThickness;
                break;
            case 'left':
                this.x = 0;
                this.y = centerY - this.doorWidth / 2;
                this.width = this.wallThickness;
                this.height = this.doorWidth;
                break;
            case 'right':
                this.x = this.canvasWidth - this.wallThickness;
                this.y = centerY - this.doorWidth / 2;
                this.width = this.wallThickness;
                this.height = this.doorWidth;
                break;
        }
    }

    // 플레이어가 문과 충돌했는지 확인
    checkCollision(player) {
        // 문이 열려있을 때만 통과 가능
        if (!this.isOpen) return false;

        // 플레이어 중심점
        const playerCenterX = player.x;
        const playerCenterY = player.y;

        // 문의 중심점
        const doorCenterX = this.x + this.width / 2;
        const doorCenterY = this.y + this.height / 2;

        // 거리 계산
        const distance = Math.sqrt(
            Math.pow(playerCenterX - doorCenterX, 2) +
            Math.pow(playerCenterY - doorCenterY, 2)
        );

        // 문 크기에 따른 감지 범위 (넓게)
        const detectionRange = Math.max(this.width, this.height) * 1.2;

        return this.active && distance < detectionRange;
    }

    // 문 그리기
    draw(ctx) {
        if (!this.active) return;

        if (this.isOpen) {
            // 열린 문 - 밝고 빛나는 느낌
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // 빛나는 테두리
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // 중앙 빛 효과
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(this.width, this.height) / 2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else {
            // 닫힌 문 - 어둡고 잠긴 느낌
            ctx.fillStyle = '#660000';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // 잠긴 문 테두리
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // X 표시 (잠김)
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            const padding = 10;
            ctx.beginPath();
            ctx.moveTo(this.x + padding, this.y + padding);
            ctx.lineTo(this.x + this.width - padding, this.y + this.height - padding);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - padding, this.y + padding);
            ctx.lineTo(this.x + padding, this.y + this.height - padding);
            ctx.stroke();
        }
    }

    // 충돌 박스 가져오기
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
