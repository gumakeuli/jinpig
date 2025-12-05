// UI 클래스 - HUD 표시
class UI {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // 하트 설정
        this.heartSize = 24;
        this.heartSpacing = 8;
        this.heartPadding = 16;

        // 별의 소리 이미지 로드
        this.starImage = new Image();
        this.starImage.src = 'assets/images/8.webp';
        this.starImageSize = 28;
    }

    // HUD 그리기
    draw(ctx, player, starCount, boss = null) {
        if (!player) return;

        // 체력 하트 그리기 (안전장치 추가)
        const health = typeof player.health === 'number' ? player.health : 0;
        const maxHealth = typeof player.maxHealth === 'number' ? player.maxHealth : 3;
        this.drawHearts(ctx, health, maxHealth);

        // 별의 소리 개수 표시
        this.drawStarCount(ctx, starCount || 0);

        // 아이템 슬롯 표시
        this.drawItemSlots(ctx, player);

        // 조작법 힌트 (게임 하단)
        this.drawControls(ctx);

        // 보스 체력바
        if (boss && typeof boss.health === 'number' && typeof boss.maxHealth === 'number') {
            this.drawBossHealthBar(ctx, boss);
        }
    }

    // 보스 체력바
    drawBossHealthBar(ctx, boss) {
        const barWidth = this.canvasWidth * 0.6;
        const barHeight = 20;
        const x = (this.canvasWidth - barWidth) / 2;
        const y = this.canvasHeight - 50;

        // 배경 (검은색)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

        // 체력 (보라색)
        const healthPercent = Math.max(0, boss.health / boss.maxHealth);
        ctx.fillStyle = '#800080';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // 테두리 (흰색)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

        // 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.canvasWidth / 2, y - 10);
        ctx.textAlign = 'left';
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

    // 별의 소리 개수 표시
    drawStarCount(ctx, starCount) {
        const x = this.heartPadding;
        const y = this.heartPadding + 40; // 하트 아래

        // 별의 소리 이미지
        if (this.starImage.complete) {
            ctx.drawImage(
                this.starImage,
                x,
                y - this.starImageSize / 2,
                this.starImageSize,
                this.starImageSize
            );
        } else {
            // 로딩 중엔 이모지
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('⭐', x, y);
        }

        // 개수 표시
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${starCount}`, x + this.starImageSize + 8, y);
    }

    // 점수 표시
    drawScore(ctx, score) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`점수: ${score}`, this.canvasWidth - this.heartPadding, this.heartPadding + 20);
        ctx.textAlign = 'left';
    }

    // 아이템 슬롯 표시
    drawItemSlots(ctx, player) {
        const slotSize = 50;
        const slotSpacing = 10;
        const startX = this.canvasWidth / 2 - (slotSize + slotSpacing / 2);
        const startY = this.canvasHeight - 80;

        for (let i = 0; i < 2; i++) {
            const x = startX + i * (slotSize + slotSpacing);
            const y = startY;

            // 슬롯 배경 (현재 선택된 슬롯은 강조)
            if (i === player.currentSlot) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // 노란색 강조
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
            }

            ctx.fillRect(x, y, slotSize, slotSize);
            ctx.strokeRect(x, y, slotSize, slotSize);

            // 슬롯 번호
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${i + 1}`, x + 4, y + 14);

            // 아이템 표시
            const itemSlot = player.itemSlots[i];
            if (itemSlot) {
                // 아이템 이미지 표시
                if (itemSlot.image && itemSlot.image.complete) {
                    const imgSize = 40;
                    ctx.drawImage(
                        itemSlot.image,
                        x + (slotSize - imgSize) / 2,
                        y + (slotSize - imgSize) / 2,
                        imgSize,
                        imgSize
                    );
                } else {
                    // 이미지 없으면 텍스트로 표시
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ffffff';
                    let itemName = itemSlot.type === 'slash' ? '검' : itemSlot.type === 'murasama' ? '무' : '?';
                    ctx.fillText(itemName, x + slotSize / 2, y + slotSize / 2 + 5);
                }
            }
        }

        // Tab 키 힌트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tab: 슬롯 전환 | Space: 사용', this.canvasWidth / 2, startY - 8);
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

    // 보스 인트로 화면
    drawBossIntro(ctx, bossIntro) {
        if (!bossIntro.active || !bossIntro.boss) return;

        const progress = bossIntro.timer / bossIntro.duration;

        // 페이드 인/아웃 효과
        let alpha;
        if (progress < 0.2) {
            // 페이드 인 (0 ~ 0.2)
            alpha = progress / 0.2;
        } else if (progress > 0.8) {
            // 페이드 아웃 (0.8 ~ 1.0)
            alpha = (1 - progress) / 0.2;
        } else {
            // 완전히 표시 (0.2 ~ 0.8)
            alpha = 1.0;
        }

        // 반투명 검은색 배경
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.save();
        ctx.globalAlpha = alpha;

        // 보스 이미지 (중앙 상단)
        if (bossIntro.boss.imageIdle && bossIntro.boss.imageIdle.complete) {
            const imgSize = 200;
            const imgX = (this.canvasWidth - imgSize) / 2;
            const imgY = this.canvasHeight / 3 - imgSize / 2;

            // 이미지 테두리
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.strokeRect(imgX - 4, imgY - 4, imgSize + 8, imgSize + 8);

            // 보스 이미지
            ctx.drawImage(bossIntro.boss.imageIdle, imgX, imgY, imgSize, imgSize);
        }

        // 보스 이름
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const nameY = this.canvasHeight * 0.65;
        ctx.strokeText(bossIntro.boss.bossName, this.canvasWidth / 2, nameY);
        ctx.fillText(bossIntro.boss.bossName, this.canvasWidth / 2, nameY);

        ctx.restore();
    }
}
