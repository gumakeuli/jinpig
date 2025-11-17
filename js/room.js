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
    draw(ctx) {
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
            this.doors[direction].draw(ctx);
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
}
