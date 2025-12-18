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

        // 소환 상태 (기본값 false)
        this.isSpawning = false;

        // 타입별 스탯 설정
        switch (type) {
            case 'basic':
                this.speed = 80;
                this.maxHealth = 3;
                this.damage = 1;
                this.color = '#ff0000';
                // 별의 소리 드랍 (0개: 60%, 1개: 40%)
                this.starDropTable = [
                    { count: 0, chance: 0.8 },
                    { count: 1, chance: 0.2 }
                ];
                break;
            case 'fast':
                this.speed = 150;
                this.maxHealth = 2;
                this.damage = 1;
                this.color = '#ff6600';
                // 별의 소리 드랍 (나중에 설정 가능)
                this.starDropTable = [
                    { count: 0, chance: 0.8 },
                    { count: 1, chance: 0.2 }
                ];
                break;
            case 'tank':
                this.speed = 50;
                this.maxHealth = 8;
                this.damage = 2;
                this.color = '#cc0000';
                // 별의 소리 드랍 (나중에 설정 가능)
                this.starDropTable = [
                    { count: 0, chance: 0.8 },
                    { count: 1, chance: 0.2 }
                ];
                break;
            case 'boss':
                this.speed = 60;
                this.maxHealth = 50;
                this.damage = 2;
                this.color = '#800080'; // 보라색
                this.bossName = '홍북이'; // 보스 이름
                this.width = 120;
                this.height = 120;
                this.starDropTable = [{ count: 10, chance: 1.0 }];
                this.imageIdle.src = 'assets/images/boss/1.jpg';
                this.aiState = 'idle';
                this.aiTimer = 0;
                this.patternTimer = 2.0;
                this.dashTarget = { x: 0, y: 0 };
                break;
            case 'boss_minion':
                this.speed = 90;
                this.maxHealth = 2;
                this.damage = 1;
                this.color = '#ff00ff';
                this.width = 40;
                this.height = 40;
                this.starDropTable = [{ count: 0, chance: 1.0 }];
                this.imageIdle.src = 'assets/images/boss/2.jpg';
                break;
            case 'hive_boss':
                // 2스테이지 보스: 심연의 추적자
                this.speed = 80;
                this.maxHealth = 250; // 체력 하향 (400 -> 250)
                this.damage = 1;
                this.color = '#330066';
                this.bossName = '심연의 추적자';
                this.width = 160;
                this.height = 160;
                this.starDropTable = [{ count: 30, chance: 1.0 }];
                this.imageIdle.src = 'assets/images/boss/stage2_void.png?v=' + Date.now();

                // AI 상태 초기화
                this.aiState = 'idle';
                this.aiTimer = 0;
                this.patternTimer = 0;

                // 패턴 상수
                this.PATTERN_INTERVAL = 3.0; // 패턴 간격
                this.TELEPORT_CHARGE_TIME = 1.0;
                this.DASH_CHARGE_TIME = 1.0;
                this.DASH_DURATION = 0.5;
                this.DASH_SPEED = 600;

                // 공허 강습 상수
                this.SMASH_JUMP_TIME = 0.5; // 도약 시간
                this.SMASH_AIR_TIME = 2.5; // 공중 체공 시간 (조준) - 난이도 완화 (1.5 -> 2.5)
                this.SMASH_FALL_TIME = 0.3; // 낙하 시간 (참고용, 실제 속도로 제어)
                this.SMASH_DAMAGE = 1; // 강습 데미지 (2 -> 1)

                this.lastPattern = null; // 마지막 패턴 기억 (연속 방지)

                // 갈라진 땅 이미지 로드
                this.imageCracked = new Image();
                this.imageCracked.src = 'assets/images/boss/cracked_ground.png?v=' + Date.now();
                this.crackedGrounds = []; // 갈라진 땅 효과 목록 {x, y, timer, duration}



                // currentImage 재설정 (중요!)
                this.currentImage = this.imageIdle;

                // 이미지 로드 콜백 재정의
                this.imageIdle.onload = () => {
                    this.imageLoaded = true;
                    this.currentImage = this.imageIdle;
                };
                break;
            case 'hive_left_minion':
                // 왼쪽 쫄몹 (4번 → 8번 → 7번)
                this.speed = 60;
                this.maxHealth = 200; // 공유 체력
                this.damage = 1;
                this.color = '#FF6B6B';
                this.width = 100; // 큰 크기
                this.height = 100;
                this.starDropTable = [{ count: 0, chance: 0 }];
                this.imageIdle.src = 'assets/images/boss/4.gif?v=' + Date.now();
                this.transformImage = 'assets/images/boss/8.gif?v=' + Date.now(); // 변신 중
                this.finalImage = 'assets/images/boss/7.gif?v=' + Date.now(); // 변신 완료
                this.isTransformed = false;
                this.sharedHealthPool = null;

                // currentImage 재설정 (중요!)
                this.currentImage = this.imageIdle;

                // 이미지 로드 콜백 재정의
                this.imageIdle.onload = () => {
                    this.imageLoaded = true;
                    this.currentImage = this.imageIdle;
                };
                break;
            case 'hive_right_minion':
                // 오른쪽 쫄몹 (5번 → 9번 → 6번)
                this.speed = 60;
                this.maxHealth = 200; // 공유 체력
                this.damage = 1;
                this.color = '#6B6BFF';
                this.width = 100; // 큰 크기
                this.height = 100;
                this.starDropTable = [{ count: 0, chance: 0 }];
                this.imageIdle.src = 'assets/images/boss/5.gif?v=' + Date.now();
                this.transformImage = 'assets/images/boss/9.gif?v=' + Date.now(); // 변신 중
                this.finalImage = 'assets/images/boss/6.gif?v=' + Date.now(); // 변신 완료
                this.isTransformed = false;
                this.sharedHealthPool = null;

                // currentImage 재설정 (중요!)
                this.currentImage = this.imageIdle;

                // 이미지 로드 콜백 재정의
                this.imageIdle.onload = () => {
                    this.imageLoaded = true;
                    this.currentImage = this.imageIdle;
                };
                break;
            case 'hive_final_minion':
                // 40% HP에서 등장하는 쫄몹 (10번)
                this.speed = 80;
                this.maxHealth = 200; // 공유 체력
                this.damage = 2;
                this.color = '#FFD700';
                this.width = 120;
                this.height = 120;
                this.starDropTable = [{ count: 0, chance: 0 }];
                this.imageIdle.src = 'assets/images/boss/10.gif?v=' + Date.now();
                this.sharedHealthPool = null;

                // currentImage 재설정 (중요!)
                this.currentImage = this.imageIdle;

                // 이미지 로드 콜백 재정의
                this.imageIdle.onload = () => {
                    this.imageLoaded = true;
                    this.currentImage = this.imageIdle;
                };
                break;
            case 'stage3_boss':
                this.speed = 80; // 중간 속도
                this.maxHealth = 200; // 체력 하향 (300 -> 200)
                this.damage = 3; // 강한 데미지
                this.color = '#FF0000'; // 빨간색
                this.bossName = '최종 보스'; // 보스 이름
                this.width = 150;
                this.height = 150;
                this.starDropTable = [{ count: 50, chance: 1.0 }];
                this.imageIdle.src = 'assets/images/boss/stage3_boss.png';
                this.aiState = 'idle';
                this.aiTimer = 0;
                this.patternTimer = 0;
                this.currentPattern = 0; // 패턴 번호
                this.phaseThreshold = [200, 100]; // 페이즈 전환 체력
                this.currentPhase = 1; // 1, 2, 3 페이즈
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

        // 피격 애니메이션 타이머 (이미지 복구)
        if (this.isHit) {
            this.hitAnimTime += deltaTime;
            if (this.hitAnimTime >= 0.2) { // 0.2초 후 원래 이미지로 복구
                this.isHit = false;
                this.currentImage = this.imageIdle;
            }
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

        // Hive Boss AI (웨이브 소환)
        if (this.type === 'hive_boss') {
            this.updateHiveBossAI(deltaTime, game);
            return;
        }

        // Stage 3 Boss AI (화려한 패턴)
        if (this.type === 'stage3_boss') {
            this.updateStage3BossAI(deltaTime, game);
            return;
        }

        // 변신 중이면 이동/공격 중지
        if (this.aiState === 'transforming') {
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

            // 보스 패턴: 회전 나선형 탄막 + 페이즈 시스템
            if (this.type === 'boss' && game) {
                this.shootTimer += deltaTime;

                // 페이즈 체크 (체력에 따라)
                const healthPercent = this.health / this.maxHealth;
                let currentPhase = 1;
                if (healthPercent <= 0.33) currentPhase = 3;
                else if (healthPercent <= 0.66) currentPhase = 2;

                // 페이즈별 발사 간격
                const phaseInterval = currentPhase === 3 ? 0.15 : (currentPhase === 2 ? 0.2 : 0.3);

                if (this.shootTimer >= phaseInterval) {
                    this.shootTimer = 0;

                    // 회전 각도 증가 (나선형 효과)
                    if (!this.bossRotation) this.bossRotation = 0;
                    this.bossRotation += 0.3; // 회전 속도

                    // 페이즈별 탄막 개수
                    const bulletCount = currentPhase === 3 ? 12 : (currentPhase === 2 ? 10 : 8);

                    for (let i = 0; i < bulletCount; i++) {
                        const angle = (Math.PI * 2 / bulletCount) * i + this.bossRotation;
                        const dir = {
                            x: Math.cos(angle),
                            y: Math.sin(angle)
                        };

                        const projectile = new Projectile(
                            this.x,
                            this.y,
                            dir.x,
                            dir.y,
                            this.damage
                        );
                        projectile.isEnemy = true;
                        projectile.color = currentPhase === 3 ? '#ff0000' : (currentPhase === 2 ? '#ff8800' : '#ff00ff');
                        game.projectiles.push(projectile);
                    }

                    // 페이즈 3: 추가 플레이어 추적 탄환
                    if (currentPhase === 3) {
                        const dx = this.target.x - this.x;
                        const dy = this.target.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            const projectile = new Projectile(
                                this.x,
                                this.y,
                                dx / dist,
                                dy / dist,
                                this.damage
                            );
                            projectile.isEnemy = true;
                            projectile.color = '#ffff00';
                            game.projectiles.push(projectile);
                        }
                    }

                    // 파티클 효과
                    game.spawnParticles(this.x, this.y, projectile.color, 5);
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
            ctx.save();
            if (typeof this.opacity !== 'undefined') {
                ctx.globalAlpha = this.opacity;
            }
            ctx.drawImage(
                this.currentImage,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
            ctx.restore();
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
        // 보스 전조 효과 그리기
        if (this.type === 'hive_boss') {
            // 공허 강습 그림자 (체공 중일 때) - 보스보다 뒤에 그려야 함? 아니면 앞에? 
            // 그림자는 보통 바닥에 있으니 뒤에 그리는 게 맞음. 하지만 보스가 공중에 있을 땐 보스가 없으니 상관 없음.
            // 보스 아이들 이미지가 그려질 때(낙하 후) 갈라진 땅이 보스보다 뒤에 있어야 함.

            // 1. 갈라진 땅 그리기 (가장 먼저)
            if (this.crackedGrounds) {
                for (const ground of this.crackedGrounds) {
                    if (this.imageCracked && this.imageCracked.complete) {
                        const size = 300 * ground.scale;
                        ctx.save();
                        ctx.globalAlpha = Math.min(1.0, ground.timer); // 사라질 때 페이드아웃
                        ctx.drawImage(
                            this.imageCracked,
                            ground.x - size / 2,
                            ground.y - size / 2,
                            size,
                            size
                        );
                        ctx.restore();
                    }
                }
            }

            // 공허 강습 그림자 (체공 중일 때)
            if (this.aiState === 'smash_airborne' || this.aiState === 'smash_jump' || this.aiState === 'smash_fall') {
                if (this.smashTargetX != null) {
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#000000';
                    const shadowSize = 100 + Math.sin(Date.now() / 100) * 10; // 펄스 효과

                    // 타겟 위치에 그림자
                    let sx = this.smashTargetX;
                    let sy = this.smashTargetY;

                    // 점프 중에는 플레이어 따라다님 (airborne)
                    if (this.aiState === 'smash_airborne') {
                        // update에서 이미 업데이트 중
                    }

                    ctx.beginPath();
                    ctx.ellipse(sx, sy, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // 위험 표시 (붉은 원)
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(sx, sy, 150, 0, Math.PI * 2); // 데미지 범위
                    ctx.stroke();

                    ctx.restore();
                }
            }

            if (this.aiState === 'teleport_charge' && this.teleportTargetX != null) {
                // 텔레포트 목표 위치 표시 (반투명 원)
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#9900cc'; // 보라색
                ctx.beginPath();
                ctx.arc(this.teleportTargetX, this.teleportTargetY, 50, 0, Math.PI * 2);
                ctx.fill();

                // 마법진 느낌의 테두리
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(this.teleportTargetX, this.teleportTargetY, 50, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (this.aiState === 'dash_charge') {
                // 돌진 경로 표시 (붉은색 라인)
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 40; // 돌진 폭

                // 보스 중심에서 돌진 방향으로 길게
                const endX = this.x + this.dashDirX * 1000;
                const endY = this.y + this.dashDirY * 1000;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y); // 보스 중심에서 시작인 것 같음 (위에서 width/2를 더했었는데, x,y가 중심좌표라면?)
                // Enemy 생성자 보면 this.x, this.y가 위치임. drawImage는 this.x - this.width/2 하는 걸로 보아 x,y가 중심 맞음.
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.restore();
            }

        }

    }

    // 1스테이지 보스 레이저 그리기
    if(this.type === 'boss') {
    if (this.aiState === 'laser_charging' || this.aiState === 'laser_firing') {
        const laserLen = 1000;
        const endX = this.x + Math.cos(this.laserAngle) * laserLen;
        const endY = this.y + Math.sin(this.laserAngle) * laserLen;

        ctx.save();
        if (this.aiState === 'laser_charging') {
            // 경고 라인 (얇은 빨간선)
            ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]); // 점선
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        } else if (this.aiState === 'laser_firing') {
            // 발사 (굵은 빔)
            ctx.strokeStyle = '#ff0000'; // 빨강
            ctx.lineWidth = 40; // 굵기
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // 내부 흰색 코어
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        ctx.restore();
    }
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
    // imageHit이 있으면 사용, 없으면 imageIdle 유지 (보스의 경우)
    if (this.imageHit && this.imageHit.src && this.imageHit.complete) {
        this.currentImage = this.imageHit;
    }

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

    // 하이브 보스 (2스테이지)
    if (this.type === 'hive_boss') {
        switch (this.aiState) {
            case 'idle':
                if (this.aiTimer <= 0) {
                    this.aiState = 'summon_wave';
                }
                break;
            case 'summon_wave':
                // 대량 소환 (8마리)
                const minionCount = 8;
                for (let i = 0; i < minionCount; i++) {
                    const angle = (Math.PI * 2 / minionCount) * i;
                    const spawnDist = 120;
                    const sx = this.x + Math.cos(angle) * spawnDist;
                    const sy = this.y + Math.sin(angle) * spawnDist;

                    // 화면 밖으로 나가지 않게 조정
                    const clampedX = Math.max(60, Math.min(game.canvas.width - 60, sx));
                    const clampedY = Math.max(60, Math.min(game.canvas.height - 60, sy));

                    game.spawnEnemy(clampedX, clampedY, 'hive_minion');
                }

                // 체력이 50% 이하면 추가 소환 (광폭화)
                if (this.health < this.maxHealth * 0.5) {
                    for (let i = 0; i < 4; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const spawnDist = 180;
                        const sx = this.x + Math.cos(angle) * spawnDist;
                        const sy = this.y + Math.sin(angle) * spawnDist;

                        const clampedX = Math.max(60, Math.min(game.canvas.width - 60, sx));
                        const clampedY = Math.max(60, Math.min(game.canvas.height - 60, sy));

                        game.spawnEnemy(clampedX, clampedY, 'hive_minion');
                    }
                }

                this.aiState = 'idle';
                this.aiTimer = 4.0; // 4초마다 소환 (웨이브 디펜스 느낌)
                break;
        }
        return;
    }

    // 기존 보스 (1스테이지)
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
                if (rand < 0.3) {
                    // 30% 확률: 발사
                    this.aiState = 'shoot';
                } else if (rand < 0.5) {
                    // 20% 확률: 돌진
                    this.aiState = 'warning';
                    this.aiTimer = 1.0; // 1초 경고
                    this.dashTarget = { x: this.target.x, y: this.target.y };
                } else if (rand < 0.8) {
                    // 30% 확률: 레이저 (신규 패턴)
                    this.aiState = 'laser_charging';
                    this.aiTimer = 1.2; // 1.2초 조준
                    this.laserAngle = 0;
                } else {
                    // 20% 확률: 소환
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

        case 'laser_charging':
            // 레이저 조준 (플레이어를 따라감)
            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.laserAngle = Math.atan2(dy, dx);
            }

            if (this.aiTimer <= 0) {
                this.aiState = 'laser_firing';
                this.aiTimer = 1.0; // 1초간 발사
                // 발사 시점에 각도 고정 (더 이상 업데이트 안함)
            }
            break;

        case 'laser_firing':
            // 레이저 발사 및 데미지 판정
            if (this.aiTimer > 0) {
                // 충돌 체크 (직선과 원의 거리)
                // 간단하게 플레이어 중심에서 직선까지의 거리 계산
                if (this.target) {
                    const p = this.target; // 플레이어
                    // 직선 방정식: Ax + By + C = 0
                    // sin(angle)x - cos(angle)y + C = 0
                    // 일반적인 점과 직선 사이 거리 공식보다는 내적/외적 활용

                    // 보스에서 플레이어 벡터
                    const dx = p.x - this.x;
                    const dy = p.y - this.y;

                    // 레이저 방향 단위 벡터
                    const lx = Math.cos(this.laserAngle);
                    const ly = Math.sin(this.laserAngle);

                    // 투영 길이 (Projection)
                    const proj = dx * lx + dy * ly;

                    // 플레이어가 레이저 전방에 있는지 확인 (뒤에 있으면 안 맞음)
                    if (proj > 0) {
                        // 수직 거리 계산
                        // 외적 크기 (2D) = |dx*ly - dy*lx|
                        const dist = Math.abs(dx * ly - dy * lx);

                        // 레이저 굵기 (반지름 20) + 플레이어 크기 고려
                        if (dist < 20 + p.width / 2) {
                            // 데미지 입힘 (틱 데미지 방지 필요하나 간단히 매프레임 체크.. 너무 아픔. 쿨타임 필요)
                            if (!p.invincible) {
                                p.takeDamage(1); // 1 데미지 (연타)
                            }
                        }
                    }
                }
            }

            if (this.aiTimer <= 0) {
                this.aiState = 'idle';
                this.aiTimer = 2.0; // 쿨타임
            }
            break;
    }
}

// Hive Boss AI (웨이브 소환 시스템)
// 심연의 추적자 AI (텔레포트 & 돌진)
updateHiveBossAI(deltaTime, game) {
    if (!this.target) return;

    // 갈라진 땅 효과 업데이트
    if (this.crackedGrounds) {
        for (let i = this.crackedGrounds.length - 1; i >= 0; i--) {
            this.crackedGrounds[i].timer -= deltaTime;
            if (this.crackedGrounds[i].timer <= 0) {
                this.crackedGrounds.splice(i, 1);
            }
        }
    }

    // 상태별 동작
    switch (this.aiState) {
        case 'idle':
            // 천천히 플레이어 따라가기
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * deltaTime;
                this.y += (dy / dist) * this.speed * deltaTime;
            }

            // 패턴 타이머
            this.patternTimer += deltaTime;
            if (this.patternTimer >= this.PATTERN_INTERVAL) {
                this.patternTimer = 0;

                // 패턴 선택 (연속 방지)
                let newPattern;
                do {
                    const rand = Math.random();
                    if (rand < 0.3) {
                        newPattern = 'teleport_charge';
                    } else if (rand < 0.6) {
                        newPattern = 'dash_charge';
                    } else if (rand < 0.8) {
                        newPattern = 'void_zone';
                    } else {
                        newPattern = 'smash_jump';
                    }
                } while (newPattern === this.lastPattern && Math.random() < 0.8); // 80% 확률로 다시 뽑기 (완전 금지는 아님)

                this.aiState = newPattern;
                this.lastPattern = newPattern;
                this.aiTimer = 0;
                console.log(`심연의 추적자 패턴 시작: ${this.aiState}`);
            }
            break;

        case 'void_zone':
            // 공허 장판 생성
            // 플레이어 주변 랜덤 위치 + 보스 주변 랜덤 위치
            const zoneCount = 3;
            for (let i = 0; i < zoneCount; i++) {
                // 플레이어 근처
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 150;
                let zx = game.player.x + Math.cos(angle) * dist;
                let zy = game.player.y + Math.sin(angle) * dist;

                // 맵 밖으로 안 나가게
                zx = Math.max(100, Math.min(game.canvas.width - 100, zx));
                zy = Math.max(100, Math.min(game.canvas.height - 100, zy));

                const zone = new PoisonZone(zx, zy, '#9900cc', 1, 5.0); // 보라색, 1데미지, 5초 지속
                game.poisonZones.push(zone);
            }
            this.aiState = 'idle';
            break;

        case 'smash_jump':
            // 도약 (위로 사라짐)
            this.aiTimer += deltaTime;
            // 점점 투명해지거나 작아짐 (y축 이동 시뮬레이션)
            const jumpProgress = this.aiTimer / this.SMASH_JUMP_TIME;
            this.opacity = 1.0 - jumpProgress;
            this.y -= 1000 * deltaTime; // 위로 이동

            if (this.aiTimer >= this.SMASH_JUMP_TIME) {
                this.aiState = 'smash_airborne';
                this.aiTimer = 0;
                this.opacity = 0;
                this.y = -500; // 화면 밖
            }
            break;

        case 'smash_airborne':
            // 공중 체공 (플레이어 추적 - 그림자만 이동)
            this.aiTimer += deltaTime;
            // 그림자 위치 업데이트 (플레이어 위치로)
            this.smashTargetX = game.player.x;
            this.smashTargetY = game.player.y;

            if (this.aiTimer >= this.SMASH_AIR_TIME) {
                this.aiState = 'smash_fall';
                this.aiTimer = 0;
                // 최종 낙하 위치 확정
                this.x = this.smashTargetX;
                this.y = this.smashTargetY - 1000; // 낙하 시작 높이
            }
            break;

        case 'smash_fall':
            // 낙하 (급강하)
            this.aiTimer += deltaTime;
            const fallSpeed = 2000; // 속도 감소 (3000 -> 2000)
            this.y += fallSpeed * deltaTime;
            this.opacity = 1.0;

            // 지면 도달 (목표 y좌표 도달)
            // 지면 도달 (목표 y좌표 도달)
            if (this.y >= this.smashTargetY) {
                this.y = this.smashTargetY;

                // 충격 효과
                game.shakeScreen(15, 0.5);
                game.spawnParticles(this.x, this.y, '#9900cc', 30);

                // 데미지 판정 (범위 내 플레이어)
                // 플레이어는 점프 등으로 피할 수 없음 (2D Top-down)
                const dx = game.player.x - this.x;
                const dy = game.player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) { // 충격 반경
                    game.player.takeDamage(this.SMASH_DAMAGE);
                }

                // 갈라진 땅 효과 생성 (여기서만 그리는 객체 추가)
                this.crackedGrounds.push({
                    x: this.x,
                    y: this.y,
                    timer: 5.0, // 5초 유지
                    scale: 1.0
                });

                console.log("공허 강습 충격!");

                // 충격 후 딜레이 (회복 시간)
                this.aiState = 'smash_recovery';
                this.aiTimer = 1.0; // 1초 동안 멍때림 (데미지 없음)
                this.isHarmless = true; // 접촉 데미지 비활성화
            }
            break;

        case 'smash_recovery':
            // 착지 후 잠시 휴식 (무방비? 혹은 그냥 데미지 안주는 상태)
            this.aiTimer -= deltaTime;
            if (this.aiTimer <= 0) {
                this.aiState = 'idle';
                this.isHarmless = false; // 다시 데미지 활성화
            }
            break;

        case 'teleport_charge':
            // 텔레포트 준비 (투명해짐 + 전조 효과)
            this.aiTimer += deltaTime;

            // 텔레포트 각도 결정 (처음 한 번만)
            if (this.teleportAngle == null) {
                this.teleportAngle = Math.random() * Math.PI * 2;
            }

            // 목표 위치 추적 (텔레포트 0.4초 전까지 플레이어 추적)
            // 이렇게 하면 플레이어를 따라다니다가 마지막에 고정됨
            if (this.aiTimer < this.TELEPORT_CHARGE_TIME - 0.4) {
                const radius = 150; // 거리 좁힘 (200 -> 150)
                const targetX = game.player.x + Math.cos(this.teleportAngle) * radius;
                const targetY = game.player.y + Math.sin(this.teleportAngle) * radius;
                // 방 범위 제한
                this.teleportTargetX = Math.max(100, Math.min(game.canvas.width - 100, targetX));
                this.teleportTargetY = Math.max(100, Math.min(game.canvas.height - 100, targetY));
            }

            if (this.aiTimer >= this.TELEPORT_CHARGE_TIME) {
                // 텔레포트 실행
                this.x = this.teleportTargetX;
                this.y = this.teleportTargetY;

                // 탄막 발사 (24방향 - 3배 증가)
                const projectileCount = 24;
                for (let i = 0; i < projectileCount; i++) {
                    const shotAngle = (Math.PI * 2 / projectileCount) * i;
                    game.spawnBossProjectile(this.x, this.y, Math.cos(shotAngle), Math.sin(shotAngle));
                }
                console.log('심연의 추적자 텔레포트 및 탄막 발사');

                this.aiState = 'idle';
                this.teleportTargetX = null;
                this.teleportTargetY = null;
                this.teleportAngle = null; // 각도 초기화
            }
            break;

        case 'dash_charge':
            // 돌진 준비 (멈춤, 방향 고정)
            this.aiTimer += deltaTime;

            // 돌진 방향 계산 (계속 업데이트하여 추적 -> 전조 효과용)
            const dashDx = this.target.x - this.x;
            const dashDy = this.target.y - this.y;
            const dashDist = Math.sqrt(dashDx * dashDx + dashDy * dashDy);
            this.dashDirX = dashDx / dashDist;
            this.dashDirY = dashDy / dashDist;

            if (this.aiTimer >= this.DASH_CHARGE_TIME) {
                this.aiState = 'dashing';
                this.aiTimer = 0;
            }
            break;

        case 'dashing':
            // 고속 이동
            this.aiTimer += deltaTime;
            this.x += this.dashDirX * this.DASH_SPEED * deltaTime;
            this.y += this.dashDirY * this.DASH_SPEED * deltaTime;

            if (this.aiTimer >= this.DASH_DURATION) {
                this.aiState = 'idle';
            }
            break;
    }

    // 방 밖으로 나가지 않도록
    if (game.room) {
        game.room.constrainEntity(this);
    }
}

// 텔레포트 실행 (이제 위에서 직접 처리하므로 사용 안 함, 하지만 호환성을 위해 남겨둠)
executeTeleport(game) {
    // ...
}

// Stage 3 Boss AI (화려한 패턴)
updateStage3BossAI(deltaTime, game) {
    this.aiTimer += deltaTime;
    this.patternTimer += deltaTime;

    // 페이즈 체크
    if (this.health <= this.phaseThreshold[1] && this.currentPhase < 3) {
        this.currentPhase = 3;
        console.log('최종 보스 페이즈 3 돌입!');
        game.shakeScreen(15, 1.0);
    } else if (this.health <= this.phaseThreshold[0] && this.currentPhase < 2) {
        this.currentPhase = 2;
        console.log('최종 보스 페이즈 2 돌입!');
        game.shakeScreen(10, 0.8);
    }

    // 패턴 전환 (2초마다)
    if (this.patternTimer >= 2.0) {
        this.patternTimer = 0;
        this.currentPattern = (this.currentPattern + 1) % 4;
    }

    // 패턴 실행
    switch (this.currentPattern) {
        case 0: // 원형 탄막
            if (this.aiTimer >= 0.5) { // 발사 간격 증가 (0.3 -> 0.5)
                this.aiTimer = 0;
                const bulletCount = 6 + this.currentPhase * 2; // 개수 감소 (8 + P*4 -> 6 + P*2)
                for (let i = 0; i < bulletCount; i++) {
                    const angle = (Math.PI * 2 / bulletCount) * i;
                    const projectile = new Projectile(
                        this.x, this.y,
                        Math.cos(angle), Math.sin(angle),
                        this.damage
                    );
                    projectile.isEnemy = true;
                    projectile.color = '#FF0000';
                    game.projectiles.push(projectile);
                }
                game.spawnParticles(this.x, this.y, '#FF0000', 10);
            }
            break;

        case 1: // 나선형 탄막
            if (this.aiTimer >= 0.2) { // 발사 간격 증가 (0.1 -> 0.2)
                this.aiTimer = 0;
                const spiralAngle = this.patternTimer * 5;
                for (let i = 0; i < 2; i++) { // 줄기 감소 (3 -> 2)
                    const angle = spiralAngle + (Math.PI * 2 / 2) * i;
                    const projectile = new Projectile(
                        this.x, this.y,
                        Math.cos(angle), Math.sin(angle),
                        this.damage
                    );
                    projectile.isEnemy = true;
                    projectile.color = '#FF00FF';
                    game.projectiles.push(projectile);
                }
            }
            break;

        case 2: // 플레이어 추적 탄막
            if (this.aiTimer >= 0.8) { // 발사 간격 증가 (0.5 -> 0.8)
                this.aiTimer = 0;
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    const spreadCount = 1 + this.currentPhase; // 개수 감소 (3+P -> 1+P)
                    for (let i = 0; i < spreadCount; i++) {
                        const spreadAngle = Math.atan2(dy, dx) + (i - spreadCount / 2) * 0.3;
                        const projectile = new Projectile(
                            this.x, this.y,
                            Math.cos(spreadAngle), Math.sin(spreadAngle),
                            this.damage
                        );
                        projectile.isEnemy = true;
                        projectile.color = '#FFFF00';
                        game.projectiles.push(projectile);
                    }
                    game.spawnParticles(this.x, this.y, '#FFFF00', 15);
                }
            }
            break;

        case 3: // 폭발 패턴
            if (this.aiTimer >= 1.5) { // 발사 간격 증가 (1.0 -> 1.5)
                this.aiTimer = 0;
                // 랜덤 위치에 폭발
                for (let i = 0; i < 2 + this.currentPhase; i++) { // 개수 감소 (3 -> 2)
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 100 + Math.random() * 150;
                    const explosionX = this.x + Math.cos(angle) * dist;
                    const explosionY = this.y + Math.sin(angle) * dist;

                    // 폭발 지점에서 사방으로 탄막
                    for (let j = 0; j < 6; j++) { // 개수 감소 (8 -> 6)
                        const bulletAngle = (Math.PI * 2 / 6) * j;
                        const projectile = new Projectile(
                            explosionX, explosionY,
                            Math.cos(bulletAngle), Math.sin(bulletAngle),
                            this.damage
                        );
                        projectile.isEnemy = true;
                        projectile.color = '#FF8800';
                        game.projectiles.push(projectile);
                    }
                    game.spawnParticles(explosionX, explosionY, '#FF8800', 20);
                    game.shakeScreen(5, 0.2);
                }
            }
            break;
    }

    // 보스 이동 (플레이어 주변을 맴돔)
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 250) {
        // 너무 멀면 접근
        this.x += (dx / dist) * this.speed * deltaTime;
        this.y += (dy / dist) * this.speed * deltaTime;
    } else if (dist < 150) {
        // 너무 가까우면 후퇴
        this.x -= (dx / dist) * this.speed * deltaTime;
        this.y -= (dy / dist) * this.speed * deltaTime;
    } else {
        // 적당한 거리에서 원을 그리며 이동
        const orbitAngle = Math.atan2(dy, dx) + Math.PI / 2;
        this.x += Math.cos(orbitAngle) * this.speed * deltaTime;
        this.y += Math.sin(orbitAngle) * this.speed * deltaTime;
    }
}
    // 데미지 받기

}
