class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.active = true;
        this.timer = 0;
    }

    update(deltaTime) {
        this.timer += deltaTime;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 포탈 이펙트 (맥동)
        const scale = 1 + Math.sin(this.timer * 3) * 0.1;
        ctx.scale(scale, scale);

        // 외부 광채
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 40);
        gradient.addColorStop(0, 'rgba(100, 100, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(50, 0, 200, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 60, 0, 0, Math.PI * 2);
        ctx.fill();

        // 내부 블랙홀
        ctx.fillStyle = '#000033';
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 45, 0, 0, Math.PI * 2);
        ctx.fill();

        // 소용돌이 효과
        ctx.rotate(this.timer * 2);
        ctx.strokeStyle = '#aaaaff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.moveTo(10, 0);
            ctx.quadraticCurveTo(20, 20, 0, 30);
        }
        ctx.stroke();

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - 20,
            y: this.y - 30,
            width: 40,
            height: 60
        };
    }
}
