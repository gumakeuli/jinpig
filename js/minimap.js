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
        this.cellSize = 14; // 크기 증가

        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            startX - 5,
            startY - 5,
            this.dungeon.gridWidth * this.cellSize + 10,
            this.dungeon.gridHeight * this.cellSize + 10
        );

        // 모든 방 순회
        for (const [cellId, room] of this.dungeon.rooms) {
            // 방문하지 않았고, 방문한 방의 이웃도 아니면 스킵
            if (!room.visited) {
                let isNeighbor = false;
                for (const neighborId of room.neighbors) {
                    const neighbor = this.dungeon.rooms.get(neighborId);
                    if (neighbor && neighbor.visited) {
                        isNeighbor = true;
                        break;
                    }
                }
                if (!isNeighbor) continue;
            }

            const coords = this.cellToCoords(cellId);
            const x = startX + coords.x * this.cellSize;
            const y = startY + coords.y * this.cellSize;

            // 방 색상 결정
            let color = '#444'; // 미방문 이웃 (어두운 회색)

            if (room.visited) {
                color = '#888'; // 일반 방
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
                } else if (room.type === 'altar') {
                    color = '#9933ff'; // 제단방 (보라색)
                } else if (room.cleared) {
                    color = '#666'; // 클리어한 방
                }
            } else {
                // 미방문이지만 아이콘 힌트 (선택 사항)
                if (room.type === 'boss') color = '#500';
                else if (room.type === 'shop') color = '#050';
                else if (room.type === 'treasure') color = '#530';
                else if (room.type === 'altar') color = '#315';
            }

            // 방 그리기
            ctx.fillStyle = color;
            ctx.fillRect(x, y, this.cellSize - 1, this.cellSize - 1);

            // 현재 위치 표시 (플레이어 아이콘)
            if (cellId === this.currentRoom) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // 문 그리기 (연결된 이웃)
            if (room.visited) {
                ctx.fillStyle = color;
                for (const neighborId of room.neighbors) {
                    const neighbor = this.dungeon.rooms.get(neighborId);
                    // 이웃이 존재하고 (방문했거나 미방문 이웃 표시 중이면)
                    if (!neighbor) continue;

                    const neighborCoords = this.cellToCoords(neighborId);
                    const dx = neighborCoords.x - coords.x;
                    const dy = neighborCoords.y - coords.y;

                    // 문 위치 계산
                    if (dx === 1) { // 오른쪽
                        ctx.fillRect(x + this.cellSize - 1, y + 4, 2, this.cellSize - 9);
                    } else if (dx === -1) { // 왼쪽
                        ctx.fillRect(x - 1, y + 4, 2, this.cellSize - 9);
                    } else if (dy === 1) { // 아래
                        ctx.fillRect(x + 4, y + this.cellSize - 1, this.cellSize - 9, 2);
                    } else if (dy === -1) { // 위
                        ctx.fillRect(x + 4, y - 1, this.cellSize - 9, 2);
                    }
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
