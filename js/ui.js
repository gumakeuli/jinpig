// UI 클래스 - HUD 표시
class UI {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // 하트 설정
        this.heartSize = 24;
        this.heartSpacing = 8;
        this.heartPadding = 16;
    }

    // HUD 그리기
    draw(ctx, player, score) {
        if (!player) return;

        // 체력 하트 그리기
        this.drawHearts(ctx, player.health, player.maxHealth);

        // 조작법 힌트 (게임 하단)
        this.drawControls(ctx);
    }

    // 하트 그리기
    drawHearts(ctx, health, maxHealth) {
        const x = this.heartPadding;
        const y = this.heartPadding;

        for (let i = 0; i < maxHealth; i++) {
            const heartX = x + i * (this.heartSize + this.heartSpacing);
            const heartY = y;

            // 체력에 따라 채워진/빈 하트
            if (i < health) {
                this.drawFilledHeart(ctx, heartX, heartY);
            } else {
                this.drawEmptyHeart(ctx, heartX, heartY);
            }
        }
    }

    // 채워진 하트
    drawFilledHeart(ctx, x, y) {
        const size = this.heartSize;
        const halfSize = size / 2;

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();

        // 왼쪽 원
        ctx.arc(x + halfSize / 2, y + halfSize / 2, halfSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // 오른쪽 원
        ctx.beginPath();
        ctx.arc(x + halfSize + halfSize / 2, y + halfSize / 2, halfSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // 아래 삼각형
        ctx.beginPath();
        ctx.moveTo(x, y + halfSize / 2);
        ctx.lineTo(x + halfSize, y + size);
        ctx.lineTo(x + size, y + halfSize / 2);
        ctx.closePath();
        ctx.fill();

        // 테두리
        ctx.strokeStyle = '#990000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 빈 하트
    drawEmptyHeart(ctx, x, y) {
        const size = this.heartSize;
        const halfSize = size / 2;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;

        // 왼쪽 원
        ctx.beginPath();
        ctx.arc(x + halfSize / 2, y + halfSize / 2, halfSize / 2, 0, Math.PI * 2);
        ctx.stroke();

        // 오른쪽 원
        ctx.beginPath();
        ctx.arc(x + halfSize + halfSize / 2, y + halfSize / 2, halfSize / 2, 0, Math.PI * 2);
        ctx.stroke();

        // 아래 삼각형
        ctx.beginPath();
        ctx.moveTo(x, y + halfSize / 2);
        ctx.lineTo(x + halfSize, y + size);
        ctx.lineTo(x + size, y + halfSize / 2);
        ctx.closePath();
        ctx.stroke();
    }

    // 점수 표시
    drawScore(ctx, score) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`점수: ${score}`, this.canvasWidth - this.heartPadding, this.heartPadding + 20);
        ctx.textAlign = 'left';
    }

    // 조작법 표시
    drawControls(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WASD: 이동 | 방향키: 발사', this.canvasWidth / 2, this.canvasHeight - 16);
        ctx.textAlign = 'left';
    }

    // 게임오버 화면
    drawGameOver(ctx, score) {
        // 반투명 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 게임오버 텍스트
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvasWidth / 2, this.canvasHeight / 2 - 40);

        // 최종 점수
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`최종 점수: ${score}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);

        // 재시작 안내
        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('잠시 후 게임 시작 버튼이 나타납니다', this.canvasWidth / 2, this.canvasHeight / 2 + 80);

        ctx.textAlign = 'left';
    }
}
