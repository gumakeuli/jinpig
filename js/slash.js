class Slash {
    constructor(x, y, angle, damage, imagePath = 'assets/images/items/3.png') {
        this.x = x; // 플레이어 위치 (회전 중심)
        this.y = y;
        this.angle = angle; // 라디안 각도
        this.damage = damage;
        this.active = true;

        this.lifetime = 1.0; // 1.0초 지속 (후딜레이 증가)
        this.timer = 0;

        this.width = 100; // 검 길이
        this.height = 100; // 검 너비 (이미지 기준)

        // 찌르기 애니메이션 변수
        this.maxReach = 150; // 최대 찌르기 거리 (사거리 증가)
        this.currentReach = 0; // 현재 찌르기 거리

        // 이미지 로드
        this.image = new Image();
        this.image.src = imagePath;

        this.hitEnemies = []; // 이미 타격한 적 목록
    }

    update(deltaTime, playerX, playerY) {
        this.timer += deltaTime;

        // 플레이어 위치 따라가기 (회전 중심)
        this.x = playerX;
        this.y = playerY;

        // 찌르기 애니메이션 (갔다가 돌아오기)
        // 0 ~ 0.2 (20%): 찌르기 (빠르게)
        // 0.2 ~ 1.0 (80%): 회수 (느리게)
        const progress = this.timer / this.lifetime;
        const thrustRatio = 0.2;

        if (progress < thrustRatio) {
            // 찌르기 단계 (Ease-out)
            const t = progress / thrustRatio; // 0 ~ 1
            this.currentReach = this.maxReach * Math.sin(t * Math.PI / 2);
        } else {
            // 회수 단계 (Ease-in)
            const t = (progress - thrustRatio) / (1 - thrustRatio); // 0 ~ 1
            this.currentReach = this.maxReach * (1 - Math.sin(t * Math.PI / 2));
        }

        if (this.timer >= this.lifetime) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y); // 플레이어 위치로 이동
        ctx.rotate(this.angle); // 마우스 방향으로 회전

        // 찌르기 거리만큼 이동
        ctx.translate(this.currentReach, 0);

        // 검 이미지 회전 (검 끝이 오른쪽을 향하도록 -90도 보정)
        // 현재 반대 방향이라고 하므로 180도 회전
        ctx.rotate(-Math.PI / 2);

        ctx.drawImage(
            this.image,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        ctx.restore();

        // 디버그용 히트박스 (회전된 사각형)
        // this.drawDebugHitbox(ctx);
    }

    drawDebugHitbox(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 찌르는 선상의 사각형
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        // 검의 실제 타격 범위 (검 길이의 절반 정도 너비, 현재 리치만큼 길이)
        const hitWidth = 40;
        const hitLength = this.currentReach + 40; // 검 끝부분까지
        ctx.fillRect(0, -hitWidth / 2, hitLength, hitWidth);

        ctx.restore();
    }

    // 충돌 체크 (회전된 사각형)
    checkCollision(enemy) {
        if (!this.active) return false;

        // 적 중심을 로컬 좌표계(플레이어 기준, 각도 회전 역변환)로 변환하여 AABB 체크
        // 1. 플레이어 기준 상대 좌표
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;

        // 2. 회전 역변환 (공격 방향을 X축으로 정렬)
        // x' = x * cos(-angle) - y * sin(-angle)
        // y' = x * sin(-angle) + y * cos(-angle)
        const cos = Math.cos(-this.angle);
        const sin = Math.sin(-this.angle);

        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // 3. 타격 범위 (로컬 좌표계 기준 AABB)
        // X축: 0 ~ currentReach + 검 크기 일부
        // Y축: -검 너비/2 ~ +검 너비/2
        const hitLength = this.currentReach + 40; // 검 끝부분
        const hitWidth = 40; // 타격 너비

        // 적의 반지름 (대략적으로)
        const enemyRadius = enemy.width / 2;

        // 사각형 vs 원 충돌 체크 (간소화: 사각형 vs 점 + 반지름)
        // 가장 가까운 점 찾기
        const closestX = Math.max(0, Math.min(localX, hitLength));
        const closestY = Math.max(-hitWidth / 2, Math.min(localY, hitWidth / 2));

        // 거리 계산
        const distanceX = localX - closestX;
        const distanceY = localY - closestY;

        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        return distanceSquared < (enemyRadius * enemyRadius);
    }
}
