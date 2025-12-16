// 독 장판 클래스
class PoisonZone {
    constructor(x, y, color = '#00ff00', damage = 1, duration = 3.0) {
        this.x = x;
        this.y = y;
        this.radius = 60; // 장판 반경
        this.duration = duration; // 지속 시간
        this.timer = 0;
        this.damage = damage; // 초당 데미지
        this.damageTimer = 0;
        this.damageInterval = 1.0; // 1초마다 데미지
        this.active = true;
        this.color = color; // 장판 색상

        // 시각 효과
        this.opacity = 0;
        this.fadeInDuration = 0.3; // 0.3초 페이드인
        this.pulseTimer = 0;
    }

    update(deltaTime) {
        this.timer += deltaTime;
        this.damageTimer += deltaTime;
        this.pulseTimer += deltaTime;

        // 페이드인 효과
        if (this.timer < this.fadeInDuration) {
            this.opacity = this.timer / this.fadeInDuration;
        } else {
            this.opacity = 1.0;
        }

        // 지속시간 종료
        if (this.timer >= this.duration) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();

        // 펄스 효과
        const pulse = Math.sin(this.pulseTimer * 3) * 0.2 + 0.8;
        const currentRadius = this.radius * pulse;

        // 외곽 원 (진한 색)
        ctx.globalAlpha = this.opacity * 0.4;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // 내부 원 (연한 색 - 흰색 혼합 느낌)
        ctx.globalAlpha = this.opacity * 0.2;
        ctx.fillStyle = '#ffffff'; // 내부를 밝게 처리
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 테두리
        ctx.globalAlpha = this.opacity * 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    checkPlayerCollision(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.radius;
    }

    shouldDamage() {
        if (this.damageTimer >= this.damageInterval) {
            this.damageTimer = 0;
            return true;
        }
        return false;
    }
}
