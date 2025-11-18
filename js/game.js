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
        this.stars = []; // 별의 소리
        this.room = null;
        this.ui = new UI(this.canvas.width, this.canvas.height);

        // 별의 소리 카운트
        this.starCount = 0;

        // 던전 시스템
        this.dungeon = null;
        this.minimap = null;
        this.currentRoomId = null;
        this.level = 1;
        this.maxLevel = 3; // 최대 3스테이지

        // 스테이지 표시
        this.showStageText = false;
        this.stageTextTimer = 0;
        this.stageTextDuration = 2; // 2초 동안 표시

        // 시간 관리
        this.lastTime = 0;

        // 방 전환 상태
        this.isTransitioning = false;
        this.transitionDelay = 500; // 0.5초 딜레이
        this.transitionTimer = 0;
        this.nextRoomDirection = null;
        this.transitionCooldown = 0; // 전환 후 쿨다운
        this.transitionCooldownDuration = 1000; // 1초 쿨다운

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

        // 게임 시작 시 스테이지 텍스트 표시
        this.showStageText = true;
        this.stageTextTimer = 0;

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
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.projectiles = [];
        this.enemies = [];
        this.items = [];

        // 던전 생성
        const generator = new DungeonGenerator(this.level);
        this.dungeon = generator.generate();
        this.minimap = new Minimap(this.dungeon, this.canvas.width);

        // 시작 방으로 이동
        this.currentRoomId = this.dungeon.startRoom;
        this.loadRoomById(this.currentRoomId);

        // 시간 초기화
        this.lastTime = performance.now();

        this.clear();
    }

    // 이웃 셀 ID를 방향으로 변환
    getNeighborDirections(neighbors) {
        const directions = [];
        const currentId = this.currentRoomId;

        for (const neighborId of neighbors) {
            const diff = neighborId - currentId;
            if (diff === -10) directions.push('top');
            else if (diff === 10) directions.push('bottom');
            else if (diff === -1) directions.push('left');
            else if (diff === 1) directions.push('right');
        }

        return directions;
    }

    // 두 방 사이의 방향 계산
    getDirectionBetween(fromId, toId) {
        const diff = toId - fromId;

        if (diff === -10) return 'top';
        else if (diff === 10) return 'bottom';
        else if (diff === -1) return 'left';
        else if (diff === 1) return 'right';

        return null;
    }

    // ID로 방 로드 (던전 시스템용)
    loadRoomById(roomId) {
        const roomData = this.dungeon.rooms.get(roomId);
        if (!roomData) return;

        // 방 방문 표시
        roomData.visited = true;
        this.minimap.setCurrentRoom(roomId);

        // 현재 방 설정
        this.currentRoomId = roomId;

        // 방 타입에 따라 로드
        const hasEnemies = roomData.type !== 'start' && roomData.type !== 'shop' && !roomData.cleared;
        this.loadRoom(hasEnemies, roomData.type, roomData.neighbors);
    }

    // 방 로드 (적 생성 여부 결정)
    loadRoom(hasEnemies, roomType = 'normal', neighbors = []) {
        // 새 방 생성
        this.room = new Room(this.canvas.width, this.canvas.height, hasEnemies);

        // 이웃 정보로 문 설정
        if (neighbors.length > 0) {
            const neighborDirections = this.getNeighborDirections(neighbors);
            this.room.setNeighbors(neighborDirections);

            // 이웃 중에 보물방이 있으면 해당 방향 문을 보물방 문으로 설정
            for (const neighborId of neighbors) {
                const neighborData = this.dungeon.rooms.get(neighborId);
                if (neighborData && neighborData.type === 'treasure') {
                    const directionToTreasure = this.getDirectionBetween(this.currentRoomId, neighborId);
                    if (directionToTreasure) {
                        this.room.setTreasureDoor(directionToTreasure);
                    }
                }
            }
        }

        // 기존 엔티티 제거
        this.projectiles = [];
        this.enemies = [];
        this.items = [];

        // 방 타입별 처리
        if (roomType === 'boss') {
            // 보스방: 강한 적 생성
            this.spawnEnemy(400, 200, 'tank');
            this.spawnEnemy(300, 300, 'tank');
            this.spawnEnemy(500, 300, 'fast');
            this.room.closeAllDoors();
        } else if (roomType === 'treasure') {
            // 보물방: 중앙에 아이템 생성
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            // 테스트용 아이템 (나중에 이미지 추가 예정)
            this.spawnItem(centerX, centerY, 'damage', null);

            // 모든 문 열기 (장애물 없음)
            this.room.openAllDoors();
        } else if (roomType === 'shop') {
            // 상점: 비어있음 (나중에 별의 소리로 구매할 아이템 추가 가능)
            this.room.openAllDoors();
        } else if (hasEnemies) {
            // 일반 전투 방
            this.spawnEnemy(200, 150, 'basic');
            this.spawnEnemy(600, 150, 'basic');
            this.spawnEnemy(400, 120, 'fast');
            this.spawnEnemy(150, 400, 'tank');

            // 적이 있는 방은 문을 닫음
            this.room.closeAllDoors();
        } else {
            // 시작 방은 문을 열어둠
            this.room.openAllDoors();
        }

        // 장애물 생성 (시작방과 보스방 제외)
        if (roomType !== 'start' && roomType !== 'boss') {
            this.room.generateObstacles();
        }
    }

    // 방 전환 시작
    startRoomTransition(direction) {
        this.isTransitioning = true;
        this.transitionTimer = 0;
        this.nextRoomDirection = direction;
    }

    // 방 전환 완료
    completeRoomTransition() {
        const direction = this.nextRoomDirection;

        // 다음 방 ID 계산
        let nextRoomId = this.currentRoomId;
        switch(direction) {
            case 'top':
                nextRoomId -= 10;
                break;
            case 'bottom':
                nextRoomId += 10;
                break;
            case 'left':
                nextRoomId -= 1;
                break;
            case 'right':
                nextRoomId += 1;
                break;
        }

        // 다음 방이 존재하는지 확인
        const roomData = this.dungeon.rooms.get(this.currentRoomId);
        if (roomData && roomData.neighbors.includes(nextRoomId)) {
            // 플레이어 위치를 반대편 문 근처로 이동
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const offset = 80;

            switch(direction) {
                case 'top':
                    this.player.x = centerX;
                    this.player.y = this.canvas.height - offset;
                    break;
                case 'bottom':
                    this.player.x = centerX;
                    this.player.y = offset;
                    break;
                case 'left':
                    this.player.x = this.canvas.width - offset;
                    this.player.y = centerY;
                    break;
                case 'right':
                    this.player.x = offset;
                    this.player.y = centerY;
                    break;
            }

            // 새로운 방 로드
            this.loadRoomById(nextRoomId);
        }

        // 전환 상태 리셋
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.nextRoomDirection = null;

        // 쿨다운 시작 (다시 문에 닿아도 바로 전환 안 됨)
        this.transitionCooldown = this.transitionCooldownDuration;
    }

    // 적 생성 헬퍼 함수
    spawnEnemy(x, y, type = 'basic') {
        const enemy = new Enemy(x, y, type);
        enemy.setTarget(this.player);
        this.enemies.push(enemy);
    }

    // 아이템 생성 헬퍼 함수
    spawnItem(x, y, type, imagePath = null) {
        const item = new Item(x, y, type, imagePath);
        this.items.push(item);
    }

    // 보스 클리어 시 호출
    onBossCleared() {
        if (this.level >= this.maxLevel) {
            // 3스테이지 클리어 - 게임 클리어
            this.onGameComplete();
        } else {
            // 다음 스테이지로
            setTimeout(() => {
                this.nextStage();
            }, 2000); // 2초 후 전환
        }
    }

    // 다음 스테이지로 이동
    nextStage() {
        this.level++;

        // 플레이어 체력 회복 (보너스)
        if (this.player) {
            this.player.health = Math.min(this.player.health + 1, this.player.maxHealth);
        }

        // 스테이지 텍스트 표시
        this.showStageText = true;
        this.stageTextTimer = 0;

        // 새 던전 생성
        const generator = new DungeonGenerator(this.level);
        this.dungeon = generator.generate();
        this.minimap = new Minimap(this.dungeon, this.canvas.width);

        // 시작 방으로 이동
        this.currentRoomId = this.dungeon.startRoom;
        this.loadRoomById(this.currentRoomId);

        // 플레이어 위치 초기화
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
    }

    // 게임 클리어
    onGameComplete() {
        this.isRunning = false;
        this.clear();
        this.drawGameComplete();

        // 3초 후 타이틀로
        setTimeout(() => {
            const gameTitle = document.getElementById('gameTitle');
            if (gameTitle) {
                gameTitle.style.display = 'flex';
            }
            this.reset();
        }, 3000);
    }

    run(currentTime) {
        if (!this.isRunning || this.isPaused) return;

        // deltaTime 계산 (초 단위)
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime, currentTime);
        this.draw(deltaTime);

        this.gameLoop = requestAnimationFrame((time) => this.run(time));
    }

    update(deltaTime, currentTime) {
        // 스테이지 텍스트 타이머 업데이트
        if (this.showStageText) {
            this.stageTextTimer += deltaTime;
            if (this.stageTextTimer >= this.stageTextDuration) {
                this.showStageText = false;
            }
        }

        // 쿨다운 업데이트
        if (this.transitionCooldown > 0) {
            this.transitionCooldown -= deltaTime * 1000;
        }

        // 방 전환 중이면 타이머 업데이트
        if (this.isTransitioning) {
            this.transitionTimer += deltaTime * 1000;
            if (this.transitionTimer >= this.transitionDelay) {
                // 전환 완료, 새 방으로 이동
                this.completeRoomTransition();
            }
            return; // 전환 중에는 다른 업데이트 안 함
        }

        // 플레이어 업데이트
        if (this.player) {
            this.player.update(deltaTime, this.canvas.width, this.canvas.height);

            // 방 경계 제약
            if (this.room) {
                this.room.constrainEntity(this.player);

                // 장애물 충돌 체크
                const collidedObstacle = this.room.checkObstacleCollision(this.player);
                if (collidedObstacle) {
                    // 플레이어를 장애물에서 밀어냄
                    const playerBounds = this.player.getBounds();
                    const obstacleBounds = collidedObstacle.getBounds();

                    // 겹친 부분 계산
                    const overlapX = Math.min(
                        playerBounds.x + playerBounds.width - obstacleBounds.x,
                        obstacleBounds.x + obstacleBounds.width - playerBounds.x
                    );
                    const overlapY = Math.min(
                        playerBounds.y + playerBounds.height - obstacleBounds.y,
                        obstacleBounds.y + obstacleBounds.height - playerBounds.y
                    );

                    // 겹친 부분이 작은 축으로 밀어냄
                    if (overlapX < overlapY) {
                        if (this.player.x < collidedObstacle.x) {
                            this.player.x -= overlapX;
                        } else {
                            this.player.x += overlapX;
                        }
                    } else {
                        if (this.player.y < collidedObstacle.y) {
                            this.player.y -= overlapY;
                        } else {
                            this.player.y += overlapY;
                        }
                    }

                    // 장애물과의 상호작용 (거미줄, 가시 등)
                    const damage = collidedObstacle.interactWithPlayer(this.player);
                    if (damage > 0) {
                        this.player.takeDamage(damage);
                    }
                }

                // 문 충돌 체크 (쿨다운 중이 아닐 때만)
                if (this.transitionCooldown <= 0) {
                    const doorDirection = this.room.checkDoorCollision(this.player);
                    if (doorDirection && !this.isTransitioning) {
                        this.startRoomTransition(doorDirection);
                    }
                }
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

            // 장애물 충돌 체크 (바위만 막음, 구멍/거미줄/가시는 통과)
            if (this.room && this.room.checkObstacleProjectileCollision(this.projectiles[i])) {
                this.projectiles[i].active = false;
            }

            // 비활성화된 발사체 제거
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }

        // 장애물 업데이트
        if (this.room) {
            this.room.updateObstacles(deltaTime);
        }

        // 적 업데이트
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(deltaTime);

            // 방 경계 제약
            if (this.room) {
                this.room.constrainEntity(this.enemies[i]);
            }

            // 죽은 적 제거 (별의 소리 드롭)
            if (!this.enemies[i].active) {
                const enemy = this.enemies[i];

                // 별의 소리 드롭
                const starCount = enemy.getStarDropCount();
                for (let j = 0; j < starCount; j++) {
                    this.spawnStar(enemy.x, enemy.y);
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

        // 별의 소리 업데이트
        for (let i = this.stars.length - 1; i >= 0; i--) {
            this.stars[i].update(deltaTime, this.canvas.width, this.canvas.height, this.room.bounds);

            // 비활성 별 제거
            if (!this.stars[i].active) {
                this.stars.splice(i, 1);
            }
        }

        // 적을 모두 처치하면 문 열기
        if (this.room && this.room.hasEnemies && this.enemies.length === 0) {
            this.room.openAllDoors();

            // 던전 시스템: 방을 cleared로 표시
            if (this.dungeon && this.currentRoomId !== null) {
                const roomData = this.dungeon.rooms.get(this.currentRoomId);
                if (roomData) {
                    roomData.cleared = true;

                    // 보스방 클리어 시 다음 스테이지로
                    if (roomData.type === 'boss' && this.currentRoomId === this.dungeon.bossRoom) {
                        this.onBossCleared();
                    }
                }
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

        // 플레이어 vs 별의 소리 충돌
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            const starBounds = star.getBounds();

            if (checkCollision(playerBounds, starBounds)) {
                // 별의 소리 획득
                this.starCount++;
                this.stars.splice(i, 1);
            }
        }
    }

    // 별의 소리 생성
    spawnStar(x, y) {
        const star = new Star(x, y);
        this.stars.push(star);
    }

    draw(deltaTime = 0) {
        this.clear();

        // 방 그리기 (배경 + 벽)
        if (this.room) {
            this.room.draw(this.ctx, deltaTime);
        }

        // 장애물 그리기 (바닥 레이어)
        if (this.room) {
            this.room.drawObstacles(this.ctx);
        }

        // 아이템 그리기 (바닥에 먼저)
        for (const item of this.items) {
            item.draw(this.ctx);
        }

        // 별의 소리 그리기
        for (const star of this.stars) {
            star.draw(this.ctx);
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
        this.ui.draw(this.ctx, this.player, this.starCount);

        // 미니맵 그리기
        if (this.minimap) {
            this.minimap.draw(this.ctx);
        }

        // 스테이지 텍스트 표시 (게임 시작 및 스테이지 전환 시)
        if (this.showStageText) {
            // 반투명 배경
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // 스테이지 텍스트
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 72px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`STAGE ${this.level}`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }

        // 방 전환 중이면 어두운 오버레이
        if (this.isTransitioning) {
            const progress = this.transitionTimer / this.transitionDelay;
            // 페이드 인/아웃 (0 -> 1 -> 0)
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // "이동 중..." 텍스트
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('이동 중...', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }
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

    drawGameComplete() {
        // 배경
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 게임 클리어 텍스트
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME CLEAR!', this.canvas.width / 2, this.canvas.height / 2 - 40);

        // 축하 메시지
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText('모든 스테이지를 클리어했습니다!', this.canvas.width / 2, this.canvas.height / 2 + 20);

        // 안내
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillText('잠시 후 타이틀로 돌아갑니다', this.canvas.width / 2, this.canvas.height / 2 + 80);

        this.ctx.textAlign = 'left';
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
