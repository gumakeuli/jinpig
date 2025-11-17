// 플레이어 클래스
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;

        // 캐릭터 이미지 로드
        this.imageIdle = new Image();
        this.imageIdle.src = 'assets/images/2.jpg';
        this.imageShoot = new Image();
        this.imageShoot.src = 'assets/images/3.png';

        this.imageLoaded = false;
        this.currentImage = this.imageIdle;

        this.imageIdle.onload = () => {
            this.imageLoaded = true;
        };

        // 발사 상태
        this.isShooting = false;
        this.shootAnimTime = 0;
        this.shootAnimDuration = 0.2; // 0.2초 동안 발사 이미지 표시

        // 이동 관련
        this.speed = 200; // 픽셀/초
        this.vx = 0;
        this.vy = 0;

        // 스탯
        this.maxHealth = 6;
        this.health = 6;
        this.damage = 1;

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
        this.fireRate = 250; // ms
        this.lastFireTime = 0;

        // 무적 시간
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 1000; // 1초
    }

    // 입력 처리
    handleKeyDown(key) {
        switch(key) {
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
        }
    }

    handleKeyUp(key) {
        switch(key) {
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

        // 발사 애니메이션 업데이트
        if (this.isShooting) {
            this.shootAnimTime += deltaTime;
            if (this.shootAnimTime >= this.shootAnimDuration) {
                this.isShooting = false;
                this.shootAnimTime = 0;
                this.currentImage = this.imageIdle;
            }
        }
    }

    // 그리기
    draw(ctx) {
        // 무적 상태면 깜빡임
        if (this.invincible && Math.floor(this.invincibleTime / 100) % 2 === 0) {
            return;
        }

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
            // 로딩 중에는 녹색 사각형
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    }

    // 발사 애니메이션 시작
    startShootAnimation() {
        this.isShooting = true;
        this.shootAnimTime = 0;
        this.currentImage = this.imageShoot;
    }

    // 데미지 받기
    takeDamage(amount) {
        if (this.invincible) return false;

        this.health -= amount;
        this.invincible = true;
        this.invincibleTime = 0;

        return true;
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
}
