class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    apply(vOther) {
        this.x += vOther.x;
        this.y += vOther.y;
    }
    scale(len) {
        var currentLen = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x * (len/currentLen);
        this.y = this.y * (len/currentLen);
    }
    getAngle() {
        return radToDeg(Math.atan(this.y/this.x));
    }
    setAngle(angle) {
        var currentLen = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = 1;
        this.y = Math.tan(angle);
        this.scale(currentLen);
    }
    draw() {
        context.strokeStyle = "#ffffff";
        context.beginPath();
        context.moveTo(canvas.width/2, canvas.height/2);
        context.lineTo(canvas.width/2 + this.x, canvas.height/2 + this.y);
        context.lineTo(canvas.width/2 + this.x, canvas.height/2);
        context.lineTo(canvas.width/2, canvas.height/2);
        context.stroke();
    }
}

class HitBox {
    constructor(pt, w, h) {
        this.pt = pt;
        this.w = w;
        this.h = h;
        this.width = 3;
    }
    checkCollide(boxOther) {
        if (this.pt.x < boxOther.pt.x + boxOther.w && boxOther.pt.x < this.pt.x + this.w) {
            if (this.pt.y < boxOther.pt.y + boxOther.h && boxOther.pt.y < this.pt.y + this.h) {
                return true;
            }
        }
        return false;
    }
    outOfBounds() {
        if (this.pt.x < 0 || this.pt.x + this.w > canvas.width) {
            return true;
        }
        return false;
    }
    draw(color) {
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = this.width;
        context.beginPath();
        context.rect(this.pt.x, this.pt.y, this.w, this.h);
        context.stroke();
    }
}

class Spaceship {
    constructor(pt, len) {
        this.pt = pt;
        this.angle = 0;
        this.len = len;
        this.turnSpeed = 4;
        this.speed = 0;
        this.color = "#ffffff";
        this.hb = new HitBox(pt, this.len/2, this.len);
    }
    move() {
        if (wDown) {
            this.speed += 0.2;
        }
        if (sDown) {
            this.speed -= 0.1;
        }
        if (dDown) {
            this.angle -= this.turnSpeed;
        }
        if (aDown) {
            this.angle += this.turnSpeed;
        }
        if (this.speed < 0) this.speed = 0;

        for (var i = 0; i < asteroids.length; i++) {
            asteroids[i].pt.apply(new Vector(-Math.sin(degToRad(this.angle)) * this.speed, -Math.cos(degToRad(this.angle)) * this.speed));
        }
    }
    draw() {
        context.fillStyle = this.color;
        context.beginPath();
        context.moveTo(this.pt.x, this.pt.y);
        context.lineTo(this.pt.x + Math.sin(degToRad(this.angle)) * this.len, this.pt.y + Math.cos(degToRad(this.angle)) * this.len);
        context.lineTo(this.pt.x + Math.sin(degToRad(this.angle)) * this.len + Math.sin(degToRad(90 + this.angle)) * this.len/2, this.pt.y + Math.cos(degToRad(this.angle)) * this.len + Math.cos(degToRad(90 + this.angle)) * this.len/2);
        context.lineTo(this.pt.x + Math.sin(degToRad(90 + this.angle)) * this.len/2, this.pt.y + Math.cos(degToRad(90 + this.angle)) * this.len/2);
        context.fill();

        this.hb.draw("#00ff00");
    }

    checkHit(hb) {
        
    }
}


class Asteroid {
    constructor() {
        this.w = 50;
        this.h = 50;

        let tempPt = new Vector(getRandomInt(0, canvas.width - this.w), getRandomInt(0, canvas.height - this.h));
        let badPt = true;
        while (badPt) {
            badPt = false;
            for (var i = 0; i < asteroids.length; i++) {
                if (new HitBox(tempPt, this.w, this.h).checkCollide(asteroids[i].hb)) {
                    badPt = true;
                }
                // if (new HitBox(tempPt, this.w, this.h).checkCollide(PLAYER.HB))
            }
        }
        this.pt = tempPt;

        this.color = "#ff0000";
        this.hb = new HitBox(this.pt, this.w, this.h);
    }
    draw() {
        context.fillStyle = this.color;
        context.beginPath();
        context.rect(this.pt.x, this.pt.y, this.w, this.h);
        context.fill();
    }
}