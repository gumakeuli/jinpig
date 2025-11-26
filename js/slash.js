class Slash {
    constructor(x, y, direction, damage) {
        this.x = x; // 플레이어 위치 (회전 중심)
        this.y = y;
        this.direction = direction; // 'up', 'down', 'left', 'right'
        this.damage = damage;
        this.active = true;

        this.lifetime = 0.25; // 0.25초 지속 (빠르게)
        this.timer = 0;

        this.width = 100;
        this.height = 100;
        this.reach = 60; // 플레이어 중심으로부터의 거리

        // 이미지 로드 (3번 아이템 이미지 사용)
        this.image = new Image();
        this.image.src = 'assets/images/items/3.png';

        this.setupRotation();
    }

    setupRotation() {
        // 방향에 따른 기준 각도 설정
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
            default:
                this.baseRotation = 0;
        }
    }

    update(deltaTime, playerX, playerY) {
        this.timer += deltaTime;

        // 플레이어 위치 따라가기 (회전 중심)
        this.x = playerX;
        this.y = playerY;

        if (this.timer >= this.lifetime) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y); // 플레이어 위치로 이동

        // 진행률 (0 ~ 1)
        const progress = this.timer / this.lifetime;

        // 부채꼴 베기 애니메이션
        // 시작 각도: 기준 각도 - 60도
        // 끝 각도: 기준 각도 + 60도
        // 총 120도 회전
        const swingRange = Math.PI * 2 / 3; // 120도
        const startAngle = -swingRange / 2;

        // 진행률에 따른 현재 각도 (오른쪽에서 왼쪽으로 베기 위해 역방향 진행)
        // progress 0 -> startAngle + swingRange (오른쪽 끝)
        // progress 1 -> startAngle (왼쪽 끝)
        const currentSwing = startAngle + swingRange * (1 - progress);

        const totalRotation = this.baseRotation + currentSwing;

        ctx.rotate(totalRotation);

        // 검 그리기
        // 검을 플레이어로부터 reach만큼 떨어진 곳에 그림
        // 검 이미지가 위쪽을 향한다고 가정하고 회전 보정
        ctx.translate(this.reach, 0);
        ctx.rotate(Math.PI / 4); // 검 이미지 각도 보정 (45도)

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
        // ctx.arc(this.x, this.y, this.reach + this.width/2, this.baseRotation - swingRange/2, this.baseRotation + swingRange/2);
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
        // reach + 검 크기의 절반 정도를 사거리로 봄
        if (distance > this.reach + this.width / 2 + enemy.width / 2) {
            return false;
        }

        // 2. 각도 체크 (전방 120도 내에 있는지)
        let angle = Math.atan2(dy, dx);

        // 각도 정규화 (-PI ~ PI)
        let angleDiff = angle - this.baseRotation;

        // -PI ~ PI 사이로 보정
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // 전방 120도 (좌우 60도) 체크
        const swingRange = Math.PI * 2 / 3; // 120도
        if (Math.abs(angleDiff) <= swingRange / 2) {
            return true;
        }

        return false;
    }
}
