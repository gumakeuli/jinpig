// 발사체 클래스
class Projectile {
    constructor(x, y, dirX, dirY, damage = 1, isEnemy = false, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;

        // 이동
        this.speed = 400; // 픽셀/초
        this.dirX = dirX;
        this.dirY = dirY;

        // 속성
        this.damage = damage;
        this.active = true;
        this.isEnemy = isEnemy;
        this.color = null;
        this.type = type; // 발사체 타입
        this.isOpal = false; // 오팔 총 효과

        if (type === 'moon_slash') {
            this.width = 30;
            this.height = 30;
            this.speed = 500; // 더 빠름
            this.isPiercing = true; // 관통
        }
    }

    // 업데이트
    update(deltaTime, canvasWidth, canvasHeight) {
        // 이동
        this.x += this.dirX * this.speed * deltaTime;
        this.y += this.dirY * this.speed * deltaTime;

        // 회전 (문 슬래시 등)
        if (this.type === 'moon_slash') {
            this.rotation = (this.rotation || 0) + deltaTime * 10;
        }

        // 화면 밖으로 나가면 비활성화
        if (this.x < 0 || this.x > canvasWidth ||
            this.y < 0 || this.y > canvasHeight) {
            this.active = false;
        }
    }

    // 그리기
    draw(ctx) {
        if (this.isOpal) {
            // 오팔 총 효과 (신비로운 광채)
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width);
            gradient.addColorStop(0, '#ffffff'); // 중심은 흰색
            gradient.addColorStop(0.5, '#ccffff'); // 중간은 연한 하늘색
            gradient.addColorStop(1, '#ffccff'); // 끝은 연한 분홍색

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2 + 2, 0, Math.PI * 2); // 약간 더 크게
            ctx.fill();

            // 빛나는 테두리
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0; // 초기화
        } else if (this.type === 'moon_slash') {
            // 월광참 (초승달 모양)
            ctx.save();
            ctx.translate(this.x, this.y);
            // 진행 방향으로 회전
            const angle = Math.atan2(this.dirY, this.dirX);
            ctx.rotate(angle);

            // 달빛 효과
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#F0F8FF';
            ctx.fillStyle = '#F0F8FF'; // AliceBlue

            // 초승달 그리기
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 1.5 * Math.PI, 0.5 * Math.PI); // 바깥 원 (오른쪽 반원)
            ctx.bezierCurveTo(0, 10, -10, 0, 0, -15); // 안쪽 곡선 (야매)
            // 더 간단하게: 두 개의 원 겹치기
            // 일단 단순화된 모양으로
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, -Math.PI / 2, Math.PI / 2, false); // 반원
            ctx.quadraticCurveTo(-10, 0, 0, -this.width / 2); // 안쪽 파기
            ctx.fill();

            ctx.restore();
        } else {
            // 기본 발사체
            ctx.fillStyle = this.color || '#ffff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // 테두리
            ctx.strokeStyle = this.isEnemy ? '#ffffff' : '#ffaa00';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
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
}
