const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

/* =============================
   CINEMATIC CAMERA
============================= */

let cameraShake = 0;

/* =============================
   PLAYER TANK
============================= */

let player = {
    x:150,
    y:430,
    w:75,
    h:45,
    health:100,
    recoil:0
};

/* =============================
   GAME OBJECTS
============================= */

let bullets=[];
let particles=[];
let enemies=[];
let enemyCount=4;

/* Battlefield ground */
let groundY=460;

/* =============================
   SOUND HOOKS (Add files later)
============================= */

function playSound(src){
    try{ new Audio(src).play(); }
    catch(e){}
}

/* =============================
   ENEMY AI TANKS (REALISTIC AIMING)
============================= */

function spawnEnemies(){

    enemies=[];

    for(let i=0;i<4;i++){

        enemies.push({
            x:400+i*140,
            y:150+Math.random()*60,
            w:60,
            h:40,
            alive:true,
            cooldown:Math.random()*120
        });
    }
}

spawnEnemies();

/* =============================
   SHOOTING PHYSICS (MOVIE SHELLS)
============================= */

window.addEventListener("keydown",e=>{
    if(e.code==="Space"){
        shoot();
    }

    if(e.code==="ArrowUp"){
        player.y-=14;
        if(player.y<280) player.y=280;
    }
});

function shoot(){

    player.recoil=18;
    cameraShake=12;

    bullets.push({
        x:player.x+player.w,
        y:player.y+18,
        vx:26+Math.random()*3,
        vy:(Math.random()-0.5)*2,
        life:140
    });

    createDust(player.x,player.y);

    playSound("shoot.mp3");
}

/* =============================
   EXPLOSION SYSTEM
============================= */

function explode(x,y){

    for(let i=0;i<35;i++){

        particles.push({
            x,y,
            vx:(Math.random()-0.5)*8,
            vy:(Math.random()-0.5)*8,
            life:80+Math.random()*40
        });
    }

    playSound("explosion.mp3");
}

/* Dust battlefield effect */
function createDust(x,y){

    for(let i=0;i<15;i++){

        particles.push({
            x:x+Math.random()*40,
            y:y+Math.random()*30,
            vx:(Math.random()-0.5)*3,
            vy:Math.random()*-2,
            life:50
        });
    }
}

/* =============================
   COLLISION
============================= */

function hitTest(a,b){
    return a.x<b.x+b.w &&
           a.x+a.w>b.x &&
           a.y<b.y+b.h &&
           a.y+a.h>b.y;
}

/* =============================
   ENEMY AI COMBAT LOGIC
============================= */

function enemyAI(enemy){

    enemy.cooldown--;

    if(enemy.cooldown<=0){

        enemy.cooldown=120+Math.random()*80;

        /* Lead target shot physics */
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;

        let dist = Math.sqrt(dx*dx+dy*dy);

        bullets.push({
            x:enemy.x,
            y:enemy.y+15,
            vx: -12*(dx/dist)+Math.random(),
            vy: -2 + Math.random()*2,
            life:160
        });

        cameraShake=6;
        playSound("enemy_shot.mp3");
    }
}

/* =============================
   GAME LOOP
============================= */

function update(){

    requestAnimationFrame(update);

    ctx.save();

    if(cameraShake>0){
        ctx.translate(
            (Math.random()-0.5)*cameraShake,
            (Math.random()-0.5)*cameraShake
        );

        cameraShake*=0.85;
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);

    /* Background battlefield haze */
    let gradient=ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0,"#2a2a2a");
    gradient.addColorStop(1,"#101010");

    ctx.fillStyle=gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    /* Ground */
    ctx.fillStyle="#222";
    ctx.fillRect(0,groundY,canvas.width,140);

    /* Player recoil physics */
    if(player.recoil>0){
        player.x-=player.recoil*0.08;
        player.recoil*=0.85;
    }

    /* Player tank */
    ctx.fillStyle="#666";
    ctx.fillRect(player.x,player.y,player.w,player.h);

    /* =====================
       BULLETS (REALISTIC)
    ===================== */

    ctx.fillStyle="orange";

    bullets.forEach((b,bi)=>{

        b.x+=b.vx;
        b.y+=b.vy;
        b.vy+=0.05; // gravity arc physics
        b.life--;

        ctx.fillRect(b.x,b.y,10,4);

        enemies.forEach(enemy=>{

            if(enemy.alive && hitTest(
                {x:b.x,y:b.y,w:10,h:4},
                enemy
            )){
                enemy.alive=false;
                enemyCount--;

                explode(enemy.x,enemy.y);

                document.getElementById("enemies")
                    .innerText=enemyCount;
            }
        });
    });

    bullets=bullets.filter(b=>b.life>0);

    /* =====================
       PARTICLES
    ===================== */

    ctx.fillStyle="#ff8800";

    particles.forEach(p=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;

        ctx.fillRect(p.x,p.y,3,3);
    });

    particles=particles.filter(p=>p.life>0);

    /* =====================
       ENEMY TANK DRAW + AI
    ===================== */

    ctx.fillStyle="#990000";

    enemies.forEach(enemy=>{
        if(enemy.alive){
            ctx.fillRect(enemy.x,enemy.y,enemy.w,enemy.h);
            enemyAI(enemy);
        }
    });

    ctx.restore();

    /* =====================
       WIN SCREEN
    ===================== */

    if(enemyCount<=0){
        ctx.fillStyle="white";
        ctx.font="60px Arial";
        ctx.fillText("Battle Won",340,300);
        return;
    }
}

update();
