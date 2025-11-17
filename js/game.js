// 게임 클래스
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoop = null;

        // 게임 엔티티
        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.items = [];
        this.room = null;
        this.ui = new UI(this.canvas.width, this.canvas.height);

        // 시간 관리
        this.lastTime = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }

    handleKeyDown(e) {
        if (!this.isRunning || this.isPaused) return;

        // 방향키와 WASD 기본 동작 방지
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
            e.preventDefault();
        }

        if (this.player) {
            this.player.handleKeyDown(e.key);
        }
    }

    handleKeyUp(e) {
        if (!this.isRunning || this.isPaused) return;

        if (this.player) {
            this.player.handleKeyUp(e.key);
        }
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.updateScore();

        this.init();
        // requestAnimationFrame으로 게임 루프 시작
        this.gameLoop = requestAnimationFrame((time) => this.run(time));
    }

    pause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.drawPauseScreen();
        } else {
            // 일시정지 해제 시 게임 루프 재시작
            this.lastTime = performance.now();
            this.gameLoop = requestAnimationFrame((time) => this.run(time));
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.updateScore();

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        this.clear();
        this.drawStartScreen();
    }

    init() {
        // 게임 초기화 로직
        this.room = new Room(this.canvas.width, this.canvas.height);
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.projectiles = [];
        this.enemies = [];
        this.items = [];

        // 테스트용 적 생성 (벽 안쪽에 배치)
        this.spawnEnemy(200, 150, 'basic');
        this.spawnEnemy(600, 150, 'basic');
        this.spawnEnemy(400, 120, 'fast');
        this.spawnEnemy(150, 400, 'tank');

        // 테스트용 아이템 생성
        this.spawnItem(300, 200, 'health');
        this.spawnItem(500, 200, 'damage');
        this.spawnItem(400, 350, 'speed');
        this.spawnItem(250, 450, 'firerate');
        this.spawnItem(550, 450, 'heal');

        // 시간 초기화
        this.lastTime = performance.now();

        this.clear();
    }

    // 적 생성 헬퍼 함수
    spawnEnemy(x, y, type = 'basic') {
        const enemy = new Enemy(x, y, type);
        enemy.setTarget(this.player);
        this.enemies.push(enemy);
    }

    // 아이템 생성 헬퍼 함수
    spawnItem(x, y, type) {
        const item = new Item(x, y, type);
        this.items.push(item);
    }

    run(currentTime) {
        if (!this.isRunning || this.isPaused) return;

        // deltaTime 계산 (초 단위)
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime, currentTime);
        this.draw();

        this.gameLoop = requestAnimationFrame((time) => this.run(time));
    }

    update(deltaTime, currentTime) {
        // 플레이어 업데이트
        if (this.player) {
            this.player.update(deltaTime, this.canvas.width, this.canvas.height);

            // 방 경계 제약
            if (this.room) {
                this.room.constrainEntity(this.player);
            }

            // 방향키로 발사
            if (this.player.isShootingKeyPressed() && this.player.canFire(currentTime)) {
                const dir = this.player.getShootDirection();

                // 방향키가 눌렸을 때 발사
                if (dir.x !== 0 || dir.y !== 0) {
                    const projectile = new Projectile(
                        this.player.x,
                        this.player.y,
                        dir.x,
                        dir.y,
                        this.player.damage
                    );
                    this.projectiles.push(projectile);
                    this.player.fire(currentTime);
                    this.player.startShootAnimation(); // 발사 애니메이션 시작
                }
            }
        }

        // 발사체 업데이트
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime, this.canvas.width, this.canvas.height);

            // 벽 충돌 체크
            if (this.room && this.room.checkProjectileWallCollision(this.projectiles[i])) {
                this.projectiles[i].active = false;
            }

            // 비활성화된 발사체 제거
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }

        // 적 업데이트
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(deltaTime);

            // 방 경계 제약
            if (this.room) {
                this.room.constrainEntity(this.enemies[i]);
            }

            // 죽은 적 제거 (아이템 드롭 가능성)
            if (!this.enemies[i].active) {
                // 50% 확률로 아이템 드롭
                if (Math.random() < 0.5) {
                    const itemTypes = ['health', 'damage', 'speed', 'firerate', 'heal'];
                    const randomType = randomChoice(itemTypes);
                    this.spawnItem(this.enemies[i].x, this.enemies[i].y, randomType);
                }

                this.enemies.splice(i, 1);
                this.updateScore(10); // 적 처치 점수
            }
        }

        // 아이템 업데이트
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].update(deltaTime);

            // 비활성 아이템 제거
            if (!this.items[i].active) {
                this.items.splice(i, 1);
            }
        }

        // 충돌 감지
        this.checkCollisions();

        // 게임오버 체크
        if (this.player && this.player.health <= 0) {
            this.gameOver();
        }
    }

    // 충돌 감지
    checkCollisions() {
        if (!this.player) return;

        const playerBounds = {
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        };

        // 발사체 vs 적 충돌
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const projBounds = projectile.getBounds();

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const enemyBounds = enemy.getBounds();

                if (checkCollision(projBounds, enemyBounds)) {
                    // 적이 데미지를 받음
                    enemy.takeDamage(projectile.damage);
                    // 발사체 제거
                    projectile.active = false;
                    break;
                }
            }
        }

        // 플레이어 vs 적 충돌
        for (const enemy of this.enemies) {
            const enemyBounds = enemy.getBounds();

            if (checkCollision(playerBounds, enemyBounds)) {
                // 플레이어가 데미지를 받음
                if (this.player.takeDamage(enemy.damage)) {
                    // 넉백 효과 (적 반대 방향으로 밀림)
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        const knockbackForce = 50;
                        this.player.x += (dx / distance) * knockbackForce;
                        this.player.y += (dy / distance) * knockbackForce;
                    }
                }
            }
        }

        // 플레이어 vs 아이템 충돌
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const itemBounds = item.getBounds();

            if (checkCollision(playerBounds, itemBounds)) {
                // 아이템 효과 적용
                item.apply(this.player);
                this.updateScore(5); // 아이템 획득 점수
            }
        }
    }

    draw() {
        this.clear();

        // 방 그리기 (배경 + 벽)
        if (this.room) {
            this.room.draw(this.ctx);
        }

        // 아이템 그리기 (바닥에 먼저)
        for (const item of this.items) {
            item.draw(this.ctx);
        }

        // 적 그리기
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // 발사체 그리기
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }

        // 플레이어 그리기
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // UI/HUD 그리기
        this.ui.draw(this.ctx, this.player, this.score);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawStartScreen() {
        this.clear();
        // 배경만 표시 (타이틀은 HTML로 표시)
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('일시정지', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.textAlign = 'left';
    }

    updateScore(points = 0) {
        this.score += points;
    }

    gameOver() {
        this.isRunning = false;

        // UI 게임오버 화면 표시
        this.ui.drawGameOver(this.ctx, this.score);

        // 타이틀 화면 다시 표시
        setTimeout(() => {
            if (typeof showTitle === 'function') {
                showTitle();
            }
        }, 2000);
    }
}
