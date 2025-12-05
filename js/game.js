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
        this.enemies = [];
        this.items = [];
        this.activeItems = []; // 활성화된 사용 아이템 (베기 등)
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

        // 아이템 획득 표시
        this.showItemPickup = false;
        this.itemPickupTimer = 0;
        this.itemPickupDuration = 3; // 3초 동안 표시
        this.pickedItemName = '';
        this.pickedItemDescription = '';

        // 시간 관리
        this.lastTime = 0;

        // 방 전환 상태
        this.isTransitioning = false;
        this.transitionDelay = 500; // 0.5초 딜레이
        this.transitionTimer = 0;
        this.nextRoomDirection = null;
        this.transitionCooldown = 0; // 전환 후 쿨다운
        this.transitionCooldownDuration = 1000; // 1초 쿨다운

        // 게임 모드 선택
        this.gameMode = null; // 'angko' or 'imdak'
        this.showModeSelection = false; // 모드 선택 화면 표시 여부

        this.setupEventListeners();
        this.camera = { x: 0, y: 0 };
        this.mouseX = 0;
        this.mouseY = 0;
    }

    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // 마우스 이동 추적
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // 마우스 클릭 (모드 선택용)
        this.canvas.addEventListener('click', (e) => {
            if (this.showModeSelection) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                this.handleModeSelection(clickX, clickY);
            }
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

        // 모드 선택 화면 표시
        this.showModeSelection = true;
        this.clear();
        this.drawModeSelection();
    }

    // 모드 선택 후 실제 게임 시작
    startGame() {
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

    init(preserveLevel = false) {
        // 게임 초기화 로직
        // preserveLevel이 true가 아니면 항상 레벨 1로 리셋 (죽었을 때)
        if (!preserveLevel) {
            this.level = 1;
        }
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.projectiles = [];
        this.enemies = [];
        this.items = [];
        this.activeItems = [];
        this.stars = [];
        this.particles = []; // 파티클 초기화
        this.portal = null;
        this.altar = null; // 제단 초기화
        this.collectedItems = new Set();

        // 방 상태 저장소 (방 ID -> { room, enemies, items, projectiles })
        this.roomStates = new Map();

        // 방 전환 상태 초기화
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.nextRoomDirection = null;
        this.transitionCooldown = 0;

        // 카메라 초기화
        this.camera = { x: 0, y: 0 };
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

        // 기존 보스 BGM 정지 (게임 재시작 시)
        if (this.bossBGM && this.isBossBGMPlaying) {
            this.bossBGM.pause();
            this.bossBGM.currentTime = 0;
            this.isBossBGMPlaying = false;
        }

        // 보스 BGM
        this.bossBGM = new Audio('assets/sounds/홍북이의 노래.mp3');
        this.bossBGM.loop = true;
        this.bossBGM.volume = 0.5;
        this.isBossBGMPlaying = false;

        // 보스 인트로
        this.bossIntro = {
            active: false,
            boss: null,
            timer: 0,
            duration: 3.0 // 3초 동안 표시
        };

        // 던전 생성
        const generator = new DungeonGenerator(this.level);
        this.dungeon = generator.generate();
        this.minimap = new Minimap(this.dungeon, this.canvas.width, this.canvas.height);

        // 시작 방으로 이동
        this.currentRoomId = this.dungeon.startRoom;
        this.loadRoomById(this.currentRoomId);

        // 시간 초기화
        this.lastTime = performance.now();

        this.clear();
    }

    // 이웃 셀 ID를 방향으로 변환
    getNeighborDirections(neighbors) {
        console.log('getNeighborDirections', neighbors);
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
        // 현재 방 상태 저장
        if (this.room && this.currentRoomId !== null) {
            this.roomStates.set(this.currentRoomId, {
                room: this.room,
                enemies: this.enemies,
                items: this.items,
                altar: this.altar, // 제단 상태 저장
                stars: this.stars, // 별의 소리도 방별로 저장
                // 투사체는 저장하지 않음 (방 이동 시 제거)
                visited: true
            });
        }

        const roomData = this.dungeon.rooms.get(roomId);
        if (!roomData) return;

        // 방 방문 표시
        roomData.visited = true;
        this.minimap.setCurrentRoom(roomId);

        // 현재 방 ID 업데이트
        this.currentRoomId = roomId;

        // 저장된 상태가 있는지 확인
        if (this.roomStates.has(roomId)) {
            // 상태 복원
            const state = this.roomStates.get(roomId);
            this.room = state.room;
            this.enemies = state.enemies;
            this.items = state.items;
            this.altar = state.altar; // 제단 상태 복원
            this.stars = state.stars || []; // 별의 소리 복원 (없으면 빈 배열)
            this.projectiles = []; // 투사체 초기화
        } else {
            // 새로운 방 로드
            // 방 타입에 따라 로드
            const hasEnemies = roomData.type !== 'start' && roomData.type !== 'shop' && !roomData.cleared;
            this.loadRoom(hasEnemies, roomData.type, roomData.neighbors);

            // 새로운 방이므로 별의 소리 초기화
            this.stars = [];
        }
    }

    // 방 로드 (적 생성 여부 결정)
    loadRoom(hasEnemies, roomType = 'normal', neighbors = []) {
        console.log('loadRoom start', roomType, neighbors);

        // 방 크기 결정
        let roomWidth = this.canvas.width;
        let roomHeight = this.canvas.height;

        if (roomType === 'boss') {
            roomWidth = this.canvas.width * 1.5;
            roomHeight = this.canvas.height * 1.5;
        }

        // 새 방 생성
        this.room = new Room(roomWidth, roomHeight, hasEnemies);

        // 카메라 초기화 (보스방이면 중앙, 아니면 0,0)
        if (roomType === 'boss') {
            // 플레이어가 문으로 들어오므로 위치에 따라 카메라 조정 필요하지만, 일단 0,0으로 시작하고 update에서 조정
            this.camera.x = 0;
            this.camera.y = 0;
        } else {
            this.camera.x = 0;
            this.camera.y = 0;
        }

        // 이웃 정보로 문 설정
        if (neighbors.length > 0) {
            const neighborDirections = this.getNeighborDirections(neighbors);
            this.room.setNeighbors(neighborDirections);

            // 이웃 중에 보물방이나 상점이 있으면 해당 방향 문을 특별 문으로 설정
            for (const neighborId of neighbors) {
                const neighborData = this.dungeon.rooms.get(neighborId);
                if (neighborData) {
                    // 보물방 문 설정
                    if (neighborData.type === 'treasure') {
                        const directionToTreasure = this.getDirectionBetween(this.currentRoomId, neighborId);
                        if (directionToTreasure) {
                            this.room.setTreasureDoor(directionToTreasure);
                        }
                    }
                    // 상점 문 설정
                    if (neighborData.type === 'shop') {
                        const directionToShop = this.getDirectionBetween(this.currentRoomId, neighborId);
                        if (directionToShop) {
                            this.room.setShopDoor(directionToShop);
                        }
                    }
                    // 보스방 문 설정
                    if (neighborData.type === 'boss') {
                        const directionToBoss = this.getDirectionBetween(this.currentRoomId, neighborId);
                        if (directionToBoss) {
                            this.room.setBossDoor(directionToBoss);
                        }
                    }
                }
            }
        }

        // 기존 엔티티 제거
        this.projectiles = [];
        this.enemies = [];
        this.items = [];
        this.altar = null; // 제단 초기화 (기본값)

        // 방 타입별 처리
        if (roomType === 'boss') {
            // 보스방: 보스 적 생성 (중앙)
            let boss;
            if (this.level === 3) {
                boss = this.spawnEnemy(roomWidth / 2, roomHeight / 2, 'stage3_boss');
            } else if (this.level === 2) {
                boss = this.spawnEnemy(roomWidth / 2, roomHeight / 2, 'hive_boss');
            } else {
                boss = this.spawnEnemy(roomWidth / 2, roomHeight / 2, 'boss');
            }

            // 보스 인트로 활성화 (레벨 1만)
            if (this.level === 1 && boss && boss.bossName) {
                this.bossIntro.active = true;
                this.bossIntro.boss = boss;
                this.bossIntro.timer = 0;
            }

            this.room.closeAllDoors();
        } else if (roomType === 'treasure') {
            // 보물방: 중앙에 아이템 생성
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            // 아이템 목록
            const items = [
                { type: 'lilith_body', image: 'assets/images/items/1.png' },
                { type: 'mystery_item', image: 'assets/images/items/3.png' },
                { type: 'soda_komibol', image: 'assets/images/items/2.jpg' },
                { type: 'montelli_gun', image: 'assets/images/items/5.webp' }
            ];

            // 임딱 모드: 2스테이지부터 무라사마 추가
            if (this.gameMode === 'imdak' && this.level >= 2) {
                items.push({ type: 'murasama', image: 'assets/images/items/20.gif' });
            }

            // 이미 획득한 아이템 제외
            const availableItems = items.filter(item => !this.collectedItems.has(item.type));

            if (availableItems.length > 0) {
                // 랜덤 선택
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];

                // 아이템 생성 (캐시 방지를 위한 타임스탬프 추가)
                this.spawnItem(centerX, centerY, randomItem.type, `${randomItem.image}?t=${Date.now()}`);
            } else {
                // 모든 아이템을 획득했으면 회복 포션 생성
                this.spawnItem(centerX, centerY, 'potion', 'assets/images/items/16.png');
            }

            // 모든 문 열기 (장애물 없음)
            this.room.openAllDoors();
        } else if (roomType === 'shop') {
            // 상점
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2; // 화면 중앙으로 이동
            const spacing = 150;

            // 1. 회복 포션 (가격 7)
            const potion = new Item(centerX - spacing, centerY, 'potion', 'assets/images/items/16.png');
            potion.price = 7;
            this.items.push(potion);

            // 2. 스탯 업그레이드 (릴리바이스의 바디) (가격 20~30 랜덤)
            const statUp = new Item(centerX, centerY, 'lilith_body', 'assets/images/items/1.png');
            statUp.price = Math.floor(Math.random() * 11) + 20; // 20 ~ 30
            statUp.hideNameInShop = true;
            this.items.push(statUp);

            // 3. 랜덤 장비 (가격 20~30 랜덤)
            const equipmentTypes = [
                { type: 'mystery_item', image: 'assets/images/items/3.png' },
                { type: 'soda_komibol', image: 'assets/images/items/2.jpg' },
                { type: 'montelli_gun', image: 'assets/images/items/5.webp' }
            ];

            // 임딱 모드: 2스테이지부터 무라사마 추가
            if (this.gameMode === 'imdak' && this.level >= 2) {
                equipmentTypes.push({ type: 'murasama', image: 'assets/images/items/20.gif' });
            }

            // 미보유 장비만 필터링
            const availableEquip = equipmentTypes.filter(item => !this.collectedItems.has(item.type));

            if (availableEquip.length > 0) {
                const randomEquip = availableEquip[Math.floor(Math.random() * availableEquip.length)];
                const equipItem = new Item(centerX + spacing, centerY, randomEquip.type, randomEquip.image);
                equipItem.price = Math.floor(Math.random() * 11) + 20; // 20 ~ 30
                equipItem.hideNameInShop = true;
                this.items.push(equipItem);
            } else {
                // 장비를 다 모았으면 포션 하나 더 (가격 7)
                const extraPotion = new Item(centerX + spacing, centerY, 'potion', 'assets/images/items/16.png');
                extraPotion.price = 7;
                this.items.push(extraPotion);
            }

            this.room.openAllDoors();
        } else if (roomType === 'altar') {
            // 제단 방
            this.altar = new Altar(this.canvas.width / 2, this.canvas.height / 2);
            this.room.openAllDoors();
        } else if (hasEnemies) {
            // 일반 전투 방
            if (this.level === 1) {
                this.spawnEnemy(200, 150, 'basic');
                this.spawnEnemy(600, 150, 'basic');
                this.spawnEnemy(400, 120, 'fast');
                this.spawnEnemy(150, 400, 'tank');
            } else if (this.level >= 2) {
                // 2스테이지: 더 어렵게
                this.spawnEnemy(200, 150, 'fast');
                this.spawnEnemy(600, 150, 'fast');
                this.spawnEnemy(400, 120, 'tank');
                this.spawnEnemy(150, 400, 'tank');
                this.spawnEnemy(300, 300, 'basic');
            }

            // 적이 있는 방은 문을 닫음
            this.room.closeAllDoors();
        } else {
            // 시작 방은 문을 열어둠
            this.room.openAllDoors();

            // 앙코 모드: 1스테이지 시작 방에 무라사마 제공
            if (this.gameMode === 'angko' && this.level === 1) {
                this.spawnItem(this.canvas.width / 2, this.canvas.height / 2 + 100, 'murasama', 'assets/images/items/20.gif');
            }
        }

        // 장애물 생성 (특수방 제외: 시작방, 보스방, 상점방, 아이템방, 석상방)
        if (roomType !== 'start' && roomType !== 'boss' && roomType !== 'shop' && roomType !== 'treasure' && roomType !== 'altar') {
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
        switch (direction) {
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
            // 새로운 방 로드 (먼저 로드해야 방 크기를 알 수 있음)
            this.loadRoomById(nextRoomId);

            // 플레이어 위치를 반대편 문 근처로 이동
            // 현재 방의 크기를 기준으로 위치 설정
            const roomWidth = this.room.canvasWidth;
            const roomHeight = this.room.canvasHeight;
            const centerX = roomWidth / 2;
            const centerY = roomHeight / 2;
            const offset = 150; // 문에서 더 멀리 스폰 (80 → 150)

            switch (direction) {
                case 'top':
                    this.player.x = centerX;
                    this.player.y = roomHeight - offset;
                    break;
                case 'bottom':
                    this.player.x = centerX;
                    this.player.y = offset;
                    break;
                case 'left':
                    this.player.x = roomWidth - offset;
                    this.player.y = centerY;
                    break;
                case 'right':
                    this.player.x = offset;
                    this.player.y = centerY;
                    break;
            }
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

        // 2스테이지 난이도 증가 (체력 1.5배, 데미지 1.5배)
        if (this.level === 2) {
            enemy.maxHealth = Math.ceil(enemy.maxHealth * 1.5);
            enemy.health = enemy.maxHealth;
            enemy.damage = Math.ceil(enemy.damage * 1.5);
        }

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
            // 다음 스테이지로 가는 포탈 생성
            // 보스방 중앙에 생성
            const roomWidth = this.room ? this.room.canvasWidth : this.canvas.width;
            const roomHeight = this.room ? this.room.canvasHeight : this.canvas.height;

            this.portal = new Portal(roomWidth / 2, roomHeight / 2);
            console.log("포탈 생성됨!");
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

        // 방 상태 초기화 (새 던전)
        this.roomStates.clear();
        this.portal = null;
        this.altar = null; // 제단 초기화
        this.projectiles = [];
        this.enemies = [];
        this.items = [];
        this.particles = []; // 파티클 초기화
        this.activeItems = []; // 플레이어 아이템(Slash)도 초기화될 수 있음. 주의.
        // Slash는 activeItems에 들어가는데, 플레이어가 다시 사용하면 생성되므로 초기화해도 됨.

        // 현재 방 참조 제거 (loadRoomById에서 이전 방을 저장하지 않도록)
        this.room = null;

        // 새 던전 생성
        const generator = new DungeonGenerator(this.level);
        this.dungeon = generator.generate();
        this.minimap = new Minimap(this.dungeon, this.canvas.width, this.canvas.height);

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
        try {
            if (!this.isRunning || this.isPaused) return;

            // deltaTime 계산 (초 단위)
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.update(deltaTime, currentTime);
            this.draw(deltaTime);

            this.gameLoop = requestAnimationFrame((time) => this.run(time));
        } catch (error) {
            console.error("Game Loop Error:", error);
            // Optionally draw error to canvas
            this.ctx.fillStyle = 'red';
            this.ctx.font = '20px Arial';
            this.ctx.fillText("Error: " + error.message, 10, 50);
            this.isRunning = false;
        }
    }

    update(deltaTime, currentTime) {
        // 스테이지 텍스트 타이머 업데이트
        if (this.showStageText) {
            this.stageTextTimer += deltaTime;
            if (this.stageTextTimer >= this.stageTextDuration) {
                this.showStageText = false;
            }
        }

        // 아이템 획득 표시 타이머 업데이트
        if (this.showItemPickup) {
            this.itemPickupTimer += deltaTime;
            if (this.itemPickupTimer >= this.itemPickupDuration) {
                this.showItemPickup = false;
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
            // 방 크기를 전달하여 플레이어가 방 전체를 이동할 수 있게 함
            const roomWidth = this.room ? this.room.canvasWidth : this.canvas.width;
            const roomHeight = this.room ? this.room.canvasHeight : this.canvas.height;
            this.player.update(deltaTime, roomWidth, roomHeight);

            // 방 경계 제약 (현재 방 크기 기준)
            if (this.room) {
                this.room.constrainEntity(this.player);

                // 카메라 업데이트 (플레이어 따라가기)
                // 카메라 목표 위치: 플레이어 중심 - 화면 중심
                let targetCamX = this.player.x - this.canvas.width / 2;
                let targetCamY = this.player.y - this.canvas.height / 2;

                // 카메라 경계 제한 (방 밖으로 나가지 않게)
                targetCamX = Math.max(0, Math.min(targetCamX, this.room.canvasWidth - this.canvas.width));
                targetCamY = Math.max(0, Math.min(targetCamY, this.room.canvasHeight - this.canvas.height));

                // 부드러운 이동 (Lerp)
                this.camera.x += (targetCamX - this.camera.x) * 0.1;
                this.camera.y += (targetCamY - this.camera.y) * 0.1;

                // 화면 흔들림 업데이트
                if (this.screenShake.duration > 0) {
                    this.screenShake.duration -= deltaTime;
                    const intensity = this.screenShake.intensity * (this.screenShake.duration / 0.5); // 시간이 지날수록 약해짐
                    this.screenShake.x = (Math.random() - 0.5) * intensity;
                    this.screenShake.y = (Math.random() - 0.5) * intensity;
                } else {
                    this.screenShake.x = 0;
                    this.screenShake.y = 0;
                }

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
                        // Directly complete transition for immediate room change
                        this.nextRoomDirection = doorDirection;
                        this.completeRoomTransition();
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

                    // 몬텔리의 총 효과 (오팔 총)
                    if (this.player.hasMontelliGun) {
                        projectile.isOpal = true;
                    }

                    this.projectiles.push(projectile);
                    this.player.fire(currentTime);

                    // 발사 방향 문자열 결정
                    let shootDirStr = 's'; // 기본값
                    if (dir.y < 0) shootDirStr = 'up';
                    else if (dir.y > 0) shootDirStr = 'down';
                    else if (dir.x < 0) shootDirStr = 'left';
                    else if (dir.x > 0) shootDirStr = 'right';

                    this.player.startShootAnimation(shootDirStr); // 발사 애니메이션 시작
                }
            }

            // 사용 아이템 (베기 -> 찌르기)
            if (this.player.keys.space && this.player.canUseItem()) {
                if (this.player.getActiveItem() === 'slash') {
                    // 마우스 방향으로 찌르기
                    // 플레이어의 화면상 위치
                    const playerScreenX = this.player.x - this.camera.x;
                    const playerScreenY = this.player.y - this.camera.y;

                    // 마우스와 플레이어 사이의 각도 계산
                    const angle = Math.atan2(this.mouseY - playerScreenY, this.mouseX - playerScreenX);

                    const slash = new Slash(
                        this.player.x,
                        this.player.y,
                        angle, // 방향 문자열 대신 각도 전달
                        1 + this.player.damage * 1.5
                    );
                    this.activeItems.push(slash);
                    this.player.useItem();
                    console.log('찌르기 공격 사용!');
                } else if (this.player.getActiveItem() === 'murasama') {
                    // 무라사마 공격 (21번 이미지 - GIF)
                    const playerScreenX = this.player.x - this.camera.x;
                    const playerScreenY = this.player.y - this.camera.y;
                    const angle = Math.atan2(this.mouseY - playerScreenY, this.mouseX - playerScreenX);

                    // 마우스 위치에 생성 (플레이어 위치가 아님)
                    // "GIF가 그냥 마우스 방향에 나오는 형식" -> 마우스 커서 위치에 생성?
                    // 아니면 플레이어에서 마우스 방향으로 일정 거리 떨어진 곳?
                    // 일단 플레이어 위치에서 마우스 방향으로 약간 떨어진 곳에 생성하도록 함.
                    // 또는 마우스 커서 위치 자체에 생성.
                    // 유저 요청: "마우스 방향에 나오는 형식" -> "앞으로 찌르면서 공격하는 방식이 아니고"
                    // 해석: 플레이어 주변이 아니라 마우스가 가리키는 곳(혹은 그 방향의 일정 거리)에 이펙트가 펑 하고 나오는 것.
                    // 여기서는 플레이어 중심에서 마우스 방향으로 100px 떨어진 곳에 생성해보자.

                    const distance = 60;
                    const spawnX = this.player.x + Math.cos(angle) * distance;
                    const spawnY = this.player.y + Math.sin(angle) * distance;

                    const slash = new GifSlash(
                        spawnX,
                        spawnY,
                        angle,
                        5 + this.player.damage * 1.5, // 데미지 공식 변경: 5 + 공격력 * 1.5
                        'assets/images/items/21.gif'
                    );
                    this.activeItems.push(slash);
                    this.player.useItem(1.5); // 공격 속도 감소 (쿨타임 1.5초)
                    console.log('무라사마 공격 사용!');
                }
            }
        }

        // 발사체 업데이트
        const roomWidth = this.room ? this.room.canvasWidth : this.canvas.width;
        const roomHeight = this.room ? this.room.canvasHeight : this.canvas.height;

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime, roomWidth, roomHeight);

            // 오팔 총 효과 (이동 트레일)
            if (this.projectiles[i].isOpal) {
                if (Math.random() < 0.3) { // 30% 확률로 트레일 생성
                    this.spawnParticles(this.projectiles[i].x, this.projectiles[i].y, '#ccffff', 1);
                }
            }

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

        // 사용 아이템 업데이트 (베기)
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            if (this.player) {
                this.activeItems[i].update(deltaTime, this.player.x, this.player.y);
            }

            if (!this.activeItems[i].active) {
                this.activeItems.splice(i, 1);
            }
        }

        // 장애물 업데이트
        if (this.room) {
            this.room.updateObstacles(deltaTime);
        }

        // 보스 BGM 제어 (1스테이지 보스)
        const isBossRoom = this.dungeon && this.currentRoomId === this.dungeon.bossRoom && this.level === 1;
        const hasBossEnemy = this.enemies.some(e => e.type === 'boss');

        if (isBossRoom && hasBossEnemy && !this.isBossBGMPlaying) {
            // 보스 BGM 재생
            this.bossBGM.currentTime = 0;
            this.bossBGM.play().catch(err => console.log('BGM 재생 실패:', err));
            this.isBossBGMPlaying = true;
        } else if ((!isBossRoom || !hasBossEnemy) && this.isBossBGMPlaying) {
            // 보스 BGM 정지
            this.bossBGM.pause();
            this.isBossBGMPlaying = false;
        }

        // 보스 인트로 업데이트
        if (this.bossIntro.active) {
            this.bossIntro.timer += deltaTime;
            if (this.bossIntro.timer >= this.bossIntro.duration) {
                this.bossIntro.active = false;
            }
        }

        // 적 업데이트
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(deltaTime, this);

            // 방 경계 제약
            if (this.room) {
                this.room.constrainEntity(this.enemies[i]);

                // 장애물 충돌 체크
                const collidedObstacle = this.room.checkObstacleCollision(this.enemies[i]);
                if (collidedObstacle) {
                    // 적을 장애물에서 밀어냄
                    const enemyBounds = this.enemies[i].getBounds();
                    const obstacleBounds = collidedObstacle.getBounds();

                    // 겹친 부분 계산
                    const overlapX = Math.min(
                        enemyBounds.x + enemyBounds.width - obstacleBounds.x,
                        obstacleBounds.x + obstacleBounds.width - enemyBounds.x
                    );
                    const overlapY = Math.min(
                        enemyBounds.y + enemyBounds.height - obstacleBounds.y,
                        obstacleBounds.y + obstacleBounds.height - enemyBounds.y
                    );

                    // 겹친 부분이 작은 축으로 밀어냄
                    if (overlapX < overlapY) {
                        if (this.enemies[i].x < collidedObstacle.x) {
                            this.enemies[i].x -= overlapX;
                        } else {
                            this.enemies[i].x += overlapX;
                        }
                    } else {
                        if (this.enemies[i].y < collidedObstacle.y) {
                            this.enemies[i].y -= overlapY;
                        } else {
                            this.enemies[i].y += overlapY;
                        }
                    }
                }
            }

            // 죽은 적 제거 (별의 소리 드롭)
            if (!this.enemies[i].active) {
                const enemy = this.enemies[i];

                // 별의 소리 드롭
                const starCount = enemy.getStarDropCount();
                for (let j = 0; j < starCount; j++) {
                    this.spawnStar(enemy.x, enemy.y);
                }

                // 보스 처치 시 BGM 정지
                if (enemy.type === 'boss' && this.isBossBGMPlaying) {
                    this.bossBGM.pause();
                    this.bossBGM.currentTime = 0;
                    this.isBossBGMPlaying = false;
                }

                // 2스테이지 보스(hive_boss) 처치 시 3스테이지로 진행
                if (enemy.type === 'hive_boss') {
                    console.log('2스테이지 보스 클리어! 3스테이지로 진행...');
                    setTimeout(() => {
                        this.nextStage();
                    }, 2000); // 2초 후 다음 스테이지
                }

                // 3스테이지 보스(stage3_boss) 처치 시 게임 클리어
                if (enemy.type === 'stage3_boss') {
                    console.log('최종 보스 클리어! 게임 클리어!');
                    setTimeout(() => {
                        this.allStagesCleared();
                    }, 3000); // 3초 후 게임 클리어 화면
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

        // 파티클 업데이트
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (!this.particles[i].active) {
                this.particles.splice(i, 1);
            }
        }

        // 포탈 업데이트 및 충돌 체크
        if (this.portal && this.portal.active) {
            this.portal.update(deltaTime);

            // 플레이어와 포탈 충돌 체크
            const portalBounds = this.portal.getBounds();
            const playerBounds = {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };

            if (checkCollision(playerBounds, portalBounds)) {
                console.log("포탈 진입!");
                this.portal.active = false;
                this.nextStage();
            }
        }

        // 제단 업데이트 및 상호작용
        if (this.altar && this.altar.active) {
            this.altar.update(deltaTime, this.player);

            // 상호작용 (Space 키)
            if (this.player.keys.space && !this.altar.used && this.altar.checkCollision(this.player)) {
                if (this.altar.interact(this.player)) {
                    // 효과음이나 파티클?
                    this.spawnParticles(this.altar.x, this.altar.y, '#ffff00', 20);
                }
            }
        }

        // 적을 모두 처치하면 문 열기
        if (this.room && this.room.hasEnemies && this.enemies.length === 0) {
            this.room.openAllDoors();

            // 던전 시스템: 방을 cleared로 표시
            if (this.dungeon && this.currentRoomId !== null) {
                const roomData = this.dungeon.rooms.get(this.currentRoomId);
                if (roomData) {
                    if (!roomData.cleared) {
                        roomData.cleared = true;

                        // 방 클리어 보상 (별의 소리 1~3개)
                        const rewardCount = Math.floor(Math.random() * 3) + 1;
                        for (let i = 0; i < rewardCount; i++) {
                            // 플레이어 주변에 드롭
                            this.spawnStar(this.player.x + (Math.random() - 0.5) * 50, this.player.y + (Math.random() - 0.5) * 50);
                        }

                        // 방 클리어 후 0.5초 동안 문 통과 불가
                        this.transitionCooldown = 500; // 0.5초
                    }

                    // 보스방 클리어 시 포탈 생성
                    if (roomData.type === 'boss' && this.currentRoomId === this.dungeon.bossRoom) {
                        if (!this.portal) {
                            this.onBossCleared();
                        }
                    }
                }
            }
        }

        // 아이템 업데이트
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].update(deltaTime);
            if (!this.items[i].active) {
                this.items.splice(i, 1);
            }
        }

        // 사용 아이템 효과 업데이트 (Slash, GifSlash)
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            // Slash와 GifSlash 모두 호환되도록 인자 전달
            this.activeItems[i].update(deltaTime, this.player.x, this.player.y, this.camera.x, this.camera.y);

            // 비활성 아이템 제거
            if (!this.activeItems[i].active) {
                // GifSlash의 경우 DOM 요소 제거는 내부에서 처리됨
                this.activeItems.splice(i, 1);
            } else {
                // 충돌 체크
                for (const enemy of this.enemies) {
                    if (this.activeItems[i].checkCollision(enemy)) {
                        // GifSlash의 경우 페이즈 기반 데미지
                        const currentDamage = this.activeItems[i].getDamage ? this.activeItems[i].getDamage() : this.activeItems[i].damage;

                        if (currentDamage > 0) {
                            enemy.takeDamage(currentDamage);

                            // GifSlash의 경우 현재 페이즈를 hasHit로 표시
                            if (this.activeItems[i].getCurrentPhase) {
                                const phase = this.activeItems[i].getCurrentPhase();
                                if (phase) {
                                    phase.hasHit = true;
                                }
                            } else {
                                // Slash의 경우 기존 방식
                                if (!this.activeItems[i].hitEnemies.includes(enemy)) {
                                    this.activeItems[i].hitEnemies.push(enemy);
                                }
                            }

                            // 타격 이펙트
                            this.spawnParticles(enemy.x, enemy.y, '#ff0000', 5);
                        }
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

        // 발사체 충돌 체크
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const projBounds = projectile.getBounds();

            if (projectile.isEnemy) {
                // 적 발사체 -> 플레이어 충돌
                if (checkCollision(projBounds, playerBounds)) {
                    if (this.player.takeDamage(projectile.damage)) {
                        // 피격 성공
                        if (this.player.health <= 0) {
                            this.gameOver();
                        }
                    }

                    // 소다맛 꼬미볼 효과 (적 속도 증가)
                    if (this.player.hasSodaKomibol && enemy.active && enemy.type !== 'boss') {
                        enemy.speedBoostTimer = 0.8; // 0.8초 동안 속도 증가
                    }

                    projectile.active = false;
                }
            } else {
                // 플레이어 발사체 -> 적 충돌
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (enemy.isSpawning) continue; // 소환 중인 적은 무시

                    const enemyBounds = enemy.getBounds();

                    if (checkCollision(projBounds, enemyBounds)) {
                        // 적이 데미지를 받음
                        enemy.takeDamage(projectile.damage);

                        // 오팔 총 효과 (타격 이펙트)
                        if (projectile.isOpal) {
                            this.spawnParticles(projectile.x, projectile.y, '#ccffff', 10);
                            this.spawnParticles(projectile.x, projectile.y, '#ffccff', 5);
                        }

                        // 발사체 제거
                        projectile.active = false;
                        break;
                    }
                }
            }
        }

        // 사용 아이템(베기) vs 적 충돌
        for (const item of this.activeItems) {
            if (item instanceof Slash && item.active) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (enemy.isSpawning) continue; // 소환 중인 적은 무시

                    // 이미 타격한 적은 제외해야 하지만, 
                    // 현재 구조상 매 프레임 체크하므로 넉백이나 무적시간으로 처리 필요
                    // 간단하게 적에게 무적 시간을 주거나, Slash 객체에 타격한 적 리스트를 관리해야 함.
                    // 여기서는 Slash가 지속되는 동안 계속 데미지를 주지 않도록
                    // 적에게 짧은 무적 시간을 부여하는 방식을 사용하는 것이 좋음 (Player.takeDamage처럼)
                    // 하지만 Enemy 클래스에 무적 로직이 없으므로, 
                    // Slash 객체에 'hitEnemies' 리스트를 추가하는 것이 안전함.

                    if (!item.hitEnemies) item.hitEnemies = [];

                    if (item.hitEnemies.includes(enemy)) continue;

                    if (item.checkCollision(enemy)) {
                        // 적이 데미지를 받음
                        if (enemy.takeDamage(item.damage)) {
                            // 처치 시
                            this.score += 10;
                            this.updateScore();
                        }
                        item.hitEnemies.push(enemy);

                        // 소다맛 꼬미볼 효과 (적 속도 증가)
                        if (this.player.hasSodaKomibol && enemy.active && enemy.type !== 'boss') {
                            enemy.speedBoostTimer = 0.8; // 0.8초 동안 속도 증가
                        }

                        // 넉백 효과 (보스 제외)
                        if (enemy.type !== 'boss') {
                            const dx = enemy.x - this.player.x;
                            const dy = enemy.y - this.player.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance > 0) {
                                const knockbackForce = 30; // 넉백 감소 (100 -> 30)
                                enemy.x += (dx / distance) * knockbackForce;
                                enemy.y += (dy / distance) * knockbackForce;
                            }
                        }
                    }
                }
            }
        }

        // 플레이어 vs 적 충돌
        for (const enemy of this.enemies) {
            // 소환 중인 적은 데미지를 주지 않음
            if (enemy.isSpawning) continue;

            const enemyBounds = enemy.getBounds();

            if (checkCollision(playerBounds, enemyBounds)) {
                // 플레이어가 데미지를 받음
                if (this.player.takeDamage(enemy.damage)) {
                    // 화면 흔들림 효과
                    this.shakeScreen(10, 0.3);

                    // 넉백 효과 (적 반대 방향으로 밀림)
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        const knockbackForce = 50;
                        this.player.x += (dx / distance) * knockbackForce;
                        this.player.y += (dy / distance) * knockbackForce;
                    }

                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        }

        // 플레이어 vs 아이템 충돌
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.active) continue; // 비활성 아이템 스킵

            const itemBounds = item.getBounds();

            if (checkCollision(playerBounds, itemBounds)) {
                // 가격이 있는 아이템 (상점)
                if (item.price > 0) {
                    // 포션은 체력이 최대일 때 구매 불가
                    if (item.type === 'potion' && this.player.health >= this.player.maxHealth) {
                        console.log('체력이 최대입니다! 포션을 구매할 수 없습니다.');
                        continue;
                    }

                    if (this.starCount >= item.price) {
                        // 구매 성공
                        this.starCount -= item.price;

                        // 아이템 정보 저장 (화면 표시용)
                        this.pickedItemName = item.name;
                        this.pickedItemDescription = item.description;
                        this.pickedItemImage = item.itemImage; // 이미지 추가
                        this.showItemPickup = true;
                        this.itemPickupTimer = 0;

                        // 아이템 효과 적용
                        item.apply(this.player);
                        this.collectedItems.add(item.type);
                        console.log(`${item.name} 구매 완료! 잔액: ${this.starCount}`);
                    } else {
                        // 구매 실패 (돈 부족)
                        // TODO: 돈 부족 메시지 표시?
                        console.log('별의 소리가 부족합니다!'); // 로그 스팸 방지
                    }
                } else {
                    // 일반 아이템 획득
                    // 포션은 체력이 닳았을 때만 획득 가능
                    if (item.type === 'potion' && this.player.health >= this.player.maxHealth) {
                        continue; // 체력이 풀이면 포션 획득 불가
                    }

                    this.pickedItemName = item.name;
                    this.pickedItemDescription = item.description;
                    this.pickedItemImage = item.itemImage; // 이미지 추가
                    this.showItemPickup = true;
                    this.itemPickupTimer = 0;

                    // 아이템 효과 적용
                    item.apply(this.player);
                    this.updateScore(5); // 아이템 획득 점수

                    // 획득한 아이템 기록
                    this.collectedItems.add(item.type);

                    // 아이템 비활성화 (제거하지 않음)
                    item.active = false;
                }
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
        // 화면 클리어
        this.clear();

        // 카메라 적용 (흔들림 포함)
        this.ctx.save();
        this.ctx.translate(-this.camera.x + this.screenShake.x, -this.camera.y + this.screenShake.y);

        // 방 그리기
        if (this.room) {
            this.room.draw(this.ctx, deltaTime);

            // 상점 주인 그리기 (상점일 때만)
            if (this.dungeon && this.currentRoomId !== null) {
                const roomData = this.dungeon.rooms.get(this.currentRoomId);
                if (roomData && roomData.type === 'shop') {
                    this.room.drawShopkeeper(this.ctx, deltaTime);
                }
            }
        }

        // 아이템 그리기
        for (const item of this.items) {
            item.draw(this.ctx);
        }

        // 별의 소리 그리기
        for (const star of this.stars) {
            star.draw(this.ctx);
        }

        // 파티클 그리기
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }

        // 포탈 그리기
        if (this.portal && this.portal.active) {
            this.portal.draw(this.ctx);
        }

        // 제단 그리기
        if (this.altar && this.altar.active) {
            this.altar.draw(this.ctx);
        }

        // 장애물 그리기 (플레이어보다 뒤에 있는 것)
        if (this.room) {
            this.room.drawObstacles(this.ctx);
        }

        // 적 그리기
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // 플레이어 그리기
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // 발사체 그리기
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }

        // 사용 아이템 효과 업데이트
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            // Slash와 GifSlash 모두 호환되도록 인자 전달
            // Slash: update(deltaTime, playerX, playerY)
            // GifSlash: update(deltaTime, playerX, playerY, cameraX, cameraY)
            this.activeItems[i].update(deltaTime, this.player.x, this.player.y, this.camera.x, this.camera.y);

            // 비활성 아이템 제거
            if (!this.activeItems[i].active) {
                // GifSlash의 경우 DOM 요소 제거는 내부에서 처리됨 (active=false 될 때)
                this.activeItems.splice(i, 1);
            } else {
                // 충돌 체크
                for (const enemy of this.enemies) {
                    if (this.activeItems[i].checkCollision(enemy)) {
                        // 이미 타격한 적은 제외 (Slash 클래스에 hitEnemies 있음, GifSlash에도 추가 필요)
                        if (!this.activeItems[i].hitEnemies.includes(enemy)) {
                            enemy.takeDamage(this.activeItems[i].damage);
                            this.activeItems[i].hitEnemies.push(enemy);

                            // 타격 이펙트?
                            this.spawnParticles(enemy.x, enemy.y, '#ff0000', 5);
                        }
                    }
                }
            }
        }

        // 카메라 복구
        this.ctx.restore();

        // UI 그리기 (카메라 영향 안 받음)
        // 보스 찾기
        const boss = this.enemies.find(e => e.type === 'boss');
        this.ui.draw(this.ctx, this.player, this.starCount, boss);

        // 미니맵 그리기
        if (this.minimap) {
            this.minimap.draw(this.ctx);
        }

        // 스테이지 텍스트
        if (this.showStageText) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.7, this.stageTextTimer * 2)})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.save();
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`STAGE ${this.level}`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.restore();
        }

        // 아이템 획득 텍스트
        if (this.showItemPickup) {
            const alpha = Math.min(1, (this.itemPickupDuration - this.itemPickupTimer) * 2);

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            if (this.ctx.roundRect) {
                this.ctx.beginPath();
                this.ctx.roundRect(this.canvas.width / 2 - 200, 100, 400, 80, 10);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(this.canvas.width / 2 - 200, 100, 400, 80);
            }

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';

            // 아이템 이미지 표시
            if (this.pickedItemImage && this.pickedItemImage.complete) {
                const imgSize = 60;
                this.ctx.drawImage( // Changed ctx to this.ctx
                    this.pickedItemImage,
                    this.canvas.width / 2 - imgSize / 2,
                    110,
                    imgSize,
                    imgSize
                );
            }

            // 아이템 이름 (이미지 아래)
            this.ctx.fillText(`${this.pickedItemName}`, this.canvas.width / 2, 185);

            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#ccc';
            this.ctx.fillText(this.pickedItemDescription, this.canvas.width / 2, 205);
            this.ctx.restore();
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

        // 보스 인트로 화면 (최상단)
        if (this.bossIntro.active && this.ui) {
            this.ui.drawBossIntro(this.ctx, this.bossIntro);
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

    // 모드 선택 화면 그리기
    drawModeSelection() {
        // 배경
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 제목
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('모드 선택', this.canvas.width / 2, 120);

        // 앙코 모드 버튼
        const angkoX = this.canvas.width / 2 - 180;
        const angkoY = 250;
        const buttonWidth = 150;
        const buttonHeight = 200;

        // 앙코 버튼 배경
        this.ctx.fillStyle = '#ff6b9d';
        this.ctx.fillRect(angkoX, angkoY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(angkoX, angkoY, buttonWidth, buttonHeight);

        // 앙코 텍스트
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText('앙코 모드', angkoX + buttonWidth / 2, angkoY + 40);

        this.ctx.font = '16px Arial';
        this.ctx.fillText('(쉬움)', angkoX + buttonWidth / 2, angkoY + 70);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('1스테이지', angkoX + buttonWidth / 2, angkoY + 110);
        this.ctx.fillText('시작 시', angkoX + buttonWidth / 2, angkoY + 130);
        this.ctx.fillText('무라사마', angkoX + buttonWidth / 2, angkoY + 150);
        this.ctx.fillText('제공', angkoX + buttonWidth / 2, angkoY + 170);

        // 임딱 모드 버튼
        const imdakX = this.canvas.width / 2 + 30;
        const imdakY = 250;

        // 임딱 버튼 배경
        this.ctx.fillStyle = '#c44569';
        this.ctx.fillRect(imdakX, imdakY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(imdakX, imdakY, buttonWidth, buttonHeight);

        // 임딱 텍스트
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText('임딱 모드', imdakX + buttonWidth / 2, imdakY + 40);

        this.ctx.font = '16px Arial';
        this.ctx.fillText('(어려움)', imdakX + buttonWidth / 2, imdakY + 70);

        this.ctx.font = '14px Arial';
        this.ctx.fillText('2스테이지', imdakX + buttonWidth / 2, imdakY + 110);
        this.ctx.fillText('부터', imdakX + buttonWidth / 2, imdakY + 130);
        this.ctx.fillText('상점/보물방', imdakX + buttonWidth / 2, imdakY + 150);
        this.ctx.fillText('에서만 획득', imdakX + buttonWidth / 2, imdakY + 170);

        // 안내 텍스트
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('모드를 선택하세요', this.canvas.width / 2, 500);
    }

    // 모드 선택 처리
    handleModeSelection(clickX, clickY) {
        const angkoX = this.canvas.width / 2 - 180;
        const angkoY = 250;
        const imdakX = this.canvas.width / 2 + 30;
        const imdakY = 250;
        const buttonWidth = 150;
        const buttonHeight = 200;

        // 앙코 모드 클릭
        if (clickX >= angkoX && clickX <= angkoX + buttonWidth &&
            clickY >= angkoY && clickY <= angkoY + buttonHeight) {
            this.gameMode = 'angko';
            this.showModeSelection = false;
            this.startGame();
        }

        // 임딱 모드 클릭
        if (clickX >= imdakX && clickX <= imdakX + buttonWidth &&
            clickY >= imdakY && clickY <= imdakY + buttonHeight) {
            this.gameMode = 'imdak';
            this.showModeSelection = false;
            this.startGame();
        }
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

    // 화면 흔들림 시작
    shakeScreen(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
    }

    // 파티클 생성
    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const speed = 50 + Math.random() * 100;
            const life = 0.3 + Math.random() * 0.4;
            const size = 2 + Math.random() * 3;
            this.particles.push(new Particle(x, y, color, speed, life, size));
        }
    }
}


