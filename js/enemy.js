// 적 클래스
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 48;

        this.type = type;

        // 적 이미지 로드
        this.imageIdle = new Image();
        this.imageIdle.src = 'assets/images/4.jpg';
        this.imageHit = new Image();
        this.imageHit.src = 'assets/images/5.png';

        this.imageLoaded = false;
        this.currentImage = this.imageIdle;

        this.imageIdle.onload = () => {
            this.imageLoaded = true;
        };

        // 피격 상태
        this.isHit = false;
        this.hitAnimTime = 0;
        this.hitAnimDuration = 0.5; // 0.5초

        // 타입별 스탯 설정
        switch (type) {
            case 'basic':
                this.speed = 80;
                this.maxHealth = 3;
                this.damage = 1;
                this.color = '#ff0000';
                // 별의 소리 드랍 (0개: 60%, 1개: 40%)
                this.starDropTable = [
                    { count: 0, chance: 0.6 },
                    { count: 1, chance: 0.4 }
                ];
                break;
            case 'fast':
                this.speed = 150;
                this.maxHealth = 2;
                this.damage = 1;
                this.color = '#ff6600';
                // 별의 소리 드랍 (나중에 설정 가능)
                this.starDropTable = [
                    { count: 0, chance: 0.6 },
                    { count: 1, chance: 0.4 }
                ];
                break;
            case 'tank':
                this.speed = 50;
                this.maxHealth = 8;
                this.damage = 2;
                this.color = '#cc0000';
                // 별의 소리 드랍 (나중에 설정 가능)
                this.starDropTable = [
                    { count: 0, chance: 0.6 },
                    { count: 1, chance: 0.4 }
                ];
                break;
            case 'boss':
                this.speed = 60;
                this.maxHealth = 50;
                this.damage = 2;
                this.color = '#800080'; // 보라색
                this.width = 120;
                this.height = 120;
                // 별의 소리 드랍 (대량)
                this.starDropTable = [
                    { count: 10, chance: 1.0 }
                ];
                // 보스 이미지
                this.imageIdle.src = 'assets/images/boss/1.jpg';

                // 보스 AI 상태
                this.aiState = 'idle'; // idle, warning, dash, summon, shoot
                this.aiTimer = 0;
                this.patternTimer = 2.0; // 패턴 간격
                this.dashTarget = { x: 0, y: 0 };
                break;
            case 'boss_minion':
                this.speed = 90;
                this.maxHealth = 2;
                this.damage = 1;
                this.color = '#ff00ff';
                this.width = 40;
                this.height = 40;
                this.starDropTable = [
                    { count: 0, chance: 1.0 }
                ];
                this.imageIdle.src = 'assets/images/boss/2.jpg';
                break;
        }



        // 속도 관련 변수 (소다맛 꼬미볼 효과용)
        this.baseSpeed = this.speed;
        // 속도 관련 변수 (소다맛 꼬미볼 효과용)
        this.baseSpeed = this.speed;
        this.speedMultiplier = 1.0;
        this.speedBoostTimer = 0; // 속도 증가 지속 시간

        this.health = this.maxHealth;

        // AI 상태
        this.target = null;
        this.active = true;

        // 피격 효과
        this.hitFlash = 0;

        // 발사 타이머 (보스용 - 구버전 호환 위해 남겨두거나 제거)
        this.shootTimer = 0;
        this.shootInterval = 2.0;

        // 소환 대기 (보스 제외)
        this.isSpawning = type !== 'boss';
        this.spawnTimer = 0;
        this.spawnDuration = 1.5; // 1.5초 대기
    }

    // 타겟 설정
    setTarget(target) {
        this.target = target;
    }

    // 업데이트
    update(deltaTime, game) {
        if (!this.target || !this.active) return;

        // 소환 대기 중
        if (this.isSpawning) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnDuration) {
                this.isSpawning = false;
            }
            return; // 행동 하지 않음
        }

        // 속도 부스트 타이머 업데이트
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= deltaTime;
            this.speed = this.baseSpeed * 1.5; // 50% 증가
        } else {
            this.speed = this.baseSpeed;
        }

        // 보스 AI
        if (this.type === 'boss') {
            this.updateBossAI(deltaTime, game);
            return;
        }

        // 플레이어를 향해 이동
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // 플레이어를 향해 이동 (기본 방향)
            let moveX = dx;
            let moveY = dy;

            // 장애물 회피 (Repulsion Force)
            if (game.room && game.room.obstacles) {
                const avoidanceRadius = 80; // 회피 반경
                const avoidanceWeight = 300; // 회피 가중치

                for (const obstacle of game.room.obstacles) {
                    if (!obstacle.active || !obstacle.blocksMovement) continue;

                    const obsDx = this.x - obstacle.x;
                    const obsDy = this.y - obstacle.y;
                    const obsDist = Math.sqrt(obsDx * obsDx + obsDy * obsDy);

                    if (obsDist < avoidanceRadius && obsDist > 0) {
                        // 장애물에서 멀어지는 힘 추가 (거리가 가까울수록 강하게)
                        const force = (avoidanceRadius - obsDist) / avoidanceRadius;
                        moveX += (obsDx / obsDist) * force * avoidanceWeight;
                        moveY += (obsDy / obsDist) * force * avoidanceWeight;
                    }
                }
            }

            // 최종 방향 정규화
            const moveDist = Math.sqrt(moveX * moveX + moveY * moveY);
            if (moveDist > 0) {
                const dirX = moveX / moveDist;
                const dirY = moveY / moveDist;

                // 이동
                this.x += dirX * this.speed * deltaTime;
                this.y += dirY * this.speed * deltaTime;
            }

            // 보스 패턴: 발사
            if (this.type === 'boss' && game) {
                this.shootTimer += deltaTime;
                if (this.shootTimer >= this.shootInterval) {
                    this.shootTimer = 0;

                    // 플레이어 방향으로 발사
                    // Projectile(x, y, vx, vy, damage, isEnemyProjectile)
                    // Projectile 생성자가 isEnemyProjectile을 지원하는지 확인 필요. 
                    // 일단 기본 Projectile을 사용하고 game.js에서 적 발사체 처리를 추가하거나, 
                    // Projectile에 속성을 추가해야 함.
                    // 여기서는 일단 발사체 생성만 함.

                    // 8방향 발사
                    const directions = [
                        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
                        { x: 0.7, y: 0.7 }, { x: 0.7, y: -0.7 }, { x: -0.7, y: 0.7 }, { x: -0.7, y: -0.7 }
                    ];

                    for (const dir of directions) {
                        const projectile = new Projectile(
                            this.x,
                            this.y,
                            dir.x,
                            dir.y,
                            this.damage
                        );
                        // 적 발사체임을 표시 (Projectile 클래스 수정 필요할 수 있음)
                        projectile.isEnemy = true;
                        projectile.color = '#ff00ff'; // 보라색 탄환
                        game.projectiles.push(projectile);
                    }
                }
            }
        }

        // 피격 효과 감소
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 10;
        }

        // 피격 애니메이션 업데이트
        if (this.isHit) {
            this.hitAnimTime += deltaTime;
            if (this.hitAnimTime >= this.hitAnimDuration) {
                this.isHit = false;
                this.hitAnimTime = 0;
                this.currentImage = this.imageIdle;
            }
        }
    }

    // 그리기
    draw(ctx) {
        // 소환 대기 중 표시
        if (this.isSpawning) {
            ctx.save();
            ctx.translate(this.x, this.y + this.height / 2);

            // 붉은색 원 (점점 커짐)
            const progress = this.spawnTimer / this.spawnDuration;
            const scale = 0.5 + progress * 0.5;

            ctx.scale(scale, scale * 0.5); // 타원형
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fill();

            ctx.restore();
            return;
        }

        // 보스 패턴 그리기 (돌진 경고 등)
        if (this.type === 'boss') {
            if (this.aiState === 'warning') {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.dashTarget.x, this.dashTarget.y);
                ctx.stroke();

                // 목표 지점 표시
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(this.dashTarget.x, this.dashTarget.y, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
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
            // 로딩 중에는 빨간 사각형
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }

        // 체력바
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 8;

            // 배경 (빨간색)
            ctx.fillStyle = '#660000';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 현재 체력 (녹색)
            ctx.fillStyle = '#00ff00';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }

    // 데미지 받기
    takeDamage(amount) {
        if (this.isSpawning) return false;

        this.health -= amount;
        this.hitFlash = 1;

        // 피격 애니메이션 시작
        this.isHit = true;
        this.hitAnimTime = 0;
        this.currentImage = this.imageHit;

        if (this.health <= 0) {
            this.active = false;
            return true; // 죽음
        }
        return false;
    }

    // 충돌 체크용 경계 가져오기
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    // 별의 소리 드랍 개수 계산
    getStarDropCount() {
        const random = Math.random();
        let cumulativeChance = 0;

        for (const drop of this.starDropTable) {
            cumulativeChance += drop.chance;
            if (random <= cumulativeChance) {
                return drop.count;
            }
        }

        return 0; // 기본값
    }

    // 보스 AI 업데이트
    updateBossAI(deltaTime, game) {
        // 쿨타임 감소
        if (this.aiTimer > 0) {
            this.aiTimer -= deltaTime;
        }

        switch (this.aiState) {
            case 'idle':
                // 플레이어 향해 천천히 이동
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * this.speed * 0.5 * deltaTime;
                    this.y += (dy / dist) * this.speed * 0.5 * deltaTime;
                }

                // 패턴 선택
                if (this.aiTimer <= 0) {
                    const rand = Math.random();
                    if (rand < 0.4) {
                        // 40% 확률: 발사
                        this.aiState = 'shoot';
                    } else if (rand < 0.7) {
                        // 30% 확률: 돌진
                        this.aiState = 'warning';
                        this.aiTimer = 1.0; // 1초 경고
                        this.dashTarget = { x: this.target.x, y: this.target.y };
                    } else {
                        // 30% 확률: 소환
                        this.aiState = 'summon';
                    }
                }
                break;

            case 'shoot':
                // 8방향 발사
                const directions = [
                    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
                    { x: 0.7, y: 0.7 }, { x: 0.7, y: -0.7 }, { x: -0.7, y: 0.7 }, { x: -0.7, y: -0.7 }
                ];

                for (const dir of directions) {
                    const projectile = new Projectile(this.x, this.y, dir.x, dir.y, this.damage);
                    projectile.isEnemy = true;
                    projectile.color = '#ff00ff';
                    game.projectiles.push(projectile);
                }

                this.aiState = 'idle';
                this.aiTimer = 2.0; // 2초 쿨타임
                break;

            case 'warning':
                // 경고 상태 (그리기에서 처리)
                if (this.aiTimer <= 0) {
                    this.aiState = 'dash';
                    this.aiTimer = 0.5; // 0.5초 돌진

                    // 돌진 방향 계산
                    const dashDx = this.dashTarget.x - this.x;
                    const dashDy = this.dashTarget.y - this.y;
                    const dashDist = Math.sqrt(dashDx * dashDx + dashDy * dashDy);

                    if (dashDist > 0) {
                        this.dashDir = { x: dashDx / dashDist, y: dashDy / dashDist };
                    } else {
                        this.dashDir = { x: 0, y: 0 };
                    }
                }
                break;

            case 'dash':
                // 돌진
                const dashSpeed = 400;
                this.x += this.dashDir.x * dashSpeed * deltaTime;
                this.y += this.dashDir.y * dashSpeed * deltaTime;

                if (this.aiTimer <= 0) {
                    this.aiState = 'idle';
                    this.aiTimer = 2.0; // 2초 쿨타임
                }
                break;

            case 'summon':
                // 쫄몹 소환 (3마리)
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i;
                    const spawnDist = 100;
                    const sx = this.x + Math.cos(angle) * spawnDist;
                    const sy = this.y + Math.sin(angle) * spawnDist;

                    game.spawnEnemy(sx, sy, 'boss_minion');
                }

                this.aiState = 'idle';
                this.aiTimer = 3.0; // 3초 쿨타임
                break;
        }
    }
}
