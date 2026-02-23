const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1200;
canvas.height = 650;

/* =============================
   WORLD PHYSICS
============================= */

let wind = (Math.random()-0.5)*0.3;
let screenShake = 0;

/* =============================
   PLAYER TANK
============================= */

let player = {
    x:200,
    y:480,
    w:100,
    h:55,
    recoil:0,
    muzzleFlash:0,
    armor:120
};

/* Mouse aiming */

let mouse={x:0,y:0};

canvas.addEventListener("mousemove",e=>{
    let r=canvas.getBoundingClientRect();
    mouse.x=e.clientX-r.left;
    mouse.y=e.clientY-r.top;
});

/* =============================
   GAME OBJECTS
============================= */

let bullets=[];
let particles=[];
let enemies=[];
let enemyCount=6;

/* =============================
   SPAWN ENEMY SQUAD AI
============================= */

function spawnEnemies(){

    enemies=[];

    for(let i=0;i<6;i++){

        enemies.push({
            x:500+i*150,
            y:460+Math.random()*40,
            baseY:460,
            w:100,
            h:55,
            armor:100,
            hp:100,
            alive:true,
            flankDir:Math.random()<0.5?-1:1,
            cooldown:Math.random()*120
        });
    }
}

spawnEnemies();

/* =============================
   SOUND HOOK
============================= */

function playSound(src){
    try{ new Audio(src).play(); }
    catch(e){}
}

/* =============================
   TERRAIN DRAW (PLAINS WAR ZONE)
============================= */

function drawGround(){

    let g=ctx.createLinearGradient(0,400,0,canvas.height);

    g.addColorStop(0,"#3b4a2f");
    g.addColorStop(1,"#1a1f1a");

    ctx.fillStyle=g;
    ctx.fillRect(0,400,canvas.width,canvas.height);
}

/* =============================
   TANK RENDERING (DEPTH SCALE)
============================= */

function drawTank(tank,isPlayer=false){

    let depthScale = 1 - (600 - tank.x)/2500;
    depthScale = Math.max(0.7,depthScale);

    let w = tank.w * depthScale;
    let h = tank.h * depthScale;

    ctx.save();

    ctx.translate(tank.x,tank.y);

    /* Body */
    ctx.fillStyle="#555";
    ctx.fillRect(-w/2,-h/2,w,h);

    /* Tracks */
    ctx.fillStyle="#333";
    ctx.fillRect(-w/2,h/3,w,12);

    /* Turret rotation */

    let turretAngle;

    if(isPlayer){
        turretAngle=Math.atan2(
            mouse.y-tank.y,
            mouse.x-tank.x
        );
    }else{
        turretAngle=tank.turretAngle;
    }

    ctx.rotate(turretAngle);

    /* Barrel */
    ctx.fillStyle="#777";
    ctx.fillRect(20,-6,60,12);

    ctx.restore();
}

/* =============================
   SHOOTING PHYSICS
============================= */

window.addEventListener("keydown",e=>{
    if(e.code==="Space") shoot();
});

function shoot(){

    player.recoil=20;
    player.muzzleFlash=8;

    let angle=Math.atan2(
        mouse.y-player.y,
        mouse.x-player.x
    );

    bullets.push({
        x:player.x,
        y:player.y,
        vx:Math.cos(angle)*35,
        vy:Math.sin(angle)*35,
        life:160
    });

    screenShake=10;
}

/* =============================
   EXPLOSION SYSTEM
============================= */

function explosion(x,y){

    for(let i=0;i<45;i++){

        particles.push({
            x,y,
            vx:(Math.random()-0.5)*10,
            vy:(Math.random()-0.5)*10,
            life:120
        });
    }

    playSound("explosion.mp3");
}

/* Shockwave ring */
function shockwave(x,y){

    for(let r=2;r<40;r+=4){

        particles.push({
            x:x+(Math.random()-0.5)*5,
            y:y+(Math.random()-0.5)*5,
            vx:Math.cos(r)*6,
            vy:Math.sin(r)*6,
            life:60
        });
    }
}

/* =============================
   ENEMY AI SQUAD BEHAVIOR
============================= */

function enemyAI(enemy){

    enemy.cooldown--;

    /* Flanking movement */

    enemy.x += enemy.flankDir * 0.4;

    if(Math.random()<0.005){
        enemy.flankDir*=-1;
    }

    /* Aim player */

    enemy.turretAngle=Math.atan2(
        player.y-enemy.y,
        player.x-enemy.x
    );

    if(enemy.cooldown<=0){

        enemy.cooldown=140+Math.random()*120;

        let dx=player.x-enemy.x;
        let dy=player.y-enemy.y;

        let dist=Math.sqrt(dx*dx+dy*dy);

        bullets.push({
            x:enemy.x,
            y:enemy.y,
            vx:(dx/dist)*25+wind,
            vy:(dy/dist)*25,
            life:160
        });

        explosion(enemy.x,enemy.y);
    }
}

/* =============================
   COLLISION + ARMOR SYSTEM
============================= */

function hitTest(a,b){
    return a.x<b.x+b.w &&
           a.x+a.w>b.x &&
           a.y<b.y+b.h &&
           a.y+a.h>b.y;
}

/* Armor penetration simulation */
function damageArmor(enemy){

    enemy.hp -= 25;

    if(enemy.hp<=0){
        enemy.alive=false;
        enemyCount--;
        shockwave(enemy.x,enemy.y);
    }
}

/* =============================
   GAME LOOP
============================= */

function update(){

    requestAnimationFrame(update);

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawGround();

    /* Screen vibration */
    if(screenShake>0){
        ctx.save();
        ctx.translate(
            (Math.random()-0.5)*screenShake,
            (Math.random()-0.5)*screenShake
        );
        screenShake*=0.85;
    }

    /* Player recoil physics */

    if(player.recoil>0){
        player.x-=player.recoil*0.1;
        player.recoil*=0.85;
    }

    /* Player muzzle glow */

    if(player.muzzleFlash>0){

        ctx.fillStyle="rgba(255,200,50,0.6)";
        ctx.beginPath();
        ctx.arc(player.x+60,player.y,25,0,Math.PI*2);
        ctx.fill();

        player.muzzleFlash--;
    }

    drawTank(player,true);

    /* Bullets */

    ctx.fillStyle="orange";

    bullets.forEach(b=>{

        b.x+=b.vx+wind;
        b.y+=b.vy;
        b.vy+=0.04;
        b.life--;

        ctx.fillRect(b.x,b.y,12,4);

        enemies.forEach(enemy=>{
            if(enemy.alive && hitTest(
                {x:b.x,y:b.y,w:12,h:4},
                {x:enemy.x-50,y:enemy.y-30,w:100,h:60}
            )){
                explosion(enemy.x,enemy.y);
                shockwave(enemy.x,enemy.y);
                damageArmor(enemy);
            }
        });
    });

    bullets=bullets.filter(b=>b.life>0);

    /* Particles */

    ctx.fillStyle="#ff8800";

    particles.forEach(p=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;

        ctx.fillRect(p.x,p.y,3,3);
    });

    particles=particles.filter(p=>p.life>0);

    /* Enemy Squad */

    enemies.forEach(enemy=>{
        if(enemy.alive){
            drawTank(enemy,false);
            enemyAI(enemy);
        }
    });

    if(enemyCount<=0){
        ctx.fillStyle="white";
        ctx.font="70px Arial";
        ctx.fillText("VICTORY",420,320);
    }
}

update();
