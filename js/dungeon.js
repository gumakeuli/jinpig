// 던전 생성기 - 아이작 스타일 BFS 알고리즘
class DungeonGenerator {
    constructor(level = 1) {
        this.level = level;
        this.gridWidth = 9;
        this.gridHeight = 8;

        // 그리드: 0-71 (x는 1의 자리, y는 10의 자리)
        this.grid = new Array(this.gridWidth * this.gridHeight).fill(null);

        // 방 정보
        this.rooms = new Map(); // cellId -> RoomData
        this.startRoom = 35; // 중앙 하단 (x=5, y=3)
        this.bossRoom = null;
        this.shopRoom = null;
        this.treasureRoom = null;

        // 방 목록
        this.endRooms = []; // 막다른 방 (이웃이 1개)
        this.normalRooms = [];
    }

    // 던전 생성
    generate() {
        // Phase 1: 플로어 플랜 생성 (BFS)
        this.generateFloorplan();

        // Phase 2: 특수 방 배치
        this.placeSpecialRooms();

        // Phase 3: 일반 방 타입 지정
        this.assignNormalRooms();

        return {
            rooms: this.rooms,
            startRoom: this.startRoom,
            bossRoom: this.bossRoom,
            shopRoom: this.shopRoom,
            treasureRoom: this.treasureRoom,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight
        };
    }

    // Phase 1: BFS로 플로어 플랜 생성
    generateFloorplan() {
        // 방 개수 계산: 7~10개 랜덤
        const roomCount = Math.floor(Math.random() * 4) + 7; // 7, 8, 9, 10
        const maxRooms = roomCount;

        // 시작 방 추가
        const queue = [this.startRoom];
        this.grid[this.startRoom] = { type: 'start', neighbors: [] };
        this.rooms.set(this.startRoom, {
            cellId: this.startRoom,
            type: 'start',
            neighbors: [],
            cleared: false,
            visited: false
        });

        let roomsPlaced = 1;

        // BFS 확장
        while (queue.length > 0 && roomsPlaced < maxRooms) {
            const current = queue.shift();
            const neighbors = this.getCardinalNeighbors(current);

            for (const neighborId of neighbors) {
                // 이미 방이 있으면 스킵
                if (this.grid[neighborId] !== null) continue;

                // 이웃이 2개 이상이면 스킵 (루프 방지)
                if (this.countFilledNeighbors(neighborId) >= 2) continue;

                // 50% 확률로 방 배치
                if (Math.random() < 0.5) {
                    this.grid[neighborId] = { type: 'normal', neighbors: [] };
                    this.rooms.set(neighborId, {
                        cellId: neighborId,
                        type: 'normal',
                        neighbors: [],
                        cleared: false,
                        visited: false
                    });
                    queue.push(neighborId);
                    roomsPlaced++;

                    if (roomsPlaced >= maxRooms) break;
                }
            }
        }

        // 이웃 관계 설정 및 막다른 방 찾기
        this.updateNeighbors();
    }

    // 이웃 셀 가져오기 (상하좌우)
    getCardinalNeighbors(cellId) {
        const neighbors = [];
        const x = cellId % 10;
        const y = Math.floor(cellId / 10);

        // 상 (y-1)
        if (y > 0) neighbors.push(cellId - 10);
        // 하 (y+1)
        if (y < this.gridHeight - 1) neighbors.push(cellId + 10);
        // 좌 (x-1)
        if (x > 0) neighbors.push(cellId - 1);
        // 우 (x+1)
        if (x < this.gridWidth - 1) neighbors.push(cellId + 1);

        return neighbors;
    }

    // 채워진 이웃 개수 세기
    countFilledNeighbors(cellId) {
        const neighbors = this.getCardinalNeighbors(cellId);
        return neighbors.filter(id => this.grid[id] !== null).length;
    }

    // 이웃 관계 업데이트
    updateNeighbors() {
        for (const [cellId, room] of this.rooms) {
            const neighbors = this.getCardinalNeighbors(cellId);
            const filledNeighbors = neighbors.filter(id => this.grid[id] !== null);

            room.neighbors = filledNeighbors;

            // 막다른 방 (이웃이 1개)
            if (filledNeighbors.length === 1 && room.type === 'normal') {
                this.endRooms.push(cellId);
            } else if (room.type === 'normal') {
                this.normalRooms.push(cellId);
            }
        }
    }

    // 거리 계산 (BFS)
    calculateDistances() {
        const distances = new Map();
        const queue = [{ id: this.startRoom, dist: 0 }];
        distances.set(this.startRoom, 0);

        while (queue.length > 0) {
            const { id, dist } = queue.shift();
            const room = this.rooms.get(id);

            if (room) {
                for (const neighborId of room.neighbors) {
                    if (!distances.has(neighborId)) {
                        distances.set(neighborId, dist + 1);
                        queue.push({ id: neighborId, dist: dist + 1 });
                    }
                }
            }
        }
        return distances;
    }

    // Phase 2: 특수 방 배치
    placeSpecialRooms() {
        const distances = this.calculateDistances();

        // 보스방: 시작점에서 가장 먼 방 (최소 거리 2 이상)
        // 2스테이지는 보스방 없음
        if (this.level !== 2) {
            // 1. 막다른 방(endRooms) 중에서 가장 먼 것 찾기
            let bossCandidates = this.endRooms.filter(id => distances.get(id) > 1);

            // 2. 만약 적절한 막다른 방이 없으면, 전체 방 중에서 가장 먼 것 찾기
            if (bossCandidates.length === 0) {
                const allRooms = Array.from(this.rooms.keys());
                bossCandidates = allRooms.filter(id => distances.get(id) > 1);
            }

            // 거리순 내림차순 정렬
            bossCandidates.sort((a, b) => distances.get(b) - distances.get(a));

            if (bossCandidates.length > 0) {
                this.bossRoom = bossCandidates[0];
                const room = this.rooms.get(this.bossRoom);
                room.type = 'boss';
                this.grid[this.bossRoom].type = 'boss';

                // 보스방은 endRooms에서 제거 (중복 방지)
                const index = this.endRooms.indexOf(this.bossRoom);
                if (index !== -1) {
                    this.endRooms.splice(index, 1);
                }
            }
        }

        // 보물방: 시작 방의 이웃 중 하나를 보물방으로 지정 (테스트용)
        const startNode = this.rooms.get(this.startRoom);
        if (startNode && startNode.neighbors.length > 0) {
            // 랜덤하게 이웃 선택
            const neighborId = startNode.neighbors[Math.floor(Math.random() * startNode.neighbors.length)];
            // 보스방이 아닌 경우에만
            if (neighborId !== this.bossRoom) {
                this.treasureRoom = neighborId;

                const room = this.rooms.get(this.treasureRoom);
                room.type = 'treasure';
                this.grid[this.treasureRoom].type = 'treasure';

                // 혹시 이 방이 endRooms에 있었다면 제거 (중복 방지)
                const endRoomIndex = this.endRooms.indexOf(neighborId);
                if (endRoomIndex !== -1) {
                    this.endRooms.splice(endRoomIndex, 1);
                }
            }
        }

        // 보물방이 아직 설정되지 않았다면 (시작방 이웃이 모두 보스방이거나 등등)
        if (!this.treasureRoom && this.endRooms.length > 0) {
            // 남은 막다른 방 중 하나 선택
            const index = Math.floor(Math.random() * this.endRooms.length);
            this.treasureRoom = this.endRooms[index];
            const room = this.rooms.get(this.treasureRoom);
            room.type = 'treasure';
            this.grid[this.treasureRoom].type = 'treasure';
            this.endRooms.splice(index, 1);
        }

        // 상점: 시작 방의 이웃 중 보물방/보스방이 아닌 곳에 배치
        if (startNode && startNode.neighbors.length > 0) {
            // 보물방, 보스방이 아닌 이웃 찾기
            const availableNeighbors = startNode.neighbors.filter(id => id !== this.treasureRoom && id !== this.bossRoom);

            if (availableNeighbors.length > 0) {
                const neighborId = availableNeighbors[Math.floor(Math.random() * availableNeighbors.length)];
                this.shopRoom = neighborId;

                const room = this.rooms.get(this.shopRoom);
                room.type = 'shop';
                this.grid[this.shopRoom].type = 'shop';

                // endRooms 정리
                const endRoomIndex = this.endRooms.indexOf(neighborId);
                if (endRoomIndex !== -1) {
                    this.endRooms.splice(endRoomIndex, 1);
                }
            }
        }

        // 상점이 아직 설정되지 않았다면
        if (!this.shopRoom && this.endRooms.length > 0) {
            // 남은 막다른 방 중 하나 선택
            const index = Math.floor(Math.random() * this.endRooms.length);
            this.shopRoom = this.endRooms[index];
            const room = this.rooms.get(this.shopRoom);
            room.type = 'shop';
            this.grid[this.shopRoom].type = 'shop';
            this.endRooms.splice(index, 1);
        }

        // 제단(석상) 방: 남은 막다른 방이 있으면 배치, 없으면 랜덤 방
        if (this.endRooms.length > 0) {
            const index = Math.floor(Math.random() * this.endRooms.length);
            this.altarRoom = this.endRooms[index];
            const room = this.rooms.get(this.altarRoom);
            room.type = 'altar';
            this.grid[this.altarRoom].type = 'altar';
            this.endRooms.splice(index, 1);
        } else {
            // 막다른 방이 없으면 일반 방 중에서 선택 (start, boss, treasure, shop 제외)
            const availableRooms = Array.from(this.rooms.keys()).filter(id =>
                id !== this.startRoom &&
                id !== this.bossRoom &&
                id !== this.treasureRoom &&
                id !== this.shopRoom
            );

            if (availableRooms.length > 0) {
                const index = Math.floor(Math.random() * availableRooms.length);
                this.altarRoom = availableRooms[index];
                const room = this.rooms.get(this.altarRoom);
                room.type = 'altar';
                this.grid[this.altarRoom].type = 'altar';
            }
        }
    }

    // Phase 3: 일반 방 타입 지정
    assignNormalRooms() {
        for (const [cellId, room] of this.rooms) {
            if (room.type === 'normal') {
                // 레벨에 따라 난이도 조정 가능
                room.difficulty = this.level > 2 ? 'hard' : (this.level > 1 ? 'medium' : 'easy');
            }
        }
    }

    // 셀 좌표 변환
    cellToCoords(cellId) {
        return {
            x: cellId % 10,
            y: Math.floor(cellId / 10)
        };
    }

    coordsToCell(x, y) {
        return y * 10 + x;
    }
}
