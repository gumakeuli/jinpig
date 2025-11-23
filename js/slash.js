class Slash {
    constructor(x, y, direction, damage) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 'up', 'down', 'left', 'right'
        this.damage = damage;
        this.active = true;

        this.lifetime = 0.3; // 0.3초 지속
        this.timer = 0;

        this.width = 120;
        this.height = 120;

        // 이미지 로드 (3번 아이템 이미지 사용)
        this.image = new Image();
        this.image.src = 'assets/images/items/3.png';

        // 회전 각도 설정
        this.startAngle = 0;
        this.endAngle = Math.PI;
        this.currentAngle = 0;

        this.setupRotation();
    }

    setupRotation() {
        // 방향에 따른 초기 각도 및 회전 범위 설정
        switch (this.direction) {
            case 'right':
                this.baseRotation = 0;
                break;
            case 'down':
                this.baseRotation = Math.PI / 2;
                break;
            case 'left':
                this.baseRotation = Math.PI;
                break;
            case 'up':
                this.baseRotation = -Math.PI / 2;
                break;
            default: // 기본값 right
                this.baseRotation = 0;
        }
    }

    update(deltaTime, playerX, playerY) {
        this.timer += deltaTime;

        // 플레이어 위치 따라가기
        this.x = playerX;
        this.y = playerY;

        if (this.timer >= this.lifetime) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 진행률 (0 ~ 1)
        const progress = this.timer / this.lifetime;

        // 180도 회전 애니메이션 (-90도 ~ +90도)
        // baseRotation을 기준으로 -90도에서 시작해서 +90도로 끝남
        const rotationOffset = (progress - 0.5) * Math.PI;
        const currentRotation = this.baseRotation + rotationOffset;

        ctx.rotate(currentRotation);

        // 이미지 그리기 (중심점 기준)
        // 3번 이미지가 검 모양이라고 가정하고 회전
        // 이미지를 45도 더 회전시켜서 검이 베는 것처럼 보이게 조정
        ctx.rotate(Math.PI / 4);

        ctx.drawImage(
            this.image,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        ctx.restore();

        // 디버그용 히트박스 (부채꼴)
        // ctx.beginPath();
        // ctx.moveTo(this.x, this.y);
        // ctx.arc(this.x, this.y, this.width/2, this.baseRotation - Math.PI/2, this.baseRotation + Math.PI/2);
        // ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        // ctx.fill();
    }

    // 충돌 체크 (부채꼴 형태)
    checkCollision(enemy) {
        if (!this.active) return false;

        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 1. 거리 체크 (사거리 내에 있는지)
        if (distance > this.width / 2 + enemy.width / 2) {
            return false;
        }

        // 2. 각도 체크 (전방 180도 내에 있는지)
        let angle = Math.atan2(dy, dx);

        // 각도 정규화 (-PI ~ PI)
        let angleDiff = angle - this.baseRotation;

        // -PI ~ PI 사이로 보정
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 전방 180도 (좌우 90도) 체크
        if (Math.abs(angleDiff) <= Math.PI / 2) {
            return true;
        }

        return false;
    }
}
