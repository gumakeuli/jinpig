// 방 클래스
class Room {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // 타일 설정
        this.tileSize = 48;
        this.wallThickness = this.tileSize;

        // 방 경계
        this.bounds = {
            left: this.wallThickness,
            right: canvasWidth - this.wallThickness,
            top: this.wallThickness,
            bottom: canvasHeight - this.wallThickness
        };

        // 벽 목록
        this.walls = this.createWalls();
    }

    // 벽 생성
    createWalls() {
        const walls = [];

        // 상단 벽
        walls.push({
            x: 0,
            y: 0,
            width: this.canvasWidth,
            height: this.wallThickness
        });

        // 하단 벽
        walls.push({
            x: 0,
            y: this.canvasHeight - this.wallThickness,
            width: this.canvasWidth,
            height: this.wallThickness
        });

        // 좌측 벽
        walls.push({
            x: 0,
            y: 0,
            width: this.wallThickness,
            height: this.canvasHeight
        });

        // 우측 벽
        walls.push({
            x: this.canvasWidth - this.wallThickness,
            y: 0,
            width: this.wallThickness,
            height: this.canvasHeight
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
