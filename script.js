const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.height = 600;
canvas.width = 600;

const pressed = {
    up: false,
    right: false,
    down: false,
    left: false,
    space: false,
};

document.addEventListener("keydown", ev => {
    switch (ev.code) {
        case "ArrowUp":
            return pressed.up = true;
        case "ArrowRight":
            return pressed.right = true;
        case "ArrowDown":
            return pressed.down = true;
        case "ArrowLeft":
            return pressed.left = true;
        case "Space":
            return pressed.space = true;
    }
});

document.addEventListener("keyup", ev => {
    switch (ev.code) {
        case "ArrowUp":
            return pressed.up = false;
        case "ArrowRight":
            return pressed.right = false;
        case "ArrowDown":
            return pressed.down = false;
        case "ArrowLeft":
            return pressed.left = false;
        case "Space":
            return pressed.space = false;
    }
});

const health = {
    x: 10,
    y: 30,
    point: 3,
    draw: function () {
        if (this.point <= 0)
            end();
        ctx.font = "20px DotGothic16";
        ctx.fillStyle = "white";
        ctx.fillText(`Health: ${this.point}`, this.x, this.y);
    },
};

const score = {
    x: 10,
    y: 60,
    point: 0,
    draw: function () {
        ctx.font = "20px DotGothic16";
        ctx.fillStyle = "white";
        ctx.fillText(`Score: ${this.point}`, this.x, this.y);
    },
};

const ship = {
    x: (canvas.width - 50) / 2,
    y: canvas.height - 60,
    height: 50,
    width: 50,
    speed: 4,
    image: document.getElementById("ship"),
    invincible: true,
    blink: false,
    time: 0,
    draw: function () {
        if (this.invincible) {
            this.time++;
            this.blink = this.time % 25 < 12;
            if (this.time > 150) {
                this.invincible = false;
                this.blink = false;
                this.time = 0;
            }
        }
        if (this.speed < 8)
            this.speed = 4 + score.point / 200;
        if (pressed.up && this.y > 0)
            this.y -= this.speed;
        if (pressed.right && this.x + this.width < canvas.width)
            this.x += this.speed;
        if (pressed.down && this.y + this.height < canvas.height)
            this.y += this.speed;
        if (pressed.left && this.x > 0)
            this.x -= this.speed;
        if (!this.blink)
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    },
};

function Enemy() {
    this.x = Math.floor(Math.random() * (canvas.width - 50));
    this.y = -50;
    this.height = 38;
    this.width = 50;
    this.speed = 4;
    this.image = document.getElementById("enemy");
    this.moves = [
        () => {
            this.y += this.speed / 2;
        },
        () => {
            this.y += this.speed / 2;
            this.x -= this.speed / 2;
        },
        () => {
            this.y += this.speed / 2;
            this.x += this.speed / 2;
        },
        () => {
            this.y += this.speed;
        },
    ];
    this.move = this.moves[0];
    this.random = function () {
        this.x = Math.floor(Math.random() * (canvas.width - this.width));
        this.y = 0;
    };
    this.draw = function () {
        if (this.x < 0)
            this.move = this.moves[2];
        if (this.x + this.width > canvas.width)
            this.move = this.moves[1];
        if (this.y > canvas.height)
            this.random();
        if (!ship.invincible && ship.x <= this.x + this.width && ship.x + ship.width >= this.x && ship.y <= this.y + this.height && ship.y > this.y) {
            health.point--;
            ship.invincible = true;
            pressed.space = false;
            this.random();
        }
        this.move();
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    };
}

const enemies = [];

function Laser() {
    this.x = 0;
    this.y = 0;
    this.height = 40;
    this.width = 4;
    this.speed = 10;
    this.sound = {
        audio: document.getElementById("laser"),
        play: function () {
            this.audio.currentTime = 0;
            this.audio.play();
        },
    };
    this.draw = function () {
        enemies.forEach(enemy => {
            if (this.x <= enemy.x + enemy.width && this.x + this.width >= enemy.x && this.y <= enemy.y + enemy.height && this.y > enemy.y) {
                score.point += 10;
                enemy.y = -50;
                enemy.x = Math.floor(Math.random() * (canvas.width - enemy.width));
                this.y = -500;
            }
        });
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();
        ctx.closePath();
        this.y -= this.speed;
    };
}

const lasers = [new Laser(), new Laser(), new Laser()];

const fire = {
    i: 0,
    draw: function () {
        lasers.forEach(laser => laser.draw());

        if (!(pressed.space && (lasers[this.i].sound.audio.currentTime > 0.3 || lasers[this.i].sound.audio.paused)))
            return;

        if (lasers[this.i].y > 0) {
            this.i++;
            this.i = this.i === 3 ? 0 : this.i;
        }

        lasers[this.i].x = ship.x + ship.width / 2 - lasers[this.i].width / 2;
        lasers[this.i].y = ship.y;
        lasers[this.i].sound.play();
    },
};

const foes = {
    difficulty: 1,
    draw: function () {
        enemies.forEach(enemy => {
            if (enemy.speed < 8)
                enemy.speed = 2 + score.point / 250;
            enemy.draw();
        });

        if (score.point % (40 * Math.pow(2, this.difficulty)) === 0 && score.point !== 0)
            this.difficulty++;

        if (enemies.length < this.difficulty && enemies.length < 9) {
            const foe = new Enemy();
            foe.move = foe.moves[enemies.length % foe.moves.length];
            enemies.push(foe);
        }
    }
};

const GAME_PLAY = 1;
const GAME_PAUSE = 0;

let status = GAME_PAUSE;

const home = () => {
    health.draw();
    score.draw();

    ctx.fillStyle = "white";
    ctx.font = "48px DotGothic16";
    ctx.fillText(`Fly Fighter`, 160, 400);

    ctx.font = "20px DotGothic16";
    ctx.fillText(`Click to Play`, 200, 430);
    ctx.fillText(`Press Arrow Keys to Move`, 160, 470);
    ctx.fillText(`Press Space to Fire`, 160, 500);

    canvas.addEventListener("click", start);
}

const start = () => {
    canvas.removeEventListener("click", start);
    status = GAME_PLAY;
    health.point = 3;
    score.point = 0;
    ship.x = (canvas.width - 50) / 2;
    ship.y = canvas.height - 60;
    enemies.length = 0;
    enemies.push(new Enemy());
    foes.difficulty = 1;
    lasers.forEach(laser => laser.y = -500);
    play();
};

const play = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ship.draw();
    fire.draw();
    foes.draw();

    health.draw();
    score.draw();

    if (status === GAME_PLAY)
        requestAnimationFrame(play);
};

const end = () => {
    status = GAME_PAUSE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "20px DotGothic16";
    ctx.fillStyle = "white";
    ctx.fillText(`Game Over`, 250, 430);

    ctx.beginPath();
    ctx.rect(190, 450, 230, 30);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.fillText(`Click to Restart Game`, 200, 470);
    canvas.addEventListener("click", start);
};

home();