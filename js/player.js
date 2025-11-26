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

        // 사용 아이템
        this.activeItem = null; // 'slash' 등
        this.itemCooldown = 0;
        this.itemMaxCooldown = 1; // 1초 쿨다운

        this.keys.space = false;
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
        if (this.invincible) return false;

        // 행운에 따른 회피 확률 체크
        const dodgeChance = this.luck; // 행운 1당 1%
        const randomValue = Math.random() * 100; // 0~100

        if (randomValue < dodgeChance) {
            // 회피 성공!
            return false;
        }

        this.health -= amount;
        this.invincible = true;
        this.invincibleTime = 0;

        return true;
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
        return this.activeItem && this.itemCooldown <= 0;
    }

    // 아이템 사용 처리
    useItem() {
        this.itemCooldown = this.itemMaxCooldown;
    }
}
