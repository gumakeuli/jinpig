class Particle {
    constructor(x, y, color, speed, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;

        // Random direction
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Add some randomness to speed
        this.vx *= (0.5 + Math.random() * 0.5);
        this.vy *= (0.5 + Math.random() * 0.5);

        this.active = true;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
