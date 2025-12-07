// 장애물 클래스
class Obstacle {
    constructor(x, y, type = 'rock') {
        this.x = x;
        this.y = y;
        this.type = type; // 'rock', 'pit', 'cobweb', 'spike'
        this.width = 64; // 48 -> 64로 증가
        this.height = 64; // 48 -> 64로 증가
        this.active = true;

        // 타입별 속성 설정
        switch (type) {
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

        switch (this.type) {
            case 'rock':
                // 바위 그리기 (더 큰 크기, 더 디테일한 그래픽)
                // 베이스
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(x, y, this.width, this.height);

                // 입체감을 위한 그라데이션 효과
                ctx.fillStyle = '#666666';
                ctx.fillRect(x + 4, y + 4, this.width - 8, this.height - 8);

                // 하이라이트 (더 크게)
                ctx.fillStyle = '#888888';
                ctx.fillRect(x + 8, y + 8, 24, 24);

                // 중간 톤
                ctx.fillStyle = '#555555';
                ctx.fillRect(x + this.width - 28, y + this.height - 28, 20, 20);

                // 균열 효과
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 10, y + 5);
                ctx.lineTo(x + 20, y + 15);
                ctx.moveTo(x + this.width - 15, y + 10);
                ctx.lineTo(x + this.width - 5, y + 20);
                ctx.stroke();

                // 테두리
                ctx.strokeStyle = '#222222';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, this.width, this.height);
                break;

            case 'pit':
                // 구멍 그리기 (더 크고 깊어 보이게)
                // 외곽 그림자
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.width / 2 + 4, this.height / 2.3 + 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // 메인 구멍
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // 내부 그라데이션 효과
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width / 2);
                gradient.addColorStop(0, '#0a0a0a');
                gradient.addColorStop(1, '#000000');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.width / 2.5, this.height / 3, 0, 0, Math.PI * 2);
                ctx.fill();

                // 테두리 (약간 밝게)
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'cobweb':
                // 거미줄 그리기 (더 크고 복잡하게)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 3;

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

                // 추가 대각선 (더 복잡한 거미줄)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + this.width / 4, y);
                ctx.lineTo(x + this.width * 3 / 4, y + this.height);
                ctx.moveTo(x + this.width * 3 / 4, y);
                ctx.lineTo(x + this.width / 4, y + this.height);
                ctx.stroke();

                // 중앙 원 (거미줄 중심)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'spike':
                // 가시 그리기 (더 크고 위협적으로)
                if (this.isUp) {
                    // 올라온 상태 (위험)
                    ctx.fillStyle = '#dd0000';
                    ctx.strokeStyle = '#880000';
                } else {
                    // 내려간 상태 (안전)
                    ctx.fillStyle = '#666666';
                    ctx.strokeStyle = '#444444';
                }

                ctx.lineWidth = 3;

                // 베이스 플레이트
                ctx.fillStyle = '#333333';
                ctx.fillRect(x, y + this.height - 8, this.width, 8);

                // 가시 삼각형들 (더 많고 날카롭게)
                const spikeCount = 5; // 4 -> 5개로 증가
                const spikeWidth = this.width / spikeCount;

                if (this.isUp) {
                    ctx.fillStyle = '#dd0000';
                    ctx.strokeStyle = '#880000';
                } else {
                    ctx.fillStyle = '#666666';
                    ctx.strokeStyle = '#444444';
                }

                for (let i = 0; i < spikeCount; i++) {
                    ctx.beginPath();
                    const sx = x + i * spikeWidth;
                    const offset = this.isUp ? 0 : 15;

                    ctx.moveTo(sx, y + this.height - offset - 8);
                    ctx.lineTo(sx + spikeWidth / 2, y + offset);
                    ctx.lineTo(sx + spikeWidth, y + this.height - offset - 8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // 경고 표시 (올라왔을 때)
                if (this.isUp) {
                    ctx.fillStyle = '#ffff00';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', this.x, y - 5);
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
        if (!this.active) return 0;

        if (this.type === 'cobweb' && this.destroyOnTouch) {
            // 거미줄 파괴
            this.active = false;
        }

        if (this.type === 'spike' && this.dealsDamage) {
            // 가시 데미지 (항상 적용, 애니메이션 상태와 무관)
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
