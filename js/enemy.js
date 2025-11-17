// 적 클래스
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 48;

        this.type = type;

        // 적 이미지 로드
        this.imageIdle = new Image();
        this.imageIdle.src = 'assets/images/4.jpg';
        this.imageHit = new Image();
        this.imageHit.src = 'assets/images/5.png';

        this.imageLoaded = false;
        this.currentImage = this.imageIdle;

        this.imageIdle.onload = () => {
            this.imageLoaded = true;
        };

        // 피격 상태
        this.isHit = false;
        this.hitAnimTime = 0;
        this.hitAnimDuration = 0.5; // 0.5초

        // 타입별 스탯 설정
        switch(type) {
            case 'basic':
                this.speed = 80;
                this.maxHealth = 3;
                this.damage = 1;
                this.color = '#ff0000';
                break;
            case 'fast':
                this.speed = 150;
                this.maxHealth = 2;
                this.damage = 1;
                this.color = '#ff6600';
                break;
            case 'tank':
                this.speed = 50;
                this.maxHealth = 8;
                this.damage = 2;
                this.color = '#cc0000';
                break;
        }

        this.health = this.maxHealth;

        // AI 상태
        this.target = null;
        this.active = true;

        // 피격 효과
        this.hitFlash = 0;
    }

    // 타겟 설정
    setTarget(target) {
        this.target = target;
    }

    // 업데이트
    update(deltaTime) {
        if (!this.target || !this.active) return;

        // 플레이어를 향해 이동
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // 정규화된 방향
            const dirX = dx / distance;
            const dirY = dy / distance;

            // 이동
            this.x += dirX * this.speed * deltaTime;
            this.y += dirY * this.speed * deltaTime;
        }

        // 피격 효과 감소
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 10;
        }

        // 피격 애니메이션 업데이트
        if (this.isHit) {
            this.hitAnimTime += deltaTime;
            if (this.hitAnimTime >= this.hitAnimDuration) {
                this.isHit = false;
                this.hitAnimTime = 0;
                this.currentImage = this.imageIdle;
            }
        }
    }

    // 그리기
    draw(ctx) {
        // 이미지가 로드되었으면 이미지로, 아니면 사각형으로
        if (this.imageLoaded) {
            ctx.drawImage(
                this.currentImage,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        } else {
            // 로딩 중에는 빨간 사각형
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }

        // 체력바
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 8;

            // 배경 (빨간색)
            ctx.fillStyle = '#660000';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 현재 체력 (녹색)
            ctx.fillStyle = '#00ff00';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }

    // 데미지 받기
    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 1;

        // 피격 애니메이션 시작
        this.isHit = true;
        this.hitAnimTime = 0;
        this.currentImage = this.imageHit;

        if (this.health <= 0) {
            this.active = false;
            return true; // 죽음
        }
        return false;
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
}
