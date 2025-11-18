// 방 클래스
class Room {
    constructor(canvasWidth, canvasHeight, hasEnemies = false) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.hasEnemies = hasEnemies;

        // 타일 설정
        this.tileSize = 48;
        this.wallThickness = this.tileSize;
        this.doorWidth = 80;

        // 방 경계
        this.bounds = {
            left: this.wallThickness,
            right: canvasWidth - this.wallThickness,
            top: this.wallThickness,
            bottom: canvasHeight - this.wallThickness
        };

        // 문 생성 (4방향)
        this.doors = this.createDoors();

        // 벽 목록 (문 구멍 포함)
        this.walls = this.createWalls();

        // 장애물 목록
        this.obstacles = [];
    }

    // 4방향 문 생성
    createDoors() {
        return {
            top: new Door('top', this.canvasWidth, this.canvasHeight),
            bottom: new Door('bottom', this.canvasWidth, this.canvasHeight),
            left: new Door('left', this.canvasWidth, this.canvasHeight),
            right: new Door('right', this.canvasWidth, this.canvasHeight)
        };
    }

    // 이웃 방향 설정 (던전 시스템용)
    setNeighbors(neighborDirections) {
        // 모든 문 비활성화
        for (const direction in this.doors) {
            this.doors[direction].active = false;
        }

        // 이웃이 있는 방향만 활성화
        for (const direction of neighborDirections) {
            if (this.doors[direction]) {
                this.doors[direction].active = true;
            }
        }
    }

    // 보물방 문으로 설정
    setTreasureDoor(direction) {
        if (this.doors[direction]) {
            this.doors[direction].isTreasureDoor = true;
        }
    }

    // 모든 문 열기
    openAllDoors() {
        for (const direction in this.doors) {
            if (this.doors[direction].active) {
                this.doors[direction].open();
            }
        }
    }

    // 모든 문 닫기
    closeAllDoors() {
        for (const direction in this.doors) {
            if (this.doors[direction].active) {
                this.doors[direction].close();
            }
        }
    }

    // 벽 생성 (문 구멍 포함)
    createWalls() {
        const walls = [];
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // 상단 벽 (좌, 우 두 부분으로 나눔 - 중앙에 문)
        walls.push({
            x: 0,
            y: 0,
            width: centerX - this.doorWidth / 2,
            height: this.wallThickness
        });
        walls.push({
            x: centerX + this.doorWidth / 2,
            y: 0,
            width: centerX - this.doorWidth / 2,
            height: this.wallThickness
        });

        // 하단 벽 (좌, 우 두 부분으로 나눔 - 중앙에 문)
        walls.push({
            x: 0,
            y: this.canvasHeight - this.wallThickness,
            width: centerX - this.doorWidth / 2,
            height: this.wallThickness
        });
        walls.push({
            x: centerX + this.doorWidth / 2,
            y: this.canvasHeight - this.wallThickness,
            width: centerX - this.doorWidth / 2,
            height: this.wallThickness
        });

        // 좌측 벽 (상, 하 두 부분으로 나눔 - 중앙에 문)
        walls.push({
            x: 0,
            y: 0,
            width: this.wallThickness,
            height: centerY - this.doorWidth / 2
        });
        walls.push({
            x: 0,
            y: centerY + this.doorWidth / 2,
            width: this.wallThickness,
            height: centerY - this.doorWidth / 2
        });

        // 우측 벽 (상, 하 두 부분으로 나눔 - 중앙에 문)
        walls.push({
            x: this.canvasWidth - this.wallThickness,
            y: 0,
            width: this.wallThickness,
            height: centerY - this.doorWidth / 2
        });
        walls.push({
            x: this.canvasWidth - this.wallThickness,
            y: centerY + this.doorWidth / 2,
            width: this.wallThickness,
            height: centerY - this.doorWidth / 2
        });

        return walls;
    }

    // 엔티티가 벽과 충돌하는지 확인하고 위치 조정
    constrainEntity(entity) {
        const halfWidth = entity.width / 2;
        const halfHeight = entity.height / 2;

        // 경계 제한
        entity.x = Math.max(this.bounds.left + halfWidth,
                           Math.min(this.bounds.right - halfWidth, entity.x));
        entity.y = Math.max(this.bounds.top + halfHeight,
                           Math.min(this.bounds.bottom - halfHeight, entity.y));
    }

    // 발사체가 벽과 충돌하는지 확인
    checkProjectileWallCollision(projectile) {
        if (projectile.x < this.bounds.left ||
            projectile.x > this.bounds.right ||
            projectile.y < this.bounds.top ||
            projectile.y > this.bounds.bottom) {
            return true;
        }
        return false;
    }

    // 문과의 충돌 체크
    checkDoorCollision(player) {
        for (const direction in this.doors) {
            const door = this.doors[direction];
            if (door.checkCollision(player)) {
                return direction;
            }
        }
        return null;
    }

    // 방 그리기
    draw(ctx, deltaTime = 0) {
        // 바닥
        ctx.fillStyle = '#333';
        ctx.fillRect(
            this.bounds.left,
            this.bounds.top,
            this.bounds.right - this.bounds.left,
            this.bounds.bottom - this.bounds.top
        );

        // 벽 그리기
        for (const wall of this.walls) {
            // 벽 베이스
            ctx.fillStyle = '#666';
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

            // 벽 테두리 (입체감)
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

            // 그림자 효과
            ctx.fillStyle = '#444';
            ctx.fillRect(wall.x + 4, wall.y + 4, wall.width - 8, wall.height - 8);
        }

        // 문 그리기
        for (const direction in this.doors) {
            this.doors[direction].draw(ctx, deltaTime);
        }

        // 타일 그리드 (선택사항 - 바닥에 격자무늬)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;

        // 세로선
        for (let x = this.bounds.left; x <= this.bounds.right; x += this.tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, this.bounds.top);
            ctx.lineTo(x, this.bounds.bottom);
            ctx.stroke();
        }

        // 가로선
        for (let y = this.bounds.top; y <= this.bounds.bottom; y += this.tileSize) {
            ctx.beginPath();
            ctx.moveTo(this.bounds.left, y);
            ctx.lineTo(this.bounds.right, y);
            ctx.stroke();
        }
    }

    // 장애물 생성 (아이작 스타일)
    generateObstacles() {
        this.obstacles = [];

        // 장애물 개수 결정 (3~8개)
        const obstacleCount = Math.floor(Math.random() * 6) + 3;

        // 문 근처 금지 구역 설정
        const doorSafeZone = this.tileSize * 2.5; // 문에서 2.5타일 거리

        // 중앙 통로 확보 (가로/세로 중앙 ±1타일은 비워둠)
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const centerSafeZone = this.tileSize * 1.5;

        // 타입별 확률 (바위 50%, 구멍 30%, 거미줄 15%, 가시 5%)
        const typeWeights = [
            { type: 'rock', weight: 50 },
            { type: 'pit', weight: 30 },
            { type: 'cobweb', weight: 15 },
            { type: 'spike', weight: 5 }
        ];

        let attempts = 0;
        const maxAttempts = 100;

        while (this.obstacles.length < obstacleCount && attempts < maxAttempts) {
            attempts++;

            // 랜덤 위치 생성 (타일 그리드에 맞춤)
            const gridX = Math.floor(Math.random() * 12) + 2; // 2~13
            const gridY = Math.floor(Math.random() * 8) + 2;  // 2~9

            const x = this.bounds.left + gridX * this.tileSize;
            const y = this.bounds.top + gridY * this.tileSize;

            // 문 근처 체크
            const nearTopDoor = y < this.bounds.top + doorSafeZone;
            const nearBottomDoor = y > this.bounds.bottom - doorSafeZone;
            const nearLeftDoor = x < this.bounds.left + doorSafeZone;
            const nearRightDoor = x > this.bounds.right - doorSafeZone;

            if (nearTopDoor || nearBottomDoor || nearLeftDoor || nearRightDoor) {
                continue;
            }

            // 중앙 통로 체크
            const nearCenterX = Math.abs(x - centerX) < centerSafeZone;
            const nearCenterY = Math.abs(y - centerY) < centerSafeZone;

            if (nearCenterX && nearCenterY) {
                continue;
            }

            // 다른 장애물과 겹치는지 체크
            let overlaps = false;
            for (const obstacle of this.obstacles) {
                const dx = Math.abs(obstacle.x - x);
                const dy = Math.abs(obstacle.y - y);
                if (dx < this.tileSize && dy < this.tileSize) {
                    overlaps = true;
                    break;
                }
            }

            if (overlaps) {
                continue;
            }

            // 타입 결정 (가중치 기반)
            const random = Math.random() * 100;
            let cumulativeWeight = 0;
            let selectedType = 'rock';

            for (const typeWeight of typeWeights) {
                cumulativeWeight += typeWeight.weight;
                if (random <= cumulativeWeight) {
                    selectedType = typeWeight.type;
                    break;
                }
            }

            // 장애물 생성
            const obstacle = new Obstacle(x, y, selectedType);
            this.obstacles.push(obstacle);
        }
    }

    // 장애물 업데이트
    updateObstacles(deltaTime) {
        for (const obstacle of this.obstacles) {
            obstacle.update(deltaTime);
        }
    }

    // 장애물 그리기
    drawObstacles(ctx) {
        for (const obstacle of this.obstacles) {
            obstacle.draw(ctx);
        }
    }

    // 장애물과의 충돌 체크 (엔티티용)
    checkObstacleCollision(entity) {
        const entityBounds = entity.getBounds();

        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;
            if (!obstacle.blocksMovement) continue;

            const obstacleBounds = obstacle.getBounds();

            // AABB 충돌 체크
            if (entityBounds.x < obstacleBounds.x + obstacleBounds.width &&
                entityBounds.x + entityBounds.width > obstacleBounds.x &&
                entityBounds.y < obstacleBounds.y + obstacleBounds.height &&
                entityBounds.y + entityBounds.height > obstacleBounds.y) {
                return obstacle;
            }
        }

        return null;
    }

    // 장애물과 발사체 충돌 체크
    checkObstacleProjectileCollision(projectile) {
        const projectileBounds = projectile.getBounds();

        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;
            if (!obstacle.blocksProjectiles) continue;

            const obstacleBounds = obstacle.getBounds();

            // AABB 충돌 체크
            if (projectileBounds.x < obstacleBounds.x + obstacleBounds.width &&
                projectileBounds.x + projectileBounds.width > obstacleBounds.x &&
                projectileBounds.y < obstacleBounds.y + obstacleBounds.height &&
                projectileBounds.y + projectileBounds.height > obstacleBounds.y) {
                return true;
            }
        }

        return false;
    }
}

