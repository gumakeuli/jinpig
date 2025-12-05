class Altar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 120; // 80 -> 120으로 증가
        this.height = 120; // 80 -> 120으로 증가
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
    }

    update(deltaTime, player) {
        this.floatTimer += deltaTime * 2;

        // Check interaction
        if (!this.used && this.checkCollision(player)) {
            // Show interaction prompt?
            // For now, auto-trigger or require key press?
            // Let's require Space key like items (or auto if simple)
            // But items are auto-pickup.
            // Let's make it auto-trigger for now to be simple, or check space key.
            // Checking space key requires access to input.
            // Let's pass 'game' or 'input' to update if needed.
            // For simplicity, let's make it auto-trigger on collision but with a delay or requirement?
            // No, Altar usually requires interaction.
            // Let's assume Game.js handles the interaction check.
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const floatY = Math.sin(this.floatTimer) * 5;

        if (this.loaded) {
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }

        // Draw floating text or icon above
        if (!this.used) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', this.x, this.y - 50 + floatY);
        } else {
            ctx.fillStyle = '#888888';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Empty', this.x, this.y - 50);
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
        // Effect: Full Heal + Max HP + 1
        player.maxHealth += 1;
        player.health = player.maxHealth;
        console.log("Altar used: Max HP +1, Full Heal");
        return true;
    }
}
