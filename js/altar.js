class Altar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 300;
        this.height = 300;
        this.active = true;
        this.used = false;

        // Image (석상)
        this.image = new Image();
        this.image.src = 'assets/images/altar_statue.png';
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };

        this.floatTimer = 0;
        this.resultText = null;
        this.resultSubText = null; // 추가 설명 텍스트
        this.resultTimer = 0;
        this.resultDuration = 3.0; // 2초 -> 3초로 증가
    }

    update(deltaTime, player) {
        this.floatTimer += deltaTime * 2;

        if (this.resultText) {
            this.resultTimer += deltaTime;
            if (this.resultTimer > this.resultDuration) {
                this.resultText = null;
                this.resultTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const floatY = Math.sin(this.floatTimer) * 5;

        // 석상 그리기
        if (this.loaded) {
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }

        // 텍스트 그리기
        if (!this.used) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('전건하신께 기도하기', this.x, this.y - 120 + floatY);
            ctx.font = '16px Arial';
            ctx.fillText('(Space)', this.x, this.y - 95 + floatY);
        } else if (this.resultText) {
            // 결과 텍스트 표시
            if (this.resultText === '전건하신께서 축복을 내려주셨다') {
                ctx.fillStyle = '#00ff00'; // 초록색
            } else {
                ctx.fillStyle = '#ff0000'; // 빨간색
            }
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.resultText, this.x, this.y - 140 + floatY);

            // 서브 텍스트 (최대체력 증가/감소)
            if (this.resultSubText) {
                ctx.font = '20px Arial';
                ctx.fillText(this.resultSubText, this.x, this.y - 110 + floatY);
            }
        }
    }

    checkCollision(entity) {
        return (
            this.x - this.width / 2 < entity.x + entity.width / 2 &&
            this.x + this.width / 2 > entity.x - entity.width / 2 &&
            this.y - this.height / 2 < entity.y + entity.height / 2 &&
            this.y + this.height / 2 > entity.y - entity.height / 2
        );
    }

    interact(player) {
        if (this.used) return false;

        this.used = true;

        const rand = Math.random();

        // 33% 확률: 축복 (최대 체력 증가)
        if (rand < 0.33) {
            player.maxHealth += 1;
            player.health = player.maxHealth;
            this.resultText = '전건하신께서 축복을 내려주셨다';
            this.resultSubText = '최대 체력이 증가했다';
            console.log("Altar: Blessing (Max HP +1)");
        }
        // 33% 확률: 피의 서약 (최대 체력 -1, 공격력/공속 +1)
        else if (rand < 0.66) {
            // 최대 체력 감소
            if (player.maxHealth > 1) {
                player.maxHealth -= 1;
                if (player.health > player.maxHealth) {
                    player.health = player.maxHealth;
                }
            } else {
                player.health = 1;
            }

            // 보상 (공격력 또는 공속)
            if (Math.random() < 0.5) {
                // 공격력 증가
                if (player.damage < player.damageCap) {
                    player.damage += 1;
                    this.resultSubText = '공격력이 증가하고 체력이 감소했다';
                } else {
                    this.resultSubText = '체력이 감소했다 (공격력 최대)';
                }
            } else {
                // 공속 증가
                player.attackSpeed += 1;
                if (player.updateFireRate) player.updateFireRate();
                this.resultSubText = '공격 속도가 증가하고 체력이 감소했다';
            }

            // 피의 서약이지만 텍스트는 '노하셨다!'로 통일
            this.resultText = '전건하신께서 노하셨다!';
            console.log("Altar: Blood Oath (Max HP -1, Reward +1)");
        }
        // 33% 확률: 저주 (최대 체력 -1)
        else {
            // 최대 체력 감소만 발생
            if (player.maxHealth > 1) {
                player.maxHealth -= 1;
                if (player.health > player.maxHealth) {
                    player.health = player.maxHealth;
                }
            } else {
                player.health = 1;
            }

            this.resultText = '전건하신께서 노하셨다!';
            this.resultSubText = '최대 체력이 감소했다';
            console.log("Altar: Curse (Max HP -1)");
        }
        return true;
    }
}
