// 장애물 클래스
class Obstacle {
    constructor(x, y, type = 'rock') {
        this.x = x;
        this.y = y;
        this.type = type; // 'rock', 'pit', 'cobweb', 'spike'
        this.width = 48;
        this.height = 48;
        this.active = true;

        // 타입별 속성 설정
        switch(type) {
            case 'rock':
                // 바위: 이동/탄환 둘 다 막음
                this.blocksMovement = true;
                this.blocksProjectiles = true;
                this.dealsDamage = false;
                this.slowsMovement = false;
                this.color = '#666666';
                break;

            case 'pit':
                // 구멍: 이동만 막음, 탄환은 통과
                this.blocksMovement = true;
                this.blocksProjectiles = false;
                this.dealsDamage = false;
                this.slowsMovement = false;
                this.color = '#000000';
                break;

            case 'cobweb':
                // 거미줄: 이동 느려짐, 탄환 통과, 지나가면 파괴됨
                this.blocksMovement = false;
                this.blocksProjectiles = false;
                this.dealsDamage = false;
                this.slowsMovement = true;
                this.slowFactor = 0.5; // 50% 속도 감소
                this.destroyOnTouch = true;
                this.color = '#cccccc';
                break;

            case 'spike':
                // 가시: 통과 가능하지만 데미지, 탄환 통과
                this.blocksMovement = false;
                this.blocksProjectiles = false;
                this.dealsDamage = true;
                this.damage = 1;
                this.slowsMovement = false;
                this.color = '#8b0000';
                // 가시 애니메이션
                this.spikeTimer = 0;
                this.spikeInterval = 2; // 2초마다 올라옴
                this.isUp = false;
                break;
        }
    }

    update(deltaTime) {
        // 가시 애니메이션 업데이트
        if (this.type === 'spike') {
            this.spikeTimer += deltaTime;
            if (this.spikeTimer >= this.spikeInterval) {
                this.isUp = !this.isUp;
                this.spikeTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const x = this.x - this.width / 2;
        const y = this.y - this.height / 2;

        switch(this.type) {
            case 'rock':
                // 바위 그리기 (회색 돌)
                ctx.fillStyle = '#555555';
                ctx.fillRect(x, y, this.width, this.height);

                // 하이라이트
                ctx.fillStyle = '#888888';
                ctx.fillRect(x + 4, y + 4, 16, 16);

                // 테두리
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, this.width, this.height);
                break;

            case 'pit':
                // 구멍 그리기 (검은 원형)
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // 테두리 (약간 밝게)
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'cobweb':
                // 거미줄 그리기 (반투명 흰색)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 2;

                // X 패턴
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + this.width, y + this.height);
                ctx.moveTo(x + this.width, y);
                ctx.lineTo(x, y + this.height);
                ctx.stroke();

                // 중앙 십자
                ctx.beginPath();
                ctx.moveTo(this.x, y);
                ctx.lineTo(this.x, y + this.height);
                ctx.moveTo(x, this.y);
                ctx.lineTo(x + this.width, this.y);
                ctx.stroke();
                break;

            case 'spike':
                // 가시 그리기
                if (this.isUp) {
                    // 올라온 상태 (위험)
                    ctx.fillStyle = '#cc0000';
                    ctx.strokeStyle = '#660000';
                } else {
                    // 내려간 상태 (안전)
                    ctx.fillStyle = '#555555';
                    ctx.strokeStyle = '#333333';
                }

                ctx.lineWidth = 2;

                // 가시 삼각형들
                const spikeCount = 4;
                const spikeWidth = this.width / spikeCount;

                for (let i = 0; i < spikeCount; i++) {
                    ctx.beginPath();
                    const sx = x + i * spikeWidth;
                    const offset = this.isUp ? 0 : 10;

                    ctx.moveTo(sx, y + this.height - offset);
                    ctx.lineTo(sx + spikeWidth / 2, y + offset);
                    ctx.lineTo(sx + spikeWidth, y + this.height - offset);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                break;
        }
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

    // 플레이어와의 상호작용
    interactWithPlayer(player) {
        if (!this.active) return;

        if (this.type === 'cobweb' && this.destroyOnTouch) {
            // 거미줄 파괴
            this.active = false;
        }

        if (this.type === 'spike' && this.isUp && this.dealsDamage) {
            // 가시 데미지
            return this.damage;
        }

        return 0;
    }

    // 이동 속도 감소 체크
    getSpeedMultiplier() {
        if (this.type === 'cobweb' && this.slowsMovement && this.active) {
            return this.slowFactor;
        }
        return 1;
    }
}
