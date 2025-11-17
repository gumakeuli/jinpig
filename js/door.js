// 문 클래스
class Door {
    constructor(direction, canvasWidth, canvasHeight) {
        this.direction = direction; // 'top', 'bottom', 'left', 'right'
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.doorWidth = 80;
        this.doorHeight = 48;
        this.wallThickness = 48;

        this.active = true; // 문이 열려있는지

        // 방향에 따라 문 위치 설정
        this.setPosition();
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
        const playerBounds = {
            x: player.x - player.width / 2,
            y: player.y - player.height / 2,
            width: player.width,
            height: player.height
        };

        return this.active &&
               playerBounds.x < this.x + this.width &&
               playerBounds.x + playerBounds.width > this.x &&
               playerBounds.y < this.y + this.height &&
               playerBounds.y + playerBounds.height > this.y;
    }

    // 문 그리기
    draw(ctx) {
        if (!this.active) return;

        // 문 배경 (어두운 색)
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 문 테두리
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // 문 장식 (중앙에 작은 사각형)
        ctx.fillStyle = '#444';
        const decorSize = Math.min(this.width, this.height) * 0.3;
        ctx.fillRect(
            this.x + this.width / 2 - decorSize / 2,
            this.y + this.height / 2 - decorSize / 2,
            decorSize,
            decorSize
        );
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
