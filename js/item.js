// 아이템 클래스
class Item {
    constructor(x, y, type, imagePath = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 48;
        this.height = 48;
        this.active = true;

        // 받침대 이미지 (11번)
        this.pedestalImage = new Image();
        this.pedestalImage.src = 'assets/images/11.webp';
        this.pedestalLoaded = false;
        this.pedestalImage.onload = () => {
            this.pedestalLoaded = true;
        };

        // 아이템 이미지
        this.itemImage = null;
        this.itemLoaded = false;
        this.processedItemCanvas = null; // 크로마키 처리된 이미지를 저장할 캔버스

        if (imagePath) {
            this.itemImage = new Image();
            this.itemImage.src = imagePath;
            this.itemImage.onload = () => {
                // 크로마키 처리 (초록색 제거)
                this.applyChromaKey();
                this.itemLoaded = true;
            };
        }

        // 떠다니는 애니메이션
        this.floatTimer = Math.random() * Math.PI * 2;
        this.floatSpeed = 2;
        this.floatRange = 12; // 위아래로 12픽셀

        // 타입별 설정
        this.setupType();
    }

    setupType() {
        switch(this.type) {
            case 'lilith_body':
                this.name = '릴리스의 바디';
                this.description = '갓데스 스쿼드를 위하여';
                this.color = '#ff0066';
                this.effect = (player) => {
                    // 체력 +1
                    player.maxHealth = Math.min(player.maxHealth + 1, player.maxHealthCap);
                    player.health = Math.min(player.health + 1, player.maxHealth);

                    // 공격력 +1
                    player.damage = Math.min(player.damage + 1, player.damageCap);

                    // 공격속도 +1
                    player.attackSpeed = Math.min(player.attackSpeed + 1, player.attackSpeedCap);
                    player.updateFireRate();
                };
                break;

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

    // 크로마키 처리 (초록색 제거)
    applyChromaKey() {
        if (!this.itemImage) return;

        // 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = this.itemImage.width;
        tempCanvas.height = this.itemImage.height;

        // 이미지를 캔버스에 그리기
        tempCtx.drawImage(this.itemImage, 0, 0);

        // 픽셀 데이터 가져오기
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // 초록색 픽셀을 투명하게 만들기
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 초록색 감지 (G값이 R과 B보다 충분히 높은 경우)
            // 임계값: G > 100 && G > R + 50 && G > B + 50
            if (g > 100 && g > r + 50 && g > b + 50) {
                data[i + 3] = 0; // 알파값을 0으로 (투명)
            }
        }

        // 수정된 픽셀 데이터를 다시 캔버스에 적용
        tempCtx.putImageData(imageData, 0, 0);

        // 처리된 캔버스 저장
        this.processedItemCanvas = tempCanvas;
    }

    // 업데이트
    update(deltaTime) {
        // 떠다니는 효과
        this.floatTimer += this.floatSpeed * deltaTime;
    }

    // 그리기
    draw(ctx) {
        const floatY = Math.sin(this.floatTimer) * this.floatRange;

        // 받침대 그리기 (11번 이미지)
        if (this.pedestalLoaded) {
            const pedestalWidth = 64;
            const pedestalHeight = 64;
            ctx.drawImage(
                this.pedestalImage,
                this.x - pedestalWidth / 2,
                this.y - pedestalHeight / 2 + 10, // 약간 아래에 배치
                pedestalWidth,
                pedestalHeight
            );
        } else {
            // 로딩 중이면 회색 받침대
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.x - 24, this.y - 12, 48, 24);
        }

        // 아이템 이미지가 있으면 이미지로, 없으면 기본 다이아몬드
        if (this.itemImage && this.itemLoaded) {
            // 아이템 이미지 그리기 (떠다니는 효과)
            ctx.drawImage(
                this.itemImage,
                this.x - this.width / 2,
                this.y - this.height / 2 + floatY - 20, // 받침대 위에 떠있게
                this.width,
                this.height
            );

            // 은은한 글로우 효과
            const glowIntensity = (Math.sin(this.floatTimer * 2) + 1) / 2;
            ctx.save();
            ctx.globalAlpha = glowIntensity * 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y + floatY - 20, this.width / 2 + 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // 기본 다이아몬드 형태 (이미지 없을 때)
            ctx.save();
            ctx.translate(this.x, this.y + floatY - 20);

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

            ctx.restore();
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

    // 아이템 효과 적용
    apply(player) {
        this.effect(player);
        this.active = false;
    }
}
