const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; // internal resolution
canvas.height = 600;

const TILE = 40;
const COLS = 20;
const ROWS = 15;

const KEY = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

window.addEventListener('keydown', e => {
    if (e.code in KEY) {
        KEY[e.code] = true;
        e.preventDefault();
    }
});
window.addEventListener('keyup', e => {
    if (e.code in KEY) {
        KEY[e.code] = false;
        e.preventDefault();
    }
});

class Tank {
    constructor(x, y, color, isEnemy=false) {
        this.x = x;
        this.y = y;
        this.dir = 0; // 0 up,1 right,2 down,3 left
        this.color = color;
        this.isEnemy = isEnemy;
        this.cooldown = 0;
        this.steps = 0; // for enemy AI
    }

    move(dx, dy, map) {
        const nx = this.x + dx;
        const ny = this.y + dy;
        if (!hitWall(nx, ny, map)) {
            this.x = nx;
            this.y = ny;
        }
    }

    update(map, target) {
        if (this.isEnemy) {
            if (this.steps <= 0 || hitWall(this.x + dirs[this.dir].dx, this.y + dirs[this.dir].dy, map)) {
                this.dir = Math.floor(Math.random()*4);
                this.steps = 30 + Math.random()*60;
            }
            this.move(dirs[this.dir].dx, dirs[this.dir].dy, map);
            this.steps--;
            if (Math.random() < 0.02) this.shoot();
        } else {
            if (KEY.ArrowUp)  { this.dir = 0; this.move(0,-2,map); }
            if (KEY.ArrowRight){ this.dir = 1; this.move(2,0,map); }
            if (KEY.ArrowDown){ this.dir = 2; this.move(0,2,map); }
            if (KEY.ArrowLeft){ this.dir = 3; this.move(-2,0,map); }
            if (KEY.Space) { this.shoot(); KEY.Space=false; }
        }
        if (this.cooldown>0) this.cooldown--;
    }

    shoot() {
        if (this.cooldown<=0) {
            const d = dirs[this.dir];
            bullets.push(new Bullet(this.x + TILE/2, this.y + TILE/2, this.dir, this));
            this.cooldown = 20;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, TILE, TILE);
    }
}

class Bullet {
    constructor(x,y,dir,owner) {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.owner = owner;
        this.active = true;
    }

    update(map, tanks) {
        this.x += dirs[this.dir].dx*4;
        this.y += dirs[this.dir].dy*4;
        if (hitWall(this.x-4, this.y-4, map)) {
            this.active = false;
            return;
        }
        for (const t of tanks) {
            if (t!==this.owner && rectIntersect(this.x-2,this.y-2,4,4,t.x,t.y,TILE,TILE)) {
                this.active=false;
                t.dead=true;
                break;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle='#fff';
        ctx.fillRect(this.x-2,this.y-2,4,4);
    }
}

const dirs = [
    {dx:0,dy:-2},
    {dx:2,dy:0},
    {dx:0,dy:2},
    {dx:-2,dy:0}
];

function rectIntersect(x1,y1,w1,h1,x2,y2,w2,h2){
    return !(x2>x1+w1 || x2+w2<x1 || y2>y1+h1 || y2+h2<y1);
}

function hitWall(x,y,map){
    const col = Math.floor(x/TILE);
    const row = Math.floor(y/TILE);
    if(col<0||col>=COLS||row<0||row>=ROWS) return true;
    return map[row][col]===1;
}

const map = [];
for(let r=0;r<ROWS;r++){
    const row=[];
    for(let c=0;c<COLS;c++){
        if(r===0||c===0||r===ROWS-1||c===COLS-1){
            row.push(1); // border walls
        }else if(Math.random()<0.1){
            row.push(1); // random blocks
        }else{
            row.push(0);
        }
    }
    map.push(row);
}

const player = new Tank(TILE*2, TILE*(ROWS-3), 'green');
const enemies = [
    new Tank(TILE*(COLS-3), TILE*2, 'red', true),
    new Tank(TILE*(COLS-5), TILE*2, 'red', true),
    new Tank(TILE*(COLS-7), TILE*2, 'red', true)
];
let bullets=[];

function update(){
    player.update(map);
    for(const e of enemies){ if(!e.dead) e.update(map, player); }
    for(const b of bullets){ b.update(map, [player, ...enemies]); }
    bullets = bullets.filter(b=>b.active);
    checkGameState();
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw map
    ctx.fillStyle='#444';
    for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLS;c++){
            if(map[r][c]===1){
                ctx.fillRect(c*TILE,r*TILE,TILE,TILE);
            }
        }
    }
    player.draw(ctx);
    for(const e of enemies){ if(!e.dead) e.draw(ctx); }
    for(const b of bullets){ b.draw(ctx); }
}

function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
}

let gameOver=false;
function checkGameState(){
    if(player.dead){
        gameOver=true;
        alert('Game Over');
    }
    if(enemies.every(e=>e.dead)){
        gameOver=true;
        alert('You Win!');
    }
}

loop();
