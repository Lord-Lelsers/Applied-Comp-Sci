class Vector {
    x; y;
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
    scalar(s) {
        this.x *= s;
        this.y *= s;
    }
    restore(save) {
        this.x = save.x;
        this.y = save.y;
    }
}

class HitBox {
    pt; w; h;
    constructor(pt, w, h) {
        this.pt = pt;
        this.w = w;
        this.h = h;
    }
    checkCollide(boxOther) {
        return (this.pt.x < boxOther.pt.x + boxOther.w && boxOther.pt.x < this.pt.x + this.w && this.pt.y < boxOther.pt.y + boxOther.h && boxOther.pt.y < this.pt.y + this.h);
    }
    outOfBounds() {
        return (this.pt.x < 0 || this.pt.x + this.w > canvas.width);
    }
    useSmallHB(pt, w, h) {
        this.pt.x = pt.x + w/5;
        this.pt.y = pt.y + h/10;
        this.w = w * 3/5;
        this.h = h * 4/5;
    }
    draw(color) {
        context.strokeStyle = color;
        context.strokeRect(this.pt.x, this.pt.y, this.w, this.h);
    }
    restore(save) {
        this.pt.restore(save.pt);
        this.w = save.w;
        this.h = save.h;
    }
}

class Thing {
    pt; w; h; hb;
    active = true;
    constructor(pt, w, h) {
        this.pt = pt;
        this.w = w;
        this.h = h;
        this.hb = new HitBox(pt, w, h);
    }
    restore(save) {
        this.pt.restore(save.pt);
        this.w = save.w;
        this.h = save.h;
        this.active = save.active;
        this.hb.restore(save.hb);
    }
}

class Trigger extends Thing {
    txt;
    down = false;
    color = "#5e94d1";
    color2 = "#9ee092";
    constructor(pt, w, h, txt) {
        super(pt, w, h);
        this.txt = txt;
    }
    draw(keyDown) {
        context.fillStyle = this.down || keyDown ? this.color : this.color2;
        context.beginPath();
        context.fillRect(this.pt.x, this.pt.y, this.w, this.h);
        this.drawTxt();
    }
    drawTxt() {
        context.fillStyle = "#ffffff";
        context.font = carHeight/3 + "px " + font;
        context.fillText(this.txt, this.pt.x + this.w/2, this.pt.y + this.h/2);
    }
    checkDown(cursorHB, mouseDown) {
        if (cursorHB.checkCollide(this.hb) && mouseDown) {
            this.down = true;
            return true;
        }
        this.down = false;
        return false;
    }
}

class Ability extends Trigger {
    timer; wait; sound;
    backgroundColor = "#dadfe6";
    canUseColor = "#9ee092";
    rechargingColor = "#5e94d1"
    recharge = 1;
    constructor(pt, w, h, wait, txt, sound) {
        super(pt, w, h, txt);
        this.timer = wait;
        this.wait = wait;
        this.sound = sound;
    }
    draw() {
        context.fillStyle = this.backgroundColor;
        context.fillRect(this.pt.x, this.pt.y, this.w, this.h);
        
        let delay = this.wait - this.timer >= 0 ? this.wait - this.timer : 0;
        let width = (this.wait - delay) * this.w/this.wait;

        context.fillStyle = delay == 0 ? this.canUseColor : this.rechargingColor;
        context.fillRect(this.pt.x, this.pt.y, width, this.h);

        this.drawTxt();
        if (!paused && this.timer < this.wait) this.timer += delta * this.recharge;
    }
    use() {
        this.timer = 0;
        this.sound.currentTime = 0;
        this.sound.play();
    }
    canUse(keyDown) {
        return this.timer >= this.wait && keyDown;
    }
    restore(save) {
        this.wait = save.wait;
        this.timer = save.timer;
        this.recharge = save.recharge;
    }
}

class Buff extends Ability {
    drain;
    doubleClickProtection = 0;
    constructor(pt, w, h, wait, drain, txt, sound) {
        super(pt, w, h, wait, txt, sound);
        this.drain = drain;
        this.active = false;
    }
    draw() {
        if (this.active) this.rechargingColor = "#e37e7b";
        else this.rechargingColor = "#5e94d1";

        super.draw();
        
        if (this.timer <= 0) this.active = false;
        if (this.active && !paused) this.timer -= this.drain * delta;
        this.doubleClickProtection -= delta;
    }
    use() {
        if (this.doubleClickProtection <= 0) {
            if (this.active) this.active = false;
            else if (this.timer >= this.drain){
                this.active = true;
                this.sound.currentTime = 0;
                this.sound.play();
            }
            this.doubleClickProtection = 20;
        }
    }
    restore(save) {
        super.restore(save);
        this.active = save.active;
    }
}

class GameTxt extends Thing {
    color; txt;
    constructor(pt, color, w, h, txt) {
        super(pt, w, h);
        this.color = color;
        this.txt = txt;
    }
    draw() {
        context.fillStyle = this.color;
        context.fillRect(this.pt.x, this.pt.y, this.w, this.h);

        context.fillStyle = "#ffffff";
        context.font = carHeight/4.5 + "px " + font;
        context.fillText(this.txt, this.pt.x + this.w/2, this.pt.y + this.h/2);
    }
    setTxt(txt) {
        context.font = carHeight/4.5 + "px " + font;
        this.txt = txt;
        this.w = context.measureText(this.txt).width * 1.3;
    }
}

class Laser extends Thing {
    friendly; color; stunTime; ms; angle; moveVector;
    constructor(pt, angle, stunTime, friendly) {
        let ms = laserSpeed;
        var moveVector = new Vector(Math.sin(degToRad(angle)) * ms, Math.cos(degToRad(angle)) * ms);
        moveVector.scalar(delta);
        super(pt, ms, ms);
        this.friendly = friendly;
        this.color = friendly ? "#03b1fc" : "#ff0055";
        this.stunTime = stunTime;
        this.ms = ms;
        this.angle = angle;
        this.moveVector = moveVector;
    }
    update() {
        this.pt.apply(this.moveVector);
        if (this.pt.x < -this.ms || this.pt.x > canvas.width + this.ms || (this.pt.y > cars[0].pt.y && this.pt.y > canvas.height) || this.pt.y < -carHeight) {
            lasers.splice(lasers.indexOf(this), 1);
        }
        let enemies = this.friendly ? [...cars, ...ufos] : [player];
        for (var i in enemies) {
            if (this.hb.checkCollide(enemies[i].hb)) {
                enemies[i].active = false;
                enemies[i].stun += this.stunTime;
                for (var i in laserSounds) {
                    if (laserSounds[i].currentTime == laserSounds[i].duration || laserSounds[i].currentTime == 0) {
                        laserSounds[i].play();
                        break;
                    }
                }
                lasers.splice(lasers.indexOf(this), 1);
                break;
            }
        }
        for (var i in buildings) {
            if (this.hb.checkCollide(buildings[i].hb)) {
                lasers.splice(lasers.indexOf(this), 1);
                break;
            }
        }
        this.draw();
    }
    draw() {
        context.strokeStyle = this.color;
        context.lineWidth = this.ms * 1.5;
        context.beginPath();
        context.moveTo(this.pt.x + this.hb.w/2, this.pt.y + this.hb.h/2);
        context.lineTo(this.pt.x + this.hb.w/2 - this.moveVector.x * 3 * 1/delta, this.pt.y + this.hb.h/2 - this.moveVector.y * 3 * 1/delta);
        context.stroke();
        context.lineWidth = 3;
    }
    restore(save) {
        super.restore(save);
        this.stunTime = save.stunTime;
        this.ms = save.ms;
        this.angle = save.angle;
        this.moveVector.x = save.moveVector.x;
        this.moveVector.y = save.moveVector.y;
        this.friendly = save.friendly;
        this.color = save.color;
    }
}

class Player extends Thing {
    msX = canvas.width/14;
    msY = 1.5 * canvas.height/14;
    msXIncrease = this.msX/20;
    msYIncrease = this.msY/20;
    teleportSpeed = 3;
    sprintSpeed = 1.5;
    animation = 0;
    frame = 0
    lastDrawDir = 0;
    afterImages = [];
    stun = 0;
    lastStun = 0;
    stunProtection = 0;
    spawnProtection = 60/5;
    constructor() {
        super(new Vector(canvas.width/2 - carHeight/2, playerLevel), carHeight * 10/11, carHeight);
        this.msX = canvas.width/14;
        this.msY = 1.5 * canvas.height/14;
        this.msXIncrease = this.msX/20;
        this.msYIncrease = this.msY/20;
        this.teleportSpeed = 3;
        this.sprintSpeed = 1.5;
        this.animation = 0;
        this.lastDrawDir = 0;
        this.hb.pt = new Vector(-1, -1); // break reference to this.pt
        this.hb.useSmallHB(this.pt, this.w, this.h);
    }
    moveVertical(ms) {
        let obstacles = [...pickUps, ...landSlides, ...cars, ...buildings, ...lasers, ...bar, ...this.afterImages, ...ufos];
        for (var i in obstacles) obstacles[i].pt.y += ms * (eAbility.active ? this.sprintSpeed : 1);
        for (var i in pickUps) pickUps[i].minY += ms * (eAbility.active ? this.sprintSpeed : 1);
        for (var i in bar) bar[i].update();
        score += ms * moveWait/this.msY;
        if (score > topScore) topScore = Number(score.toFixed(0));
    }
    updateStun() {
        if (this.stun > this.lastStun && this.stunProtection <= 0) {
            this.stunProtection = this.stun * 2;
        }
        else if (this.stun > this.lastStun) {
            this.stun = 0;
        }
        this.stunProtection -= delta;
        this.stun -= delta;
        if (this.stun <= 0) {
            this.active = true;
            this.stun = 0;
        }
        this.lastStun = this.stun;
    }
    updateAnimation() {
        let animationWait = eAbility.active ? 6 : 8;
        if (Number(this.frame.toFixed(0)) % animationWait == 0 && alive) {
            this.animation++;
            this.frame++; // so if player stops on a % = 0, it doesn't freak out
            if (this.animation > 3) this.animation = 0;
        }
    }
    checkAbilites() {
        if (qAbility.canUse(qDown)) { // teleport ability
            switch (lastDir) {
                case "w":
                    for (var i = 0; i < this.teleportSpeed * 2 + 1; i++) {
                        this.afterImages.push(new AfterImage(new Vector(this.pt.x, this.pt.y - i * this.msY/2), this.w, this.h, Number(!alive), this.lastDrawDir, this.animation, 50 * i/2));
                    }
                    this.moveVertical(this.msY * this.teleportSpeed);
                    break;
                case "s":
                    for (var i = 0; i < this.teleportSpeed * 2 + 1; i++) {
                        this.afterImages.push(new AfterImage(new Vector(this.pt.x, this.pt.y + i * this.msY/2), this.w, this.h, Number(!alive), this.lastDrawDir, this.animation, 50 * i/2));
                    }
                    this.moveVertical(-this.msY * this.teleportSpeed);
                    break;
                case "a":
                    for (var i = 0; i < this.teleportSpeed * 2 + 1; i++) {
                        this.afterImages.push(new AfterImage(new Vector(this.pt.x - i * this.msX/2, this.pt.y), this.w, this.h, Number(!alive), this.lastDrawDir, this.animation, 50 * i/2));
                    }
                    this.pt.x -= this.msX * this.teleportSpeed;
                    break;
                case "d":
                    for (var i = 0; i < this.teleportSpeed * 2 + 1; i++) {
                        this.afterImages.push(new AfterImage(new Vector(this.pt.x + i * this.msX/2, this.pt.y), this.w, this.h, Number(!alive), this.lastDrawDir, this.animation, 50 * i/2));
                    }
                    this.pt.x += this.msX * this.teleportSpeed;
                    break
            }
            this.hb.useSmallHB(this.pt, this.w, this.h);
            for (let i in buildings) {
                if (this.hb.checkCollide(buildings[i].hb)) {
                    if (lastDir == "w") this.moveVertical(-(buildings[i].pt.y + buildings[i].h - this.pt.y));
                    else if (lastDir == "s") this.moveVertical(this.pt.y - buildings[i].pt.y + this.h);
                    else if (lastDir == "a") this.pt.x += buildings[i].pt.x + buildings[i].w - this.pt.x;
                    else if (lastDir == "d") this.pt.x -= this.pt.x - buildings[i].pt.x + this.w;
                    break;
                }
            }
            qAbility.use();
        }
        if (eDown) { // sprint ability
            eAbility.use();
        }
        if (rAbility.canUse(rDown)) { // laser ability
            for (var i = 0; i < 8; i++) {
                var startPos = new Vector(this.pt.x + (this.w/2), this.pt.y + (this.h/2));
                lasers.push(new Laser(startPos, i * 45, 120, true));
            }
            rAbility.use();
        }
    }
    move() {
        this.updateStun();
        this.spawnProtection -= delta * 0.2;
        if (alive && this.active) {
            if (wDown || sDown || aDown || dDown) {
                this.frame += delta;
                switch (lastDir) {
                    case "w":
                        this.moveVertical(this.msY/moveWait * delta);
                        break;
                    case "s":
                        this.moveVertical(-this.msY/moveWait * delta);
                        break;
                    case "a":
                        this.pt.x -= this.msX/moveWait * (eAbility.active ? this.sprintSpeed : 1) * delta;
                        break;
                    case "d":
                        this.pt.x += this.msX/moveWait * (eAbility.active ? this.sprintSpeed : 1) * delta;
                        break;
                }
                this.hb.useSmallHB(this.pt, this.w, this.h);
                for (var i in buildings) {
                    if (this.hb.checkCollide(buildings[i].hb)) { // if it is touching, undo the last movement
                        if (lastDir == "a") this.pt.x += this.msX/moveWait * (eAbility.active ? this.sprintSpeed : 1) * delta;
                        else if (lastDir == "d") this.pt.x -= this.msX/moveWait * (eAbility.active ? this.sprintSpeed : 1) * delta;
                        else if (lastDir == "w") this.moveVertical(-this.msY/moveWait * delta);
                        else if (lastDir == "s") this.moveVertical(this.msY/moveWait * delta);
                        break;
                    }
                }
            }
            this.updateAnimation();
            this.checkAbilites();
        }
        if (this.pt.x < 0) this.pt.x = 0;
        else if (this.pt.x + this.w > canvas.width) this.pt.x = canvas.width - this.w;
        this.hb.useSmallHB(this.pt, this.w, this.h);
    }
    checkHit(enemy) {
        if (enemy.hb.checkCollide(player.hb)) {
            if (this.spawnProtection < 0) {
                enemy.deathSound.play();
                this.stunProtection = this.spawnProtection = 120 * 0.2;
                this.stun = this.lastStun = 0;
                qAbility.timer = qAbility.wait;
                eAbility.timer = eAbility.wait;
                rAbility.timer = rAbility.wait;
                lives--;
                if (lives <= 0) {
                    livesView.color = "#e37e7b";
                    alive = false;
                    player.active = false;
                }
            }
        }
    }
    draw() {
        for (var i in this.afterImages) this.afterImages[i].draw();
        if (alive && !paused && this.active) {
            let dirs = ["s", "w", "d", "a"];
            let dir = dirs.indexOf(lastDir);
            this.lastDrawDir = dir;
        }
        if (this.spawnProtection <= 0 || Number(this.spawnProtection.toFixed(0)) % 2 != 0 || !alive) {
            context.drawImage(texPlayer, posSourcePlayer[Number(!alive)][Number(!this.active)][this.lastDrawDir][this.animation][0], posSourcePlayer[Number(!alive)][Number(!this.active)][this.lastDrawDir][this.animation][1], 10, 11, this.pt.x, this.pt.y, this.w, this.h);
        }
    }
    restore(save) {
        super.restore(save);
        this.afterImages = [];
        this.animation = save.animation;
        this.frame = save.frame;
        this.lastDrawDir = save.lastDrawDir;
        this.msX = save.msX;
        this.msY = save.msY;
        this.msXIncrease = save.msXIncrease;
        this.msYIncrease = save.msYIncrease;
        this.spawnProtection = save.spawnProtection;
        this.stunProtection = save.stunProtection;
        this.stun = save.stun;
        this.lastStun = save.lastStun;
    }
}

class AfterImage extends Thing {
    a; b; c; frames;
    constructor(pt, w, h, a, b, c, frames) {
        super(pt, w, h);
        this.a = a;
        this.b = b;
        this.c = c;
        this.frames = frames;
    }
    draw() {
        if (this.frames > 0) {
            context.globalAlpha = this.frames/300 * 0.6;
            context.drawImage(texPlayer, posSourcePlayer[this.a][0][this.b][this.c][0], posSourcePlayer[this.a][0][this.b][this.c][1], 10, 11, this.pt.x, this.pt.y, this.w, this.h);
            context.globalAlpha = 1;
            if (!paused) this.frames -= delta;
        }
        else player.afterImages.splice(player.afterImages.indexOf(this), 1);
    }
}

class Enemy extends Thing {
    ms; deathSound; laserFireSound;
    frame = 0;
    stun = 0;
    animation = getRandomInt(0, 2);
    animationWaitBase = 30;
    canShoot = false;
    constructor(pt, w, h, ms, soundFilename, vol) {
        super(pt, w, h);
        this.ms = ms;
        
        this.deathSound = document.createElement("audio");
        this.deathSound.src = soundFilename;
        this.deathSound.volume = vol/soundOffset;

        this.laserFireSound = document.createElement("audio");
        this.laserFireSound.src = "targetingSound.mp3";
        this.laserFireSound.volume = 4.5/soundOffset;
    }
    updateStun() {
        this.stun -= delta;
        if (this.stun <= 0) {
            this.active = true;
            this.stun = 0;
        }
    }
    updateAnimation() {
        if (this.active) {
            this.frame += delta;
            let animationWait = this.getAnimationWait();
            animationWait = animationWait > 0 ? animationWait : this.animationWaitBase;
            if (Number(this.frame.toFixed(0)) % animationWait == 0) {
                this.animation = Number(!this.animation);
                this.frame++;
            }
        }
    }
    getAnimationWait() {
        return Math.abs(Number((this.animationWaitBase/this.ms).toFixed(0)));
    }
    updateCanShoot(speciality, laserDist) {
        let dist = Math.sqrt((this.pt.x - player.pt.x) * (this.pt.x - player.pt.x) + (this.pt.y - player.pt.y) * (this.pt.y - player.pt.y));
        this.canShoot = speciality && dist < laserSpeed * laserDist && this.active && alive;
        if (this.canShoot) this.canShoot = this.hasLOS();
    }
    checkShoot(startPt) {
        if (this.canShoot) {
            let animationWait = this.getAnimationWait() * 10;
            animationWait = animationWait > 0 ? animationWait : this.animationWaitBase * 4;
            if (Number(this.frame.toFixed(0)) % animationWait == 1) {
                lasers.push(new Laser(startPt, -1, 60, false));
                lasers[lasers.length - 1].moveVector = new Vector(player.pt.x + player.w/2 - startPt.x, player.pt.y + player.h/2 - startPt.y);
                lasers[lasers.length - 1].moveVector.scale(lasers[lasers.length - 1].ms);
                this.laserFireSound.play();
            }
        }
    }
    hasLOS() {
        let checkObstructed = new Vector(player.pt.x + player.w/2 - this.pt.x - this.w/2, player.pt.y + player.h/2 - this.pt.y - this.h/2);
        checkObstructed.scale(laserSpeed * 4);
        let tempHB = new HitBox(new Vector(this.pt.x + this.w/2, this.pt.y + this.h/2), 1, 1);
        while (!tempHB.outOfBounds()) {
            tempHB.pt.apply(checkObstructed);
            if (tempHB.checkCollide(player.hb)) return true;
            for (var i in buildings) {
                if (tempHB.checkCollide(buildings[i].hb)) return false;
            }
        }
        return true;
    }
    drawTarget(startPt) {
        if (this.canShoot) {
            context.strokeStyle = "#03b1fc";
            context.beginPath();
            context.moveTo(startPt.x, startPt.y);
            context.lineTo(player.pt.x + player.w/2, player.pt.y + player.h/2);
            context.stroke();

            context.fillStyle = "#ff0055";
            context.fillRect(player.pt.x + player.w * 2/5, player.pt.y + player.h * 2/5, player.w * 1/5, player.h * 1/5);
        }   
    }
    restore(save) {
        super.restore(save);
        this.stun = save.stun;
        this.ms = save.ms;
        this.frame = save.frame;
        this.animation = save.animation;
        this.animationWaitBase = save.animationWaitBase;
        this.canShoot = save.canShoot;
    }
}

class Car extends Enemy {
    type; msIncrease;
    offScreen = false;
    hidden = !Boolean(getRandomInt(0, 5));
    constructor(y, ms, msIncrease) {
        let rand = Math.random();
        let type = 0;
        let tankChance = topScore < softCap * 1/2 ? 0 : 1/10;
        if (rand < tankChance) type = 2;
        else if (rand - tankChance < 1/7) type = 1;

        let w = carWidth;
        if (type == 1) w *= 7/5;
        else if (type == 2) w *= 9/10;
        let h = carHeight;

        let badX = true;
        while (badX) {
            badX = false;
            var x = getRandomInt(0, canvas.width - w);
            let tempHB = new HitBox(new Vector(x - 10, y), w + 20, h);
            for (var i in buildings) {
                if (tempHB.checkCollide(buildings[i].hb)) {
                    badX = true;
                    break;
                }
            }
        }
        let pt = new Vector(x, y);

        super(pt, w, h, ms, "carHitSound.mp3", 2.0);

        if (type == 1) this.ms *= 7/5;
        else if (type == 2) this.ms *= 1/2;
        this.offScreen = false;
        this.type = type;
        this.msIncrease = msIncrease;
        if (this.hidden) this.pt.x = -9999;
    }
    update() {
        if (!this.hidden) {
            if (this.type == 2) this.stun = 0;
            this.updateStun();
            this.updateAnimation();
            if (this.active) {
                this.pt.x += this.ms * delta;
                this.updateCanShoot(this.type == 2, 80);
                this.checkShoot(new Vector(this.ms > 0 ? this.pt.x + this.w : this.pt.x, this.pt.y + this.h * 4/17));
                if (this.hb.outOfBounds()) this.ms *= -1;
            }
            for (var i in buildings) {
                if (this.hb.checkCollide(buildings[i].hb)) {
                    this.ms *= -1;
                    break;
                }
            }
        }

        if (this.pt.y > canvas.height && !this.offScreen) {
            let y = this.pt.y - (1.5 * carHeight) * 10;

            var newMs = this.ms + this.msIncrease;
            if (this.type == 1) newMs *= 5/7;
            else if (this.type == 2) newMs *= 2;
            cars.push(new Car(y, newMs, this.msIncrease)); // always spawn new car

            if (Math.random() < ((topScore/(softCap * 3) > 1/3 ? 1/3 : topScore/(softCap * 3)))) {
                ufos.push(new Ufo(y));
            }

            if (Math.random() < buildingBlockCount/10 && !justPlaced) {
                buildings.push(new Building(y - (1.5 * carHeight) * 2));
                justPlaced = true;
            }
            else justPlaced = false;

            if (Math.random() < 1/15 && landSlideWait < 0) {
                landSlides.push(new LandSlide(y + 1.5 * carHeight));
                landSlideWait = 10;
            }
            else landSlideWait--;

            if (Math.random() < (topScore % softCap/3)/(softCap/3) && topScore >= spawnLife) {
                spawnLife += softCap/3;
                pickUps.push(new PickUp(y, texLifePickUp, 11, 10, () => lives++ ));
            }

            if (Math.random() < 1/25) {
                pickUps.push(new PickUp(y, texCooldownPickUp, 9, 12, () => {
                    qAbility.recharge += 0.05;
                    eAbility.recharge += 0.05;
                    rAbility.recharge += 0.05;
                }));
            }

            if (Math.random() < 1/25) {
                pickUps.push(new PickUp(y, texSpeedPickUp, 16, 27, () => {
                    player.msX += player.msXIncrease;
                    player.msY += player.msYIncrease;
                }));
            }

            this.offScreen = true;
        }
    }
    draw() {
        if (!this.hidden) {
            let dir = this.ms > 0 ? 0 : 1;
            if (this.type == 1) {
                context.drawImage(texBus, posSourceBus[Number(!this.active)][dir][this.animation][0], posSourceCar[Number(!this.active)][dir][this.animation][1], 40, 17, this.pt.x, this.pt.y, this.w, this.h);
            }
            else if (this.type == 2) {
                context.drawImage(texTank, posSourceTank[Number(this.canShoot)][dir][this.animation][0], posSourceTank[Number(this.canShoot)][dir][this.animation][1], 33, 16, this.pt.x, this.pt.y, this.w, this.h);
                this.drawTarget(new Vector(this.ms > 0 ? this.pt.x + this.w : this.pt.x, this.pt.y + this.h * 4/17));
            }
            else {
                context.drawImage(texCar, posSourceCar[Number(!this.active)][dir][this.animation][0], posSourceCar[Number(!this.active)][dir][this.animation][1], 34, 17, this.pt.x, this.pt.y, this.w, this.h);
            }
        }
    }
    restore(save) {
        super.restore(save);
        this.type = save.type;
        this.offScreen = save.offScreen;
        this.msIncrease = save.msIncrease;
        this.hidden = save.hidden;
    }
}

class Ufo extends Enemy {
    move;
    constructor(y) {
        let w = ufoWidth;
        let h = ufoHeight;
        let pt = new Vector(getRandomInt(0, canvas.width - w), y);
        let ms = topScore/softCap * (canvas.width * canvas.width + canvas.height * canvas.height)/(800 * 800) + 1 * delta;
        super(pt, w, h, ms, "ufoHitSound.mp3", soundOffset);

        this.animationWaitBase = 25;

        if (getRandomInt(1, 3) == 1) {
            this.move = new Vector(player.pt.x + player.w/2 - this.pt.x - this.w/2, player.pt.y + player.h/2 - this.pt.y - this.h/2); // punish player for not moving
        }
        else {
            this.move = new Vector(getRandomInt(-12, 12), getRandomInt(3, 5));
        }
        this.hb.pt = new Vector(-1, -1); // break reference to this.pt
        this.hb.useSmallHB(this.pt, this.w, this.h);
        this.move.scale(this.ms);
    }
    update() {
        this.updateStun();
        this.updateAnimation();

        if (this.pt.y > cars[0].pt.y && this.pt.y > canvas.height) ufos.splice(ufos.indexOf(this), 1);
        else if (this.active) {
            this.pt.apply(this.move);
            this.hb.useSmallHB(this.pt, this.w, this.h);
            if (this.hb.outOfBounds()) this.move.x *= -1;
            this.updateCanShoot(topScore > softCap * 3/4, 100);
            this.checkShoot(new Vector(this.pt.x + this.w/2, this.pt.y + this.h * 8/19));
        }
    }
    draw() {
        this.hb.useSmallHB(this.pt, this.w, this.h);
        context.drawImage(texUfo, posSourceUfo[Number(!this.active)][Number(this.canShoot)][this.animation][0], posSourceUfo[Number(!this.active)][Number(this.canShoot)][this.animation][1], 20, 19, this.pt.x, this.pt.y, this.w, this.h);
        this.drawTarget(new Vector(this.pt.x + this.w/2, this.pt.y + this.h * 8/19));
    }
    restore(save) {
        super.restore(save);
        this.move.x = save.move.x;
        this.move.y = save.move.y;
    }
}

class Block extends Thing { // "Arrows" on the side
    animation;
    constructor(pt, i, w, h) {
        super(pt, w, h);
        this.animation = i % 2;
    }
    draw() {
        context.drawImage(texBar, posSourceBar[this.animation][0], posSourceBar[this.animation][1], 14, 11, this.pt.x, this.pt.y, this.w, this.h);
    }
    update() {
        if (this.pt.y < -this.h) this.pt.y = this.pt.y + (this.h * canvas.height/barHeight);
        if (this.pt.y > canvas.height) this.pt.y = this.pt.y - (this.h * canvas.height/barHeight);
    }
    restore(save) {
        super.restore(save);
        this.animation = save.animation;
    }
}

class Building extends Thing {
    widthOfOne;
    buildings = [];
    constructor(y) {
        let h = carHeight * 2.5;
        let widthOfOne = (26 * h/40);
        let maxW = Math.floor((carWidth * 1.5)/widthOfOne);
        let buildingCount = getRandomInt(1, maxW + 1);
        let w = buildingCount * widthOfOne;

        let badX = true;
        while (badX) {
            badX = false;
            var x = getRandomInt(0, canvas.width - w);
            let tempHB = new HitBox(new Vector(x - 10, y), w + 20, h);
            for (var i in cars) {
                if (tempHB.checkCollide(cars[i].hb)) {
                    badX = true;
                    break;
                }
            }
        }
        let pt = new Vector(x, y);
        super(pt, w, h);

        this.buildings = [];
        for (let i = 0; i < buildingCount; i++) {
            let src = getRandomInt(0, 3);
            this.buildings.push(posSourceBuilding[src]);
        }
        this.widthOfOne = widthOfOne;
    }
    draw() {
        for (var i = 0; i < this.buildings.length; i++) {
            context.drawImage(texBuilding, this.buildings[i][0], this.buildings[i][1], 26, 40, this.pt.x + i * this.widthOfOne, this.pt.y, this.widthOfOne, this.h);
        }
    }
    restore(save) {
        super.restore(save);
        this.buildings = save.buildings;
        this.widthOfOne = save.widthOfOne;
    }
}

class ButtonMenu extends Thing {
    text; textSize;
    clicked = 0;
    constructor(pt, w, h, text, textSize) {
        super(pt, w, h);
        this.text = text;
        this.textSize = textSize;
    }
    draw() {
        context.font = this.textSize + "px " + font;;
        if (this.clicked > 0) {
            this.hb.draw("#000000");
            context.fillStyle = "#ffffff";
            context.fillRect(this.pt.x, this.pt.y, this.w, this.h);
            context.fillStyle = "#000000";
            context.fillText(this.text, canvas.width/2, this.pt.y + this.h/2);
        }
        else {
            this.hb.draw("#ffffff");
            context.fillStyle = "#ffffff";
            context.fillText(this.text, canvas.width/2, this.pt.y + this.h/2);
        }
        this.clicked -= delta;
    }
}

class ButtonExtra extends Thing {
    constructor(w, h) {
        super(new Vector(canvas.width - w, 0), w, h);
    }
    draw() {
        context.globalAlpha = 0.8;
        context.drawImage(texPause, posSourcePause[Number(!paused)][0], posSourcePause[Number(!paused)][1], 14, 14, this.pt.x, this.pt.y, this.w, this.h);
        context.globalAlpha = 1;
    }
}

class LandSlide extends Enemy {
    dir;
    constructor(y) {
        let w = canvas.width;
        let h = carHeight * 11.5;

        let MSs = [w/300 * delta, -w/300 * delta];
        let dir = getRandomInt(0, 2);
        let Xs = [0 - w + MSs[0] * -60, canvas.width + MSs[1] * -60]

        super(new Vector(Xs[dir], y), w, h, MSs[dir] * (1 + topScore/softCap), "landSlideSound.mp3", 2.0);
        this.deathSound.play();
        this.dir = dir;
        this.animationWaitBase = 100;
        notices.push(new Notice(120));
    }
    update() {
        if ((this.dir == 0 && this.pt.x > canvas.width) || (this.dir == 1 && this.pt.x + this.w < 0)) {
            landSlides.splice(landSlides.indexOf(this), 1);
        }
        else {
            this.updateAnimation();
            this.pt.x += this.ms;
            let obstacles = [...pickUps, ...cars, player];
            for (var i in obstacles) {
                if (this.hb.checkCollide(obstacles[i].hb)) {
                    obstacles[i].pt.x += this.ms/3;
                    player.hb.useSmallHB(player.pt, player.w, player.h);
                    for (var j in buildings) {
                        if (obstacles[i].hb.checkCollide(buildings[j].hb)) {
                            obstacles[i].pt.x = this.ms > 0 ? buildings[j].pt.x - obstacles[i].hb.w : buildings[j].pt.x + buildings[j].hb.w;
                            obstacles[i].pt.x -= (obstacles[i].w - obstacles[i].hb.w)/2; // for player
                        }
                    }
                    if (obstacles[i].hb.outOfBounds()) {
                        obstacles[i].pt.x = this.ms > 0 ? canvas.width - obstacles[i].w : 0;
                    }
                }
            }
            this.draw();
        }
    }
    draw() {
        context.drawImage(texLandSlide, posSourceLandSlide[Number(!Boolean(this.dir))][this.animation][0], posSourceLandSlide[Number(!Boolean(this.dir))][this.animation][1], 82, 40, this.pt.x, this.pt.y, this.w, this.h);
    }
}

class Notice extends Thing {
    frames;
    constructor(frames) {
        let w = 1.5 * carWidth;
        super(new Vector((canvas.width - w)/2, (canvas.height - w)/2), w, w);
        this.frames = frames;
    }
    draw() {
        if (this.frames > 0) {
            context.globalAlpha = textOpacity;
            context.drawImage(texWarning, 0, 0, 20, 19, this.pt.x, this.pt.y, this.w, this.h);
            context.globalAlpha = 1;
            context.font = carHeight/2 + "px " + font;
            context.fillStyle = "rgba(255,255,255," + textOpacity + ")";
            context.fillText("Incoming", this.pt.x + this.w/2, this.pt.y + this.h + carHeight/2);
            if (!paused) this.frames -= delta;
        }
        else notices.splice(notices.indexOf(this), 1);
    }
}

class PickUp extends Thing {
    tex; srcW; srcH; action; minY; src;
    bounce = delta/3;
    constructor(y, tex, srcW, srcH, action) {
        let w = carHeight * 3/5;
        let h = carHeight * 3/5;
        
        let badX = true;
        while (badX) {
            badX = false;
            var x = getRandomInt(0, canvas.width - w);
            let tempHB = new HitBox(new Vector(x - 10, y), w + 20, h);
            for (var i in buildings) {
                if (tempHB.checkCollide(buildings[i].hb)) {
                    badX = true;
                    break;
                }
            }
        }
        let pt = new Vector(x, y);
        super(pt, w, w);
        
        this.tex = tex;
        this.srcW = srcW;
        this.srcH = srcH;
        this.action = action;
        this.minY = y;
        this.src = tex.src;
    }
    updateBounce() {
        this.pt.y += this.bounce;
        if (this.pt.y < this.minY || this.pt.y + this.h > this.minY + this.h * 5/3) this.bounce *= -1;  
    }
    update() {
        this.updateBounce();
        if (this.hb.checkCollide(player.hb)) {
            this.action();
            pickUps.splice(pickUps.indexOf(this), 1);
        }
        this.draw();
    }
    draw() {
        context.drawImage(this.tex, 0, 0, this.srcW, this.srcH, this.pt.x, this.pt.y, this.w, this.h);
    }
    restore(save) {
        super.restore(save);
        this.srcW = save.srcW;
        this.srcH = save.srcH;
        this.tex.src = save.src;
        this.action = save.action;
        this.minY = save.minY;
        this.bounce = save.bounce;
    }
}