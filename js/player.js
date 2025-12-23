// 플레이어 클래스
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;

        // 캐릭터 이미지 로드
        this.images = {};
        this.loadedImagesCount = 0;
        this.totalImages = 0;

        const imageSources = {
            // 이동 (WASD)
            'w': 'assets/images/2.jpg',
            'a': 'assets/images/9.jpg',
            's': 'assets/images/10.jpg',
            'd': 'assets/images/11.jpg',
            // 공격 (방향키)
            'up': 'assets/images/13.png',
            'down': 'assets/images/3.png',
            'left': 'assets/images/12.png',
            'right': 'assets/images/14.png'
        };

        this.totalImages = Object.keys(imageSources).length;

        for (const key in imageSources) {
            this.images[key] = new Image();
            this.images[key].src = imageSources[key];
            this.images[key].onload = () => {
                this.loadedImagesCount++;
            };
        }

        this.currentImage = this.images['s']; // 기본 이미지 (S - 10번)

        // 발사 상태
        this.isShooting = false;
        this.shootAnimTime = 0;
        this.shootAnimDuration = 0.2; // 0.2초 동안 발사 이미지 표시
        this.shootingDirection = null; // 발사 방향
        this.lastDirection = 's'; // 마지막 바라본 방향

        // 이동 관련
        this.speed = 200; // 픽셀/초
        this.vx = 0;
        this.vy = 0;

        // 스탯
        this.health = 3;
        this.maxHealth = 3; // 최대 체력 (최대 7)
        this.damage = 1; // 공격력 (최대 5)
        this.attackSpeed = 1; // 공격속도 (최대 5)
        this.luck = 1; // 행운 (최대 5)

        // 스탯 상한선
        this.maxHealthCap = 7;
        this.damageCap = 5;
        this.attackSpeedCap = 5;
        this.luckCap = 5;

        // 입력 상태
        this.keys = {
            // 이동 (WASD)
            w: false,
            a: false,
            s: false,
            d: false,
            // 발사 (방향키)
            arrowUp: false,
            arrowDown: false,
            arrowLeft: false,
            arrowRight: false
        };

        // 발사 관련
        this.lastFireTime = 0;

        // 공격속도에 따른 발사 간격 계산
        this.updateFireRate();

        // 무적 시간
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 1000; // 1초

        // 무적 모드 (치트)
        this.godMode = false;

        // 사용 아이템 슬롯 시스템
        this.itemSlots = [null, null, null, null]; // 4개 슬롯
        this.currentSlot = 0; // 현재 선택된 슬롯 (0, 1, 2, 3)
        this.itemCooldown = 0;
        this.itemMaxCooldown = 2; // 2초 쿨다운 (후딜레이 증가)

        this.keys.space = false;
        this.keys.f = false;
        this.keys.shift = false;

        // 아이템 효과 플래그
        this.hasSodaKomibol = false;
        this.hasMontelliGun = false;
        this.hasDiscount = false; // 상점 할인 (금빛 파도의 무늬)
        this.hasMoonlight = false; // 달빛 아이템
        this.moonShield = false; // 보호막 활성화 여부
        this.moonShieldTimer = 0;
        this.moonShieldCooldown = 10; // 10초 쿨다운

        // 무기 아이템 효과

        this.hasIceSpear = false; // 얼음 창
        this.hasLightningArrow = false; // 번개 화살
        this.hasPoisonDagger = false; // 독 단검

        // 방어구 아이템 효과
        this.hasThornArmor = false; // 가시 갑옷

        // 패시브 아이템 효과
        this.hasRegenRing = false; // 재생 반지
        this.hasVampireNecklace = false; // 흡혈 목걸이
        this.hasDoubleShot = false; // 이중 사격
        this.hasExplosiveBullets = false; // 폭발 탄환

        // 대쉬 능력
        this.hasDash = true; // 1스테이지부터 사용 가능
        this.isDashing = false;
        this.dashDuration = 0.15; // 대쉬 지속시간 (0.15초)
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashCooldownMax = 1.0; // 1초 쿨다운
        this.dashSpeed = 400; // 대쉬 속도 (너프)
        this.dashInvincibleDuration = 0.5; // 0.5초 무적
    }

    // 입력 처리
    handleKeyDown(key) {
        switch (key) {
            // 이동 - WASD
            case 'w':
            case 'W':
                this.keys.w = true;
                break;
            case 's':
            case 'S':
                this.keys.s = true;
                break;
            case 'a':
            case 'A':
                this.keys.a = true;
                break;
            case 'd':
            case 'D':
                this.keys.d = true;
                break;
            // 발사 - 방향키
            case 'ArrowUp':
                this.keys.arrowUp = true;
                break;
            case 'ArrowDown':
                this.keys.arrowDown = true;
                break;
            case 'ArrowLeft':
                this.keys.arrowLeft = true;
                break;
            case 'ArrowRight':
                this.keys.arrowRight = true;
                break;
            // 사용 아이템 - Space
            case ' ':
            case 'Spacebar':
                this.keys.space = true;
                break;
            // 슬롯 전환 - F
            case 'f':
            case 'F':
                this.keys.f = true;


                // 슬롯 전환 (비어있지 않은 슬롯만 순환)
                const activeIndices = [];
                for (let i = 0; i < this.itemSlots.length; i++) {
                    if (this.itemSlots[i] !== null) {
                        activeIndices.push(i);
                    }
                }

                if (activeIndices.length > 0) {
                    // 현재 슬롯이 activeIndices에 있는지 확인
                    let currentIndexInActive = activeIndices.indexOf(this.currentSlot);

                    if (currentIndexInActive === -1) {
                        // 현재 슬롯이 비어있거나 목록에 없으면 첫 번째 유효 슬롯으로
                        this.currentSlot = activeIndices[0];
                    } else {
                        // 다음 유효 슬롯으로 이동
                        let nextIndex = (currentIndexInActive + 1) % activeIndices.length;
                        this.currentSlot = activeIndices[nextIndex];
                    }
                    console.log(`슬롯 전환: ${this.currentSlot}`);
                } else {
                    console.log('사용 가능한 아이템이 없습니다.');
                }
                break;
            // 대쉬 - Shift
            case 'Shift':
                this.keys.shift = true;
                break;
        }
    }

    handleKeyUp(key) {
        switch (key) {
            // 이동 - WASD
            case 'w':
            case 'W':
                this.keys.w = false;
                break;
            case 's':
            case 'S':
                this.keys.s = false;
                break;
            case 'a':
            case 'A':
                this.keys.a = false;
                break;
            case 'd':
            case 'D':
                this.keys.d = false;
                break;
            // 발사 - 방향키
            case 'ArrowUp':
                this.keys.arrowUp = false;
                break;
            case 'ArrowDown':
                this.keys.arrowDown = false;
                break;
            case 'ArrowLeft':
                this.keys.arrowLeft = false;
                break;
            case 'ArrowRight':
                this.keys.arrowRight = false;
                break;
            // 사용 아이템 - Space
            case ' ':
            case 'Spacebar':
                this.keys.space = false;
                break;
            // 슬롯 전환 - F
            case 'f':
            case 'F':
                this.keys.f = false;
                break;
            // 대쉬 - Shift
            case 'Shift':
                this.keys.shift = false;
                break;
        }
    }

    // 업데이트
    update(deltaTime, canvasWidth, canvasHeight) {
        // 이동 방향 계산 (WASD)
        let dx = 0;
        let dy = 0;

        if (this.keys.w) dy -= 1;
        if (this.keys.s) dy += 1;
        if (this.keys.a) dx -= 1;
        if (this.keys.d) dx += 1;

        // 대각선 이동 시 속도 정규화
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        // 속도 적용
        this.vx = dx * this.speed;
        this.vy = dy * this.speed;

        // 위치 업데이트
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // 화면 경계 처리
        this.x = Math.max(this.width / 2, Math.min(canvasWidth - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvasHeight - this.height / 2, this.y));

        // 무적 시간 업데이트
        if (this.invincible) {
            this.invincibleTime += deltaTime * 1000;
            if (this.invincibleTime >= this.invincibleDuration) {
                this.invincible = false;
                this.invincibleTime = 0;
            }
        }

        // 달빛 보호막 재생성
        if (this.hasMoonlight && !this.moonShield) {
            this.moonShieldTimer += deltaTime;
            if (this.moonShieldTimer >= this.moonShieldCooldown) {
                this.moonShield = true;
                this.moonShieldTimer = 0;
                console.log("달빛 보호막 생성!");
            }
        }

        // 발사 애니메이션 타이머
        if (this.isShooting) {
            this.shootAnimTime += deltaTime;
            if (this.shootAnimTime >= this.shootAnimDuration) {
                this.isShooting = false;
                this.shootingDirection = null;
            }
        }

        // 이미지 업데이트 로직
        this.updateSprite();

        // 아이템 쿨다운 업데이트
        if (this.itemCooldown > 0) {
            this.itemCooldown -= deltaTime;
        }

        // 대쉬 쿨다운 업데이트
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }

        // 대쉬 처리
        if (this.isDashing) {
            this.dashTimer += deltaTime;
            if (this.dashTimer >= this.dashDuration) {
                this.isDashing = false;
                this.dashTimer = 0;
            }
        }

        // 대쉬 시작 (Shift 키)
        if (this.hasDash && this.keys.shift && !this.isDashing && this.dashCooldown <= 0) {
            this.startDash();
        }
    }

    // 스프라이트 업데이트
    updateSprite() {
        // 우선순위 1: 발사 중일 때 (startShootAnimation에 의해 설정됨)
        if (this.isShooting && this.shootingDirection) {
            this.currentImage = this.images[this.shootingDirection];
            this.lastDirection = this.shootingDirection;
            return;
        }

        // 우선순위 2: 이동 (WASD)
        if (this.keys.w) {
            this.currentImage = this.images['w'];
            this.lastDirection = 'w';
            return;
        }
        if (this.keys.s) {
            this.currentImage = this.images['s'];
            this.lastDirection = 's';
            return;
        }
        if (this.keys.a) {
            this.currentImage = this.images['a'];
            this.lastDirection = 'a';
            return;
        }
        if (this.keys.d) {
            this.currentImage = this.images['d'];
            this.lastDirection = 'd';
            return;
        }

        // 우선순위 3: 대기 (마지막 방향 유지 또는 기본값)
        if (this.lastDirection && this.images[this.lastDirection]) {
            this.currentImage = this.images[this.lastDirection];
        } else {
            this.currentImage = this.images['s']; // 기본값
        }
    }

    // 그리기
    draw(ctx) {
        // 무적 상태면 깜빡임
        if (this.invincible && Math.floor(this.invincibleTime / 100) % 2 === 0) {
            return;
        }

        // 달빛 보호막 오라 표시
        if (this.moonShield) {
            ctx.save();
            ctx.strokeStyle = '#F0F8FF'; // AliceBlue
            ctx.lineWidth = 3;
            // 부드럽게 깜빡이는 효과
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500) * 0.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 1.5 + 5, 0, Math.PI * 2); // 캐릭터보다 약간 크게
            ctx.stroke();
            // 내부 희미한 채우기
            ctx.fillStyle = 'rgba(240, 248, 255, 0.1)';
            ctx.fill();
            ctx.restore();
        }

        // 이미지가 로드되었으면 이미지로, 아니면 사각형으로
        // 이미지가 하나라도 로드되었고 현재 이미지가 유효하면 그리기
        if (this.currentImage && this.currentImage.complete && this.currentImage.naturalWidth > 0) {
            ctx.drawImage(
                this.currentImage,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        } else {
            // 로딩 중이거나 이미지 실패 시 녹색 사각형
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );

            // 디버깅용 테두리
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    }

    // 발사 애니메이션 시작
    startShootAnimation(direction) {
        this.isShooting = true;
        this.shootAnimTime = 0;
        this.shootingDirection = direction;

        // 즉시 이미지 업데이트
        this.updateSprite();
    }

    // 데미지 받기
    takeDamage(amount) {
        // 무적 모드 체크
        if (this.godMode) return false;
        if (this.invincible) return false;

        // 행운에 따른 회피 확률 체크
        const dodgeChance = this.luck; // 행운 1당 1%
        const randomValue = Math.random() * 100; // 0~100

        // 달빛 보호막 체크
        if (this.moonShield) {
            this.moonShield = false;
            this.moonShieldTimer = 0;
            // 보호막 파괴 효과 (추후 구현 가능)
            console.log("달빛 보호막이 공격을 막았습니다!");

            // 짧은 무적 시간 부여 (연속 피격 방지)
            this.invincible = true;
            this.invincibleTime = 0;
            this.invincibleDuration = 500; // 0.5초
            return false;
        }

        if (randomValue < dodgeChance) {
            // 회피 성공!
            return false;
        }

        this.health -= amount;
        this.invincible = true;
        this.invincibleTime = 0;

        return true;
    }

    // 체력 회복
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    // 공격속도에 따른 발사 간격 계산
    updateFireRate() {
        // 공격속도 1 = 0.8초 (800ms)
        // 공격속도가 1 증가할 때마다 0.05초(50ms)씩 감소
        // 공격속도 1: 800ms
        // 공격속도 2: 750ms
        // 공격속도 3: 700ms
        // 공격속도 4: 650ms
        // 공격속도 5: 600ms
        const baseFireRate = 800; // 0.8초
        const rateDecrease = 50; // 0.05초
        const calculatedRate = baseFireRate - (this.attackSpeed - 1) * rateDecrease;

        // 최소 발사 간격 50ms
        this.fireRate = Math.max(50, calculatedRate);
    }

    // 발사 가능 여부
    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    // 발사 시간 갱신
    fire(currentTime) {
        this.lastFireTime = currentTime;
    }

    // 발사 방향 가져오기 (방향키) - 4방향만 (대각선 불가)
    getShootDirection() {
        let dx = 0;
        let dy = 0;

        // 우선순위: 상하 > 좌우 (동시에 누르면 상하만 발사)
        if (this.keys.arrowUp) {
            dy = -1;
        } else if (this.keys.arrowDown) {
            dy = 1;
        } else if (this.keys.arrowLeft) {
            dx = -1;
        } else if (this.keys.arrowRight) {
            dx = 1;
        }

        return { x: dx, y: dy };
    }

    // 발사 키가 눌렸는지 확인 (4방향만, 대각선 막기)
    isShootingKeyPressed() {
        // 정확히 하나의 방향키만 눌렸을 때만 발사
        const upDown = this.keys.arrowUp || this.keys.arrowDown;
        const leftRight = this.keys.arrowLeft || this.keys.arrowRight;

        // 상하와 좌우가 동시에 눌리면 발사 안 함
        if (upDown && leftRight) {
            return false;
        }

        return upDown || leftRight;
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

    // 아이템 사용 가능 여부
    canUseItem() {
        const slot = this.itemSlots[this.currentSlot];
        return slot && slot.type && this.itemCooldown <= 0;
    }

    // 현재 활성화된 아이템 가져오기
    getActiveItem() {
        const slot = this.itemSlots[this.currentSlot];
        return slot ? slot.type : null;
    }

    // 슬롯에 아이템 추가
    addItemToSlot(itemType, itemImage = null) {
        // 빈 슬롯 찾기
        for (let i = 0; i < this.itemSlots.length; i++) {
            if (this.itemSlots[i] === null) {
                this.itemSlots[i] = { type: itemType, image: itemImage };
                console.log(`슬롯 ${i}에 ${itemType} 추가`);
                return;
            }
        }
        // 모든 슬롯이 가득 차면 현재 슬롯 덮어쓰기
        this.itemSlots[this.currentSlot] = { type: itemType, image: itemImage };
        console.log(`슬롯 ${this.currentSlot}에 ${itemType} 덮어쓰기`);
    }

    // 아이템 사용 처리
    useItem(cooldown = null) {
        this.itemCooldown = cooldown !== null ? cooldown : this.itemMaxCooldown;
    }

    // 대쉬 시작
    startDash() {
        this.isDashing = true;
        this.dashTimer = 0;
        this.dashCooldown = this.dashCooldownMax;

        // 대쉬 방향 결정 (현재 바라보는 방향 또는 이동 방향)
        let dashDx = 0;
        let dashDy = 0;

        // 이동 중이면 이동 방향으로 대쉬
        if (this.keys.w) dashDy = -1;
        else if (this.keys.s) dashDy = 1;

        if (this.keys.a) dashDx = -1;
        else if (this.keys.d) dashDx = 1;

        // 이동하지 않으면 마지막 방향으로 대쉬
        if (dashDx === 0 && dashDy === 0) {
            switch (this.lastDirection) {
                case 'w':
                case 'up':
                    dashDy = -1;
                    break;
                case 's':
                case 'down':
                    dashDy = 1;
                    break;
                case 'a':
                case 'left':
                    dashDx = -1;
                    break;
                case 'd':
                case 'right':
                    dashDx = 1;
                    break;
                default:
                    dashDy = 1; // 기본값: 아래
            }
        }

        // 대각선 정규화
        if (dashDx !== 0 && dashDy !== 0) {
            const length = Math.sqrt(dashDx * dashDx + dashDy * dashDy);
            dashDx /= length;
            dashDy /= length;
        }

        // 대쉬 이동
        this.x += dashDx * this.dashSpeed * this.dashDuration;
        this.y += dashDy * this.dashSpeed * this.dashDuration;

        // 무적 시간 설정
        this.invincible = true;
        this.invincibleTime = 0;
        this.invincibleDuration = this.dashInvincibleDuration * 1000; // 밀리초로 변환
    }
}
