// 아이템 클래스
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 28;
        this.height = 28;
        this.active = true;

        // 떠다니는 애니메이션
        this.floatOffset = 0;
        this.floatSpeed = 2;

        // 타입별 설정
        this.setupType();
    }

    setupType() {
        switch(this.type) {
            case 'health':
                this.name = '체력 증가';
                this.description = '최대 체력 +2';
                this.color = '#ff0066';
                this.effect = (player) => {
                    player.maxHealth += 2;
                    player.health = Math.min(player.health + 2, player.maxHealth);
                };
                break;

            case 'speed':
                this.name = '이동 속도 증가';
                this.description = '이동 속도 +30';
                this.color = '#00ffff';
                this.effect = (player) => {
                    player.speed += 30;
                };
                break;

            case 'damage':
                this.name = '공격력 증가';
                this.description = '공격력 +1';
                this.color = '#ffff00';
                this.effect = (player) => {
                    player.damage += 1;
                };
                break;

            case 'firerate':
                this.name = '연사력 증가';
                this.description = '발사 속도 증가';
                this.color = '#ff9900';
                this.effect = (player) => {
                    player.fireRate = Math.max(50, player.fireRate - 50);
                };
                break;

            case 'heal':
                this.name = '체력 회복';
                this.description = '체력 +1 회복';
                this.color = '#00ff00';
                this.effect = (player) => {
                    player.health = Math.min(player.health + 1, player.maxHealth);
                };
                break;
        }
    }

    // 업데이트
    update(deltaTime) {
        // 떠다니는 효과
        this.floatOffset += this.floatSpeed * deltaTime;
    }

    // 그리기
    draw(ctx) {
        const floatY = Math.sin(this.floatOffset) * 8;

        // 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            this.x,
            this.y + 12,
            this.width / 2 - 4,
            this.height / 4,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // 아이템 본체 (다이아몬드 형태)
        ctx.save();
        ctx.translate(this.x, this.y + floatY);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        // 테두리
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 중앙 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 3);
        ctx.lineTo(this.width / 3, 0);
        ctx.lineTo(0, this.height / 6);
        ctx.lineTo(-this.width / 4, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // 반짝이는 효과
        const glowIntensity = (Math.sin(this.floatOffset * 2) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y + floatY, this.width / 3, 0, Math.PI * 2);
        ctx.fill();
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

    // 아이템 효과 적용
    apply(player) {
        this.effect(player);
        this.active = false;
    }
}
