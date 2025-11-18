// 미니맵 클래스
class Minimap {
    constructor(dungeon, canvasWidth) {
        this.dungeon = dungeon;
        this.cellSize = 8; // 각 방의 크기 (픽셀)
        this.padding = 10;

        // 우측 상단에 배치
        const mapWidth = this.dungeon.gridWidth * this.cellSize + 10;
        this.x = canvasWidth - mapWidth - this.padding;
        this.y = this.padding;

        this.currentRoom = dungeon.startRoom;
    }

    // 현재 방 업데이트
    setCurrentRoom(cellId) {
        this.currentRoom = cellId;
        const room = this.dungeon.rooms.get(cellId);
        if (room) {
            room.visited = true;
        }
    }

    // 미니맵 그리기
    draw(ctx) {
        const startX = this.x;
        const startY = this.y;

        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            startX - 5,
            startY - 5,
            this.dungeon.gridWidth * this.cellSize + 10,
            this.dungeon.gridHeight * this.cellSize + 10
        );

        // 방문한 방만 그리기
        for (const [cellId, room] of this.dungeon.rooms) {
            if (!room.visited) continue;

            const coords = this.cellToCoords(cellId);
            const x = startX + coords.x * this.cellSize;
            const y = startY + coords.y * this.cellSize;

            // 방 색상 결정
            let color = '#888'; // 일반 방
            if (cellId === this.currentRoom) {
                color = '#ffff00'; // 현재 방 (노란색)
            } else if (room.type === 'boss') {
                color = '#ff0000'; // 보스방 (빨간색)
            } else if (room.type === 'treasure') {
                color = '#ffa500'; // 보물방 (주황색)
            } else if (room.type === 'shop') {
                color = '#00ff00'; // 상점 (초록색)
            } else if (room.type === 'start') {
                color = '#0088ff'; // 시작방 (파란색)
            } else if (room.cleared) {
                color = '#555'; // 클리어한 방 (어두운 회색)
            }

            // 방 그리기
            ctx.fillStyle = color;
            ctx.fillRect(x, y, this.cellSize - 1, this.cellSize - 1);

            // 문 그리기 (연결된 이웃)
            ctx.fillStyle = color;
            for (const neighborId of room.neighbors) {
                const neighbor = this.dungeon.rooms.get(neighborId);
                if (!neighbor || !neighbor.visited) continue;

                const neighborCoords = this.cellToCoords(neighborId);
                const dx = neighborCoords.x - coords.x;
                const dy = neighborCoords.y - coords.y;

                // 문 위치 계산
                if (dx === 1) { // 오른쪽
                    ctx.fillRect(x + this.cellSize - 1, y + 2, 2, this.cellSize - 5);
                } else if (dx === -1) { // 왼쪽
                    ctx.fillRect(x - 1, y + 2, 2, this.cellSize - 5);
                } else if (dy === 1) { // 아래
                    ctx.fillRect(x + 2, y + this.cellSize - 1, this.cellSize - 5, 2);
                } else if (dy === -1) { // 위
                    ctx.fillRect(x + 2, y - 1, this.cellSize - 5, 2);
                }
            }
        }

        // 테두리
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            startX - 5,
            startY - 5,
            this.dungeon.gridWidth * this.cellSize + 10,
            this.dungeon.gridHeight * this.cellSize + 10
        );
    }

    // 셀 좌표 변환
    cellToCoords(cellId) {
        return {
            x: cellId % 10,
            y: Math.floor(cellId / 10)
        };
    }
}
