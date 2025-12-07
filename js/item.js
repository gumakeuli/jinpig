// 아이템 클래스
class Item {
    constructor(x, y, type, imagePath = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 80;
        this.height = 80;
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
            // this.itemImage.crossOrigin = 'anonymous'; // 로컬 파일에서는 제거
            console.log(`아이템 이미지 로드 시도: ${imagePath}`);
            this.itemImage.src = imagePath;
            this.itemImage.onload = () => {
                console.log(`아이템 이미지 로드 성공: ${imagePath}`);
                // 크로마키 처리 (초록색 제거) - 이미지 전처리로 대체됨
                // this.applyChromaKey();
                this.itemLoaded = true;
            };
            this.itemImage.onerror = () => {
                console.error(`아이템 이미지 로드 실패: ${imagePath}`);
                this.itemLoaded = false;
            };
        }

        // 떠다니는 애니메이션
        this.floatTimer = Math.random() * Math.PI * 2;
        this.floatSpeed = 2;
        this.floatRange = 12; // 위아래로 12픽셀

        this.price = 0; // 아이템 가격 (0이면 무료)

        // 별의 소리 이미지 (가격 표시용)
        this.starImage = new Image();
        this.starImage.src = 'assets/images/8.webp';

        // 타입별 설정
        this.setupType();
    }

    setupType() {
        switch (this.type) {
            case 'potion':
                this.name = '회복 포션';
                this.description = '체력을 1 회복합니다.';
                this.color = '#ff0000';
                this.price = 7;
                this.effect = (player) => {
                    player.heal(1);
                };
                break;
            case 'lilith_body':
                this.name = '릴리바이스의 바디';
                this.description = '갓데스 스쿼드를 위해서';
                this.color = '#ff00ff';
                this.effect = (player) => {
                    // 최대 체력 증가 (상한선 적용)
                    if (player.maxHealth < player.maxHealthCap) {
                        player.maxHealth += 1;
                        player.health += 1; // 늘어난 만큼 회복
                    }
                    // 공격력 증가
                    if (player.damage < player.damageCap) {
                        player.damage += 1;
                    }
                    // 공격속도 증가
                    if (player.attackSpeed < player.attackSpeedCap) {
                        player.attackSpeed += 1;
                        player.updateFireRate(); // 공격속도 변경 반영
                    }
                    // 행운 증가
                    if (player.luck < player.luckCap) {
                        player.luck += 1;
                    }
                };
                break;
            case 'mystery_item':
                this.name = '플뢰르 드 리스의 검';
                this.description = '속박을 끊고 피어난 진정한 용기';
                this.color = '#00ffff';
                this.effect = (player) => {
                    player.addItemToSlot('slash', this.itemImage);
                    console.log('플뢰르 드 리스의 검(베기) 장착!');
                };
                break;
            case 'soda_komibol':
                this.name = '소다맛 꼬미볼';
                this.description = '소다맛이 난다';
                this.color = '#00ffff'; // 소다색 (Cyan)
                this.effect = (player) => {
                    player.hasSodaKomibol = true;
                    console.log('소다맛 꼬미볼 획득!');
                };
                break;
            case 'montelli_gun':
                this.name = '몬텔리의 총';
                this.description = '전용무기인 것 같다';
                this.color = '#ccffff'; // 오팔색
                this.effect = (player) => {
                    player.hasMontelliGun = true;
                    // 공격력 1 증가 (상한선 체크)
                    if (player.damage < player.damageCap) {
                        player.damage += 1;
                    }
                    console.log('몬텔리의 총 획득!');
                };
                break;
            case 'murasama':
                this.name = '무라사마';
                this.description = ''; // 설명 없음
                this.color = '#ff0000'; // 빨간색
                this.effect = (player) => {
                    player.addItemToSlot('murasama', this.itemImage);
                    console.log('무라사마 획득!');
                };
                break;
            case 'fire_sword':
                this.name = '화염 검';
                this.description = '공격력 +2, 적에게 화상 효과';
                this.color = '#FF4500';
                this.price = 15;
                this.effect = (player) => {
                    if (player.damage < player.damageCap) {
                        player.damage += 2;
                    }
                    player.hasFireSword = true;
                };
                break;
            case 'ice_spear':
                this.name = '얼음 창';
                this.description = '적을 느리게 만듦';
                this.color = '#00BFFF';
                this.price = 12;
                this.effect = (player) => {
                    player.hasIceSpear = true;
                };
                break;
            case 'lightning_arrow':
                this.name = '번개 화살';
                this.description = '관통 공격 가능';
                this.color = '#FFD700';
                this.price = 18;
                this.effect = (player) => {
                    player.hasLightningArrow = true;
                };
                break;
            case 'poison_dagger':
                this.name = '독 단검';
                this.description = '지속 독 데미지';
                this.color = '#9400D3';
                this.price = 14;
                this.effect = (player) => {
                    player.hasPoisonDagger = true;
                };
                break;
            case 'iron_shield':
                this.name = '철갑 방패';
                this.description = '최대 체력 +2';
                this.color = '#C0C0C0';
                this.price = 20;
                this.effect = (player) => {
                    if (player.maxHealth < player.maxHealthCap) {
                        player.maxHealth += 2;
                        player.health += 2;
                    }
                };
                break;
            case 'dodge_cloak':
                this.name = '회피 망토';
                this.description = '이동속도 +30%';
                this.color = '#4B0082';
                this.price = 16;
                this.effect = (player) => {
                    player.speed *= 1.3;
                };
                break;
            case 'thorn_armor':
                this.name = '가시 갑옷';
                this.description = '피격 시 반사 데미지';
                this.color = '#8B4513';
                this.price = 18;
                this.effect = (player) => {
                    player.hasThornArmor = true;
                };
                break;
            case 'regen_ring':
                this.name = '재생 반지';
                this.description = '5초마다 체력 1 회복';
                this.color = '#32CD32';
                this.price = 22;
                this.effect = (player) => {
                    player.hasRegenRing = true;
                };
                break;
            case 'vampire_necklace':
                this.name = '흡혈 목걸이';
                this.description = '공격 시 체력 회복';
                this.color = '#DC143C';
                this.price = 25;
                this.effect = (player) => {
                    player.hasVampireNecklace = true;
                };
                break;
            case 'double_shot':
                this.name = '이중 사격';
                this.description = '발사체 2개 발사';
                this.color = '#FF6347';
                this.price = 20;
                this.effect = (player) => {
                    player.hasDoubleShot = true;
                };
                break;
            case 'explosive_bullets':
                this.name = '폭발 탄환';
                this.description = '착탄 시 범위 데미지';
                this.color = '#FF8C00';
                this.price = 24;
                this.effect = (player) => {
                    player.hasExplosiveBullets = true;
                };
                break;
            case 'time_warp':
                this.name = '시간 왜곡';
                this.description = '공격속도 +2';
                this.color = '#9370DB';
                this.price = 18;
                this.effect = (player) => {
                    if (player.attackSpeed < player.attackSpeedCap) {
                        player.attackSpeed += 2;
                        player.updateFireRate();
                    }
                };
                break;
            default:
                this.name = '알 수 없는 아이템';
                this.description = '효과 없음';
                this.color = '#ffffff';
                this.effect = (player) => { };
                break;
        }
    }

    applyChromaKey() {
        if (!this.itemImage) return;

        const canvas = document.createElement('canvas');
        canvas.width = this.itemImage.width;
        canvas.height = this.itemImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.itemImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 초록색 배경 제거 (RGB: 0, 255, 0 근처)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 초록색이 강하고 빨강/파랑이 약하면 투명하게
            if (g > 100 && r < 100 && b < 100) {
                data[i + 3] = 0; // Alpha to 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.processedItemCanvas = canvas;
    }

    // 업데이트
    update(deltaTime) {
        // 떠다니는 애니메이션 타이머 업데이트
        this.floatTimer += deltaTime * this.floatSpeed;
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
            // 크로마키 처리된 이미지가 있으면 사용, 없으면 원본 사용
            const imageSource = this.processedItemCanvas || this.itemImage;

            // 아이템 이미지 그리기 (떠다니는 효과)
            ctx.drawImage(
                imageSource,
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

        // 가격 표시 (상점 아이템인 경우)
        if (this.price > 0) {
            ctx.save();
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            const text = (this.hideNameInShop && this.price > 0) ? `??? - ${this.price}` : `${this.name} - ${this.price}`;
            const textX = this.x;
            const textY = this.y - this.height / 2 + floatY - 30; // 아이템 위쪽

            // 텍스트 외곽선 (가독성)
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';
            ctx.strokeText(text, textX - 15, textY); // 별 이미지 공간 확보를 위해 약간 왼쪽으로

            // 텍스트 채우기
            ctx.fillStyle = 'white';
            ctx.fillText(text, textX - 15, textY);

            // 별 이미지 그리기
            if (this.starImage.complete) {
                const starSize = 24;
                // 텍스트 너비 측정해서 별 위치 조정하면 좋겠지만 간단하게 고정 오프셋 사용
                // 텍스트 끝부분 쯤에 별 그리기
                const textMetrics = ctx.measureText(text);
                const starX = textX - 15 + textMetrics.width / 2 + 5;
                const starY = textY - starSize + 4;

                ctx.drawImage(this.starImage, starX, starY, starSize, starSize);
            }

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
