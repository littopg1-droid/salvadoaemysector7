/*
 * IRVING: RESCATE DE EMY — videojuego de plataformas 2D.
 * Hecho con HTML5 Canvas + JavaScript puro, sin dependencias.
 * Para personalizar la historia, edita LEVELS y STORY al inicio.
 */
(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = 960, HEIGHT = 540, FLOOR = 492;
  const G = 1750, SPEED = 270, JUMP = -670;
  const $ = id => document.getElementById(id);

  const STORY = {
    intro: 'La colonia está bajo ataque. Una facción renegada ha capturado a Emy y la mantiene prisionera en la Torre del Núcleo. Irving deberá atravesar las ruinas, recuperar células de energía y liberarla antes de que el Sector 7 quede a oscuras.',
    interludes: [
      'Irving asegura el perímetro y recupera la primera señal del comunicador de Emy. Su voz se escucha entre interferencias: «¡Estoy en el Núcleo, Irving!». La búsqueda continúa.',
      'El Núcleo vuelve a tener energía. Irving detecta una señal vital: Emy está en el piso superior de la Torre de las Sombras. Solo el Centinela renegado bloquea el camino.',
    ],
    victory: '¡MISIÓN CUMPLIDA! Irving desactiva la prisión de energía y rescata a Emy. Juntos logran regresar a la colonia. En 2145, el Sector 7 recordará a quien nunca dejó de buscarla. ♥'
  };

  const LEVELS = [
    {
      name:'PERÍMETRO EN LLAMAS', location:'PERÍMETRO NORTE', width:2880, need:4, tone:'#59e9f6', accent:'#ff688c',
      narrative:'La Alerta Roja ha comenzado. Abre camino por el perímetro y recoge 4 células para restaurar la primera puerta.',
      ground:[[0,620],[750,1300],[1420,2090],[2220,2880]],
      platforms:[[305,401,170],[905,391,175],[1520,401,165],[1730,333,142],[2375,396,176],[2585,331,136]],
      cells:[[190,451],[404,365],[835,451],[998,354],[1186,450],[1510,451],[1810,302],[1980,449],[2390,358],[2630,300]],
      enemies:[[465,425,555,65],[1040,905,1210,60],[1670,1480,1870,68],[2340,2270,2480,58],[2670,2500,2780,75]],
      spikes:[[570,36],[1894,48],[2450,36]], lasers:[], checkpoint:1540, gate:2794,
    },
    {
      name:'EL NÚCLEO OSCURO', location:'CENTRO ENERGÉTICO', width:3110, need:5, tone:'#77d7ff', accent:'#dd6dff',
      narrative:'La facción saboteó el sistema. Esquiva los láseres intermitentes, derrota los drones y reactiva el Núcleo.',
      ground:[[0,610],[745,1330],[1470,1995],[2120,2660],[2790,3110]],
      platforms:[[345,394,168],[895,399,148],[1120,340,140],[1570,405,173],[1805,336,156],[2310,394,166],[2840,386,142]],
      cells:[[175,451],[416,360],[828,451],[1000,365],[1190,301],[1520,450],[1670,368],[1842,300],[2190,451],[2405,358],[2820,451],[2930,352]],
      enemies:[[410,335,570,70],[940,800,1210,90],[1590,1480,1770,62],[1865,1760,1950,72],[2315,2210,2470,85],[2890,2800,3010,75]],
      spikes:[[545,35],[1130,43],[1740,40],[2550,42]],lasers:[[1260,0],[2395,1.4],[2870,2.7]], checkpoint:1555, gate:3010,
    },
    {
      name:'TORRE DE LAS SOMBRAS', location:'TORRE DEL VIGÍA', width:3310, need:5, tone:'#ff86ac', accent:'#80ebff',
      narrative:'Emy está cerca. Reúne 5 células y derrota al CENTINELA para abrir la prisión de energía. ¡No te rindas!',
      ground:[[0,635],[770,1410],[1540,2170],[2290,3310]],
      platforms:[[290,403,181],[900,393,180],[1155,325,148],[1640,392,173],[1855,324,166],[2375,390,184],[2570,319,145]],
      cells:[[170,449],[381,368],[820,450],[955,357],[1245,294],[1570,451],[1715,357],[1900,291],[2330,449],[2440,351],[2700,450],[3015,450]],
      enemies:[[485,365,580,82],[955,820,1150,85],[1660,1570,1860,80],[2410,2340,2550,95]],
      spikes:[[585,39],[1285,48],[2035,50],[2595,48]],lasers:[[1785,1.1],[2510,2.4]], checkpoint:1600, gate:3170,
      boss:{x:2890,min:2810,max:3010,hp:6}
    }
  ];

  const keys = new Set();
  const touch = {left:false,right:false,jump:false,shoot:false,interact:false};
  let levelIndex=0, level=null, player=null, stage='menu', overlayMode='menu';
  let cameraX=0, tick=0, last=0, bullets=[], hostileBullets=[], particles=[], stars=[];
  let shootingCooldown=0, actionCooldown=0, checkpointReached=false, toastUntil=0, lastInteraction=false;
  let muted=true, audio=null, score=0, defeatCount=0;
  const portrait = new Image();
  portrait.src = 'assets/irving-retrato.jpg';

  function rnd(n){return (Math.sin(n * 127.1 + 78.23) * 43758.5453123) % 1;}
  function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
  function overlap(a,b){return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;}
  function dist(x1,y1,x2,y2){return Math.hypot(x1-x2,y1-y2);}
  function near(a,b){return Math.abs(a-b) < 82;}
  function updateHUD(){
    $('healthHud').textContent='♥ '.repeat(player?.health??3).trim() || 'SIN ESCUDO';
    $('cellHud').textContent=`${player?.cells??0} / ${level?.need??4}`;
    $('levelHud').textContent=`0${levelIndex+1} / 03`;
    $('levelName').textContent=level?.name??LEVELS[0].name;
    $('worldLabel').textContent=`SECTOR 7 — ${level?.location??LEVELS[0].location}`;
    let detail = `Recoge ${level?.need??4} células y llega a la puerta.`;
    if(levelIndex===2) detail=level?.boss?.alive!==false ? 'Recoge 5 células y derrota al Centinela.' : '¡Centinela neutralizado! Rescata a Emy.';
    $('objectiveText').textContent='OBJETIVO:';
    $('objectiveDetail').textContent=detail;
  }
  function showToast(msg,seconds=2.5){
    $('toast').textContent=msg; $('toast').classList.add('show'); toastUntil=performance.now()+seconds*1000;
  }
  function sfx(kind){
    if(muted)return;
    try {
      audio ??= new (window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')audio.resume();
      const note=(freq,time,type='square',gain=.035,offset=0)=>{
        const o=audio.createOscillator(), g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime+offset);
        g.gain.setValueAtTime(gain,audio.currentTime+offset);
        g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+offset+time);
        o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+offset);o.stop(audio.currentTime+offset+time);
      };
      if(kind==='jump')note(240,.12);
      if(kind==='shoot')note(480,.09,'sawtooth',.028);
      if(kind==='collect'){note(630,.11,'triangle',.08);note(940,.17,'triangle',.06,.08);}
      if(kind==='hurt')note(110,.3,'sawtooth',.08);
      if(kind==='win'){[520,660,880,1040].forEach((n,i)=>note(n,.26,'triangle',.065,i*.14));}
      if(kind==='boss')note(70,.35,'sawtooth',.08);
    }catch(e){/* Si el navegador no soporta audio, el juego sigue. */}
  }
  function switchSound(){muted=!muted;$('soundText').textContent=muted?'OFF':'ON';$('soundBtn').setAttribute('aria-label',muted?'Activar sonido':'Desactivar sonido');if(!muted)sfx('collect');}

  function setupLevel(idx,saveProgress=true){
    levelIndex=idx;
    const src=LEVELS[idx];
    level={...src,
      platforms:src.platforms.map(([x,y,w])=>({x,y,w,h:20})),
      ground:src.ground.map(([a,b])=>({x:a,y:FLOOR,w:b-a,h:HEIGHT-FLOOR})),
      cells:src.cells.map(([x,y])=>({x,y,got:false})),
      enemies:src.enemies.map(([x,min,max,speed],i)=>({x,y:FLOOR-42,w:41,h:33,min,max,speed,dir:i%2?1:-1,hp:2,alive:true,phase:i*.85})),
      spikes:src.spikes.map(([x,w])=>({x,y:FLOOR-23,w,h:23})),
      lasers:src.lasers.map(([x,phase])=>({x,phase})),
      boss:src.boss?{...src.boss,y:FLOOR-96,w:67,h:96,alive:true,dir:-1,shootTimer:2.2}:null
    };
    player={x:72,y:FLOOR-46,w:34,h:46,vx:0,vy:0,health:3,cells:0,onGround:true,coyote:.12,jumpBuffer:0,dir:1,invuln:0,checkpoint:72,run:0};
    checkpointReached=false;
    shootingCooldown=0; actionCooldown=0; lastInteraction=false;
    bullets=[];hostileBullets=[];particles=[];cameraX=0;tick=0;
    for(const k of keys)keys.delete(k);Object.keys(touch).forEach(k=>touch[k]=false);
    updateHUD();
    if(saveProgress){try{localStorage.setItem('irvingRescateCurrent',String(idx));}catch(e){}}
  }
  function setOverlay({mode,kicker,title,text,hint,button,secondary,portraitVisible=true}){
    overlayMode=mode; $('overlayKicker').textContent=kicker;
    $('overlayTitle').textContent=title; $('overlayText').textContent=text;
    $('overlayHint').textContent=hint||'';
    $('overlayPrimary').innerHTML=`${button}<span>↗</span>`;
    $('overlaySecondary').hidden=!secondary;
    $('overlaySecondary').textContent=secondary||'';
    $('panelPortrait').style.display=portraitVisible?'block':'none';
    $('overlay').classList.add('is-visible');
  }
  function hideOverlay(){ $('overlay').classList.remove('is-visible'); }
  function startNewGame(){score=0;defeatCount=0;setupLevel(0);stage='playing';hideOverlay();showToast(level.narrative,5);}
  function startStoredGame(){
    let n=0;try{n=clamp(Number(localStorage.getItem('irvingRescateCurrent'))||0,0,2);}catch(e){}
    setupLevel(n);stage='playing';hideOverlay();showToast(level.narrative,4);
  }
  function intro(){
    setupLevel(0,false);stage='menu';
    let saved=0;try{saved=clamp(Number(localStorage.getItem('irvingRescateCurrent'))||0,0,2);}catch(e){}
    setOverlay({mode:'menu',kicker:'TRANSMISIÓN ENTRANTE // AÑO 2145',title:'IRVING: RESCATE DE EMY',text:STORY.intro,
      hint:'A / D O FLECHAS: MOVER · ESPACIO: SALTAR · J O X: DISPARAR · E: INTERACTUAR',
      button:'INICIAR MISIÓN',secondary:saved>0?`CONTINUAR DESDE MISIÓN 0${saved+1}`:null});
  }
  function finishLevel(){
    sfx('win');stage='levelComplete';
    if(levelIndex===2){
      try{localStorage.removeItem('irvingRescateCurrent');localStorage.setItem('irvingRescateWin','1');}catch(e){}
      setOverlay({mode:'victory',kicker:'OPERACIÓN COMPLETADA // EMY A SALVO',title:'¡IRVING RESCATÓ A EMY! ♥',
        text:STORY.victory+` Drones neutralizados: ${defeatCount}. Células recuperadas: ${score}.`,
        hint:'EL AMOR SOBREVIVE INCLUSO EN EL SECTOR 7',button:'VOLVER A JUGAR',secondary:'MENÚ PRINCIPAL'});
    }else{
      setOverlay({mode:'levelComplete',kicker:`SECTOR 0${levelIndex+1} RESTAURADO // ACCESO CONCEDIDO`,
        title:levelIndex===0?'¡PRIMERA SEÑAL DE EMY!':'¡EMY ESTÁ MUY CERCA!',
        text:STORY.interludes[levelIndex],hint:'TU MISIÓN CONTINÚA EN EL SIGUIENTE SECTOR.',
        button:`CONTINUAR A NIVEL 0${levelIndex+2}`,secondary:'MENÚ PRINCIPAL'});
    }
  }
  function gameOver(){
    stage='gameOver';sfx('hurt');
    setOverlay({mode:'gameOver',kicker:'ESCUDO AGOTADO // SEÑAL PERDIDA',title:'MISIÓN INTERRUMPIDA',
      text:'Irving ha caído, pero aún puede intentar salvar a Emy. Repite este sector; la colonia sigue contando contigo.',
      hint:'CONSEJO: ESQUIVA LOS DRONES, SALTA LOS PINCHOS Y DISPARA CON J.',
      button:'REINTENTAR ESTE NIVEL',secondary:'MENÚ PRINCIPAL'});
  }
  function togglePause(){
    if(stage==='playing'){
      stage='paused';
      setOverlay({mode:'pause',kicker:'OPERACIÓN PAUSADA',title:'MISIÓN EN PAUSA',
        text:'Los drones no avanzarán mientras estés aquí. Continúa cuando estés listo para buscar a Emy.',
        hint:'A / D MOVER · ESPACIO SALTAR · J DISPARAR · E INTERACTUAR',button:'REANUDAR MISIÓN',secondary:'MENÚ PRINCIPAL'});
    }else if(stage==='paused'){
      stage='playing';hideOverlay();
    }
  }
  $('overlayPrimary').addEventListener('click',()=>{
    switch(overlayMode){
      case'menu':case'victory':startNewGame();break;
      case'levelComplete':setupLevel(levelIndex+1);stage='playing';hideOverlay();showToast(level.narrative,5);break;
      case'gameOver':setupLevel(levelIndex);stage='playing';hideOverlay();showToast('¡Irving lo intenta de nuevo!');break;
      case'pause':togglePause();break;
    }
  });
  $('overlaySecondary').addEventListener('click',()=>{
    if(overlayMode==='menu')startStoredGame();else intro();
  });
  $('pauseBtn').addEventListener('click',togglePause);
  $('soundBtn').addEventListener('click',switchSound);

  function requestJump(){if(stage==='playing')player.jumpBuffer=.15;}
  const KEY_ALIASES={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',j:'shoot',J:'shoot',x:'shoot',X:'shoot',k:'shoot',K:'shoot',e:'interact',E:'interact',Enter:'interact'};
  window.addEventListener('keydown',e=>{
    const k=KEY_ALIASES[e.key];
    if(k||e.key==='p'||e.key==='P'){e.preventDefault();}
    if(e.repeat&&k==='jump')return;
    if(e.key==='p'||e.key==='P'){if(!e.repeat)togglePause();return;}
    if(k){if(!keys.has(k)&&k==='jump')requestJump();keys.add(k);}
    if(stage==='menu'&&(e.key==='Enter'))startNewGame();
  },{passive:false});
  window.addEventListener('keyup',e=>{const k=KEY_ALIASES[e.key];if(k)keys.delete(k);});
  window.addEventListener('blur',()=>{keys.clear();Object.keys(touch).forEach(k=>touch[k]=false);if(stage==='playing')togglePause();});
  document.querySelectorAll('[data-control]').forEach(btn=>{
    const control=btn.dataset.control;
    function press(e){e.preventDefault();touch[control]=true;btn.classList.add('pressed');if(control==='jump')requestJump();try{btn.setPointerCapture(e.pointerId);}catch(_){} }
    function release(e){e.preventDefault();touch[control]=false;btn.classList.remove('pressed');}
    btn.addEventListener('pointerdown',press);
    btn.addEventListener('pointerup',release);
    btn.addEventListener('pointercancel',release);
    btn.addEventListener('lostpointercapture',()=>{touch[control]=false;btn.classList.remove('pressed');});
  });
  const held=k=>keys.has(k)||touch[k];

  function spawnParticle(x,y,color,qty=10,power=120){
    for(let i=0;i<qty;i++){
      const a=Math.random()*Math.PI*2,s=Math.random()*power+25;
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:Math.random()*.42+.24,max:.68,color,size:Math.random()*4+1.5});
    }
    if(particles.length>125)particles.splice(0,particles.length-125);
  }
  function hurt(respawn=false){
    if(player.invuln>0||stage!=='playing')return;
    player.health-=1;player.invuln=1.55;sfx('hurt');spawnParticle(player.x+17,player.y+23,'#ff678f',15,165);
    if(player.health<=0){updateHUD();gameOver();return;}
    if(respawn){player.x=player.checkpoint;player.y=FLOOR-46;player.vx=0;player.vy=0;player.onGround=true;cameraX=clamp(player.x-300,0,level.width-WIDTH);}
    else{player.vy=-270;player.x=clamp(player.x-(player.dir*50),10,level.width-player.w);}
    updateHUD();
  }
  function shoot(){
    if(shootingCooldown>0)return;
    shootingCooldown=.22;
    const x=player.x+(player.dir>0?34:-8),y=player.y+23;
    bullets.push({x,y,px:x,vx:player.dir*680,life:.90});
    spawnParticle(x,y,'#7df9ff',3,90);sfx('shoot');
  }
  function laserActive(l){return Math.sin(tick*2.35+l.phase)>-.13;}
  function interact(){
    if(actionCooldown>0)return;actionCooldown=.45;
    if(!near(player.x+17,level.gate))return;
    if(player.cells<level.need){showToast(`Necesitas ${level.need-player.cells} célula(s) de energía más.`);return;}
    if(level.boss&&level.boss.alive){showToast('¡Destruye al Centinela antes de liberar a Emy!');return;}
    finishLevel();
  }
  function update(dt){
    tick+=dt;
    shootingCooldown=Math.max(0,shootingCooldown-dt);
    actionCooldown=Math.max(0,actionCooldown-dt);
    player.invuln=Math.max(0,player.invuln-dt);
    player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
    const left=held('left'), right=held('right');
    player.vx=(Number(right)-Number(left))*SPEED;
    if(player.vx)player.dir=Math.sign(player.vx);
    if(player.onGround)player.coyote=.12;else player.coyote=Math.max(0,player.coyote-dt);
    if(player.jumpBuffer>0&&player.coyote>0){
      player.vy=JUMP;player.onGround=false;player.coyote=0;player.jumpBuffer=0;sfx('jump');
      spawnParticle(player.x+17,player.y+44,'#8eecf5',6,65);
    }
    const oldBottom=player.y+player.h;
    player.x=clamp(player.x+player.vx*dt,0,level.width-player.w);
    player.vy=Math.min(950,player.vy+G*dt);
    player.y+=player.vy*dt;player.onGround=false;
    if(player.vy>=0){
      const solids=[...level.ground,...level.platforms];
      for(const solid of solids){
        const intersectsX=player.x+player.w>solid.x+3&&player.x<solid.x+solid.w-3;
        if(intersectsX&&oldBottom<=solid.y+9&&player.y+player.h>=solid.y&&player.y+player.h<=solid.y+Math.max(38,player.vy*dt+12)){
          player.y=solid.y-player.h;player.vy=0;player.onGround=true;break;
        }
      }
    }
    if(player.vx&&player.onGround)player.run+=dt*14;
    if(player.y>HEIGHT+120){hurt(true); if(stage!=='playing')return;}
    if(held('shoot'))shoot();
    if(held('interact')){
      if(!lastInteraction)interact();lastInteraction=true;
    }else lastInteraction=false;

    if(player.x>level.checkpoint&&!checkpointReached){
      player.checkpoint=level.checkpoint;checkpointReached=true;
      showToast('PUNTO DE CONTROL ACTIVADO');sfx('collect');
    }
    // Cells that open doors.
    for(const cell of level.cells){
      if(!cell.got&&dist(player.x+17,player.y+23,cell.x,cell.y)<32){
        cell.got=true;player.cells++;score++;spawnParticle(cell.x,cell.y,'#ffc874',13);sfx('collect');updateHUD();
        if(player.cells===level.need)showToast('ENERGÍA SUFICIENTE · DIRÍGETE A LA PUERTA');
      }
    }
    // Enemy drones patrol back and forth, two shots to neutralize.
    for(const enemy of level.enemies){
      if(!enemy.alive)continue;
      enemy.x+=enemy.speed*enemy.dir*dt;
      if(enemy.x<enemy.min){enemy.x=enemy.min;enemy.dir=1;}
      if(enemy.x>enemy.max){enemy.x=enemy.max;enemy.dir=-1;}
      if(overlap(player,enemy))hurt(false);
    }
    // Vertical energy traps switch between active and inactive.
    for(const l of level.lasers){
      if(laserActive(l)&&overlap(player,{x:l.x-8,y:340,w:18,h:HEIGHT-340}))hurt(true);
    }
    // Spikes.
    for(const s of level.spikes){
      if(overlap({x:player.x+7,y:player.y+25,w:player.w-14,h:player.h-25},s))hurt(true);
    }
    // The final boss shoots red plasma bolts, and can be defeated.
    const boss=level.boss;
    if(boss?.alive){
      boss.x+=boss.dir*55*dt;
      if(boss.x<boss.min){boss.x=boss.min;boss.dir=1;}
      if(boss.x>boss.max){boss.x=boss.max;boss.dir=-1;}
      if(overlap(player,boss))hurt(false);
      boss.shootTimer-=dt;
      if(boss.shootTimer<=0&&Math.abs((player.x+17)-(boss.x+33))<650){
        boss.shootTimer=1.32;
        const dir=(player.x+17)<boss.x?-1:1;
        hostileBullets.push({x:boss.x+(dir>0?boss.w:0),y:boss.y+55,vx:dir*345,life:2.1});
        spawnParticle(boss.x+33,boss.y+54,'#ff779b',5,80);
      }
    }
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];b.px=b.x;b.x+=b.vx*dt;b.life-=dt;
      if(b.life<=0){bullets.splice(i,1);continue;}
      let collided=false;
      for(const enemy of level.enemies){
        if(enemy.alive&&overlap({x:b.x-8,y:b.y-5,w:16,h:10},enemy)){
          enemy.hp--;spawnParticle(b.x,b.y,'#ffa1b2',6,95);
          if(enemy.hp<=0){enemy.alive=false;defeatCount++;spawnParticle(enemy.x+18,enemy.y+15,'#ec5c90',13,200);}
          collided=true;break;
        }
      }
      if(!collided&&boss?.alive&&overlap({x:b.x-8,y:b.y-5,w:16,h:10},boss)){
        boss.hp--;spawnParticle(b.x,b.y,'#ff819e',11,130);sfx('boss');
        if(boss.hp<=0){boss.alive=false;defeatCount++;spawnParticle(boss.x+30,boss.y+45,'#f9a9e4',35,250);showToast('¡CENTINELA DERROTADO! · LIBERA A EMY',4);updateHUD();}
        collided=true;
      }
      if(collided)bullets.splice(i,1);
    }
    for(let i=hostileBullets.length-1;i>=0;i--){
      const b=hostileBullets[i];b.x+=b.vx*dt;b.life-=dt;
      if(b.life<=0){hostileBullets.splice(i,1);continue;}
      if(overlap({x:b.x-7,y:b.y-7,w:14,h:14},player)){hostileBullets.splice(i,1);hurt(false);}
    }
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=G*.22*dt;p.life-=dt;
      if(p.life<=0)particles.splice(i,1);
    }
    if(player.x>level.gate-155&&player.x<level.gate+30&&actionCooldown<=0){
      if(player.cells>=level.need&&(!level.boss||!level.boss.alive))showToast('PULSA E PARA ABRIR LA PUERTA',.35);
    }
    cameraX+=(clamp(player.x-360,0,level.width-WIDTH)-cameraX)*Math.min(1,dt*6);
  }

  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
  function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function line(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function sky(){
    let gr=ctx.createLinearGradient(0,0,0,HEIGHT);gr.addColorStop(0,levelIndex===2?'#230c2d':'#07152b');gr.addColorStop(.56,levelIndex===1?'#162e4a':'#102138');gr.addColorStop(1,'#182033');rect(0,0,WIDTH,HEIGHT,gr);
    const moonX=785-cameraX*.035;
    glow(moonX,115,185,levelIndex===2?'#f93a9a33':'#43aee844');
    ctx.fillStyle=levelIndex===2?'#c46cad':'#7999bd';ctx.globalAlpha=.40;ctx.beginPath();ctx.arc(moonX,110,43,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    for(let i=0;i<95;i++){
      const x=((Math.abs(rnd(i+30))*1100-cameraX*.12)%1100+1100)%1100;
      const y=Math.abs(rnd(i*9+16))*278+10;
      rect(x,y, i%7===0?2:1,i%7===0?2:1,`rgba(171,224,251,${.3+(Math.sin(tick*1.5+i)*.2)})`);
    }
    // Distant cityscape and digital antennae.
    for(let layer=0;layer<3;layer++){
      const offset=cameraX*(.14+layer*.19), par=190+layer*38;
      for(let i=-1;i<16;i++){
        const xx=i*114-offset%114;const hh=85+Math.abs(rnd(i*7+layer*53))*par;
        rect(xx,HEIGHT-hh-55,93,hh,layer===0?'#0e1c32':layer===1?'#14243b':'#17233a');
        rect(xx+5,HEIGHT-hh-55,3,hh,layer===2?'#253e53':'#192b43');
        if(i%3===0){line(xx+38,HEIGHT-hh-55,xx+38,HEIGHT-hh-85,'#3b5670');rect(xx+34,HEIGHT-hh-85,8,4,'#ff6f92');}
        for(let wy=HEIGHT-hh-41;wy<HEIGHT-70;wy+=19){for(let wx=xx+15;wx<xx+82;wx+=24){if(Math.abs(rnd(i*44+wy+wx))>.34)rect(wx,wy,3,6,layer===2?'#39718a88':'#467ca144');}}
      }
    }
    for(let y=75;y<HEIGHT;y+=44)line(0,y,WIDTH,y,'#3b61870e',1);
    // Broken neon conduit high in the ruins.
    line(-30,315,WIDTH+30,322,'#507e9e45',4);
    for(let i=0;i<15;i++){
      const x=i*170-(cameraX*.46)%170;
      rect(x,292,5,37,'#233d56');rect(x-5,285,14,5,'#275875');
    }
    glow(280-cameraX*.05,305,175,'#d7256730');
  }
  function drawGround(){
    // Dark abyss below the safe path.
    rect(0,FLOOR,WIDTH,HEIGHT-FLOOR,'#050e1a');
    for(const seg of level.ground){
      const x=seg.x-cameraX;
      if(x>WIDTH||x+seg.w<0)continue;
      rect(x,seg.y,seg.w,HEIGHT-seg.y,'#1b2b3d');
      rect(x,seg.y,seg.w,6,'#7adce5');rect(x,seg.y+6,seg.w,4,'#386781');
      for(let xx=seg.x;xx<seg.x+seg.w;xx+=48){
        const sx=xx-cameraX;
        rect(sx+3,FLOOR+16,37,3,'#2e4a60');rect(sx+38,FLOOR+7,2,33,'#0b2032');
      }
    }
    for(const p of level.platforms){
      const x=p.x-cameraX;
      if(x>WIDTH||x+p.w<0)continue;
      ctx.shadowColor='#46dff4';ctx.shadowBlur=12;
      rect(x,p.y,p.w,5,'#77ecf3');ctx.shadowBlur=0;
      rect(x,p.y+5,p.w,17,'#234257');rect(x+7,p.y+9,p.w-14,4,'#31566a');
      for(let i=0;i<p.w;i+=42){rect(x+i+16,p.y+12,5,4,'#8cbed0');}
      line(x+14,p.y+21,x+27,p.y+35,'#385771',3);
      line(x+p.w-14,p.y+21,x+p.w-27,p.y+35,'#385771',3);
    }
  }
  function drawHazards(){
    for(const s of level.spikes){
      const x=s.x-cameraX;
      for(let a=0;a<s.w;a+=18){
        ctx.beginPath();ctx.moveTo(x+a,s.y+s.h);ctx.lineTo(x+a+9,s.y);ctx.lineTo(x+a+18,s.y+s.h);ctx.closePath();ctx.fillStyle='#ff668c';ctx.fill();
        line(x+a+6,s.y+8,x+a+9,s.y+3,'#ffd0da',1);
      }
    }
    for(const l of level.lasers){
      const x=l.x-cameraX;if(x<-45||x>WIDTH+45)continue;
      const active=laserActive(l);
      rect(x-19,336,38,12,'#5b3b59');rect(x-19,FLOOR-9,38,10,'#5b3b59');
      if(active){glow(x,410,67,'#ff3d6777');ctx.shadowColor='#ff6689';ctx.shadowBlur=18;rect(x-5,347,10,FLOOR-356,'#ff4d7e');ctx.shadowBlur=0;rect(x-2,347,4,FLOOR-356,'#ffd1db');}
      else{line(x,347,x,FLOOR-9,'#e4587877',2);}
    }
  }
  function drawCell(c){
    const x=c.x-cameraX,y=c.y+Math.sin(tick*3+c.x*.01)*4;
    glow(x,y,34,'#ffc76d40');ctx.save();ctx.translate(x,y);ctx.rotate(tick*.6+c.x);
    ctx.fillStyle='#8c5a27';ctx.fillRect(-12,-12,24,24);ctx.fillStyle='#ffbd5e';ctx.fillRect(-9,-9,18,18);ctx.fillStyle='#fff4cc';ctx.fillRect(-4,-4,8,8);
    ctx.restore();
  }
  function drawCheckpoint(){
    const x=level.checkpoint-cameraX;if(x<-45||x>WIDTH+40)return;
    line(x,FLOOR-95,x,FLOOR,'#80cbde',5);
    rect(x-4,FLOOR-105,10,10,checkpointReached?'#a8ffa5':'#b6cadd');
    ctx.beginPath();ctx.moveTo(x+4,FLOOR-91);ctx.lineTo(x+49,FLOOR-79);ctx.lineTo(x+4,FLOOR-65);ctx.closePath();ctx.fillStyle=checkpointReached?'#51f6be':'#5b809b';ctx.fill();
    if(checkpointReached)glow(x+22,FLOOR-80,56,'#44ffc53b');
  }
  function drawEnemy(e){
    const x=e.x-cameraX,y=e.y+Math.sin(tick*4+e.phase)*4;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    glow(21,14,35,'#f04e6540');
    rect(5,5,32,23,'#43516a');rect(0,11,8,12,'#68768a');rect(33,11,8,12,'#68768a');
    rect(7,2,27,6,'#77849a');rect(10,10,22,12,'#151d2f');rect(15,12,12,8,'#ff577c');
    rect(4,27,11,3,'#c85679');rect(26,27,11,3,'#c85679');
    if(e.hp===1)rect(14,2,14,4,'#ff7f90');ctx.restore();
  }
  function drawBoss(b){
    const x=b.x-cameraX,y=b.y;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    glow(34,46,110,'#fd38643d');
    rect(12,72,16,24,'#343950');rect(39,72,16,24,'#343950');
    rect(9,91,22,5,'#697f96');rect(36,91,22,5,'#697f96');
    rect(8,20,52,57,'#34435d');rect(15,28,38,37,'#4d5a77');
    rect(0,28,12,40,'#63627b');rect(55,28,12,40,'#63627b');
    rect(18,0,31,28,'#242e47');rect(11,8,46,17,'#4b5970');
    rect(19,12,30,7,'#ff577e');rect(28,42,14,18,'#ff7095');
    rect(30,47,10,8,'#ffe5eb');rect(22,66,29,5,'#7c839e');
    ctx.fillStyle='#ff718d';ctx.fillRect(10,-16,47,5);
    ctx.fillStyle='#24394d';ctx.fillRect(10+47*(b.hp/6),-16,47*(1-b.hp/6),5);
    ctx.restore();
  }
  function drawIrving(p){
    // Original pixel character inspired by the attached photo: glasses, dark hair, navy uniform.
    const x=Math.round(p.x-cameraX),y=Math.round(p.y);
    if(p.invuln>0&&Math.floor(tick*16)%2===0)return;
    ctx.save();ctx.translate(x+(p.dir<0?p.w:0),y);ctx.scale(p.dir,1);
    const walk=p.onGround&&Math.abs(p.vx)>1?Math.sin(p.run)*4:0;
    const px=(a,b,w,h,c)=>rect(a,b,w,h,c);
    // boots & legs
    px(7,33+Math.max(0,walk),9,10,'#1b2538');px(21,33+Math.max(0,-walk),9,10,'#1b2538');
    px(4,40+Math.max(0,walk),13,5,'#62728c');px(19,40+Math.max(0,-walk),15,5,'#62728c');
    // dark-blue tactical uniform
    px(5,19,26,17,'#162b62');px(8,20,20,14,'#243c88');px(8,31,20,7,'#111b43');
    px(4,20,6,16,'#24366c');px(29,20,6,16,'#162850');
    px(15,21,2,16,'#88a9d0');px(19,23,2,2,'#a9eaf5');px(19,29,2,2,'#a9eaf5');
    px(29,28,7,4,'#647fa6');px(34,27,8,5,'#42edf6');px(37,28,7,2,'#efffff');
    // neck & face
    px(14,16,10,6,'#9b603d');px(10,6,20,15,'#bb8058');px(26,9,5,8,'#a46d4a');
    // swept black hair
    px(8,2,22,7,'#0c1524');px(11,0,17,5,'#18253b');px(6,5,11,5,'#182337');px(21,3,11,4,'#17243a');
    px(27,7,5,7,'#142032');px(11,6,8,2,'#344054');
    // characteristic round glasses and eyes
    ctx.strokeStyle='#c8d5cb';ctx.lineWidth=1.5;
    ctx.strokeRect(12,10,8,6);ctx.strokeRect(22,10,8,6);line(20,12,22,12,'#b3c9cb',1.2);
    px(15,12,2,2,'#243038');px(25,12,2,2,'#243038');px(19,18,5,1,'#754a41');
    ctx.restore();
  }
  function drawEmy(xWorld){
    const x=xWorld-cameraX,y=FLOOR-48+Math.sin(tick*2)*2;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    glow(16,23,70,'#fe78ce61');
    // Emy is a stylized heroine, in a coral jacket and lavender scarf.
    rect(7,34,8,12,'#212f49');rect(20,34,8,12,'#212f49');
    rect(4,17,29,20,'#af3a77');rect(10,18,17,18,'#ef759e');
    rect(6,0,26,17,'#34253d');rect(10,7,18,15,'#d69a79');
    rect(7,5,6,18,'#32263b');rect(28,5,6,19,'#31253d');
    rect(14,12,2,2,'#282438');rect(24,12,2,2,'#282438');
    rect(17,18,7,2,'#a85d70');rect(8,22,25,4,'#9f8ef9');
    ctx.fillStyle='#ffabd1';ctx.font='bold 10px monospace';ctx.fillText('EMY',5,-11);
    ctx.restore();
  }
  function drawGate(){
    const x=level.gate-cameraX,y=FLOOR-125;
    if(x>WIDTH+90||x<-110)return;
    const ready=player.cells>=level.need&&(!level.boss||!level.boss.alive),col=ready?'#77f8e0':'#ff6c92';
    glow(x+8,y+70,97,ready?'#60eedd3b':'#f5488444');
    rect(x-34,y+7,72,118,'#253449');rect(x-27,y+15,58,104,'#0b1c2b');
    ctx.shadowColor=col;ctx.shadowBlur=20;
    rect(x-27,y+15,5,104,col);rect(x+27,y+15,5,104,col);rect(x-27,y+15,59,5,col);
    ctx.shadowBlur=0;
    for(let i=0;i<7;i++)line(x-20,y+28+i*14,x+24,y+22+i*14,ready?'#5dcebb55':'#ff558a55',2);
    rect(x-36,y,76,9,'#567d97');
    ctx.fillStyle=col;ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(ready?'[ E ] ABRIR':'BLOQUEADO',x+1,y-10);ctx.textAlign='left';
    if(levelIndex===2)drawEmy(level.gate+90);
  }
  function drawBullets(){
    for(const b of bullets){
      glow(b.x-cameraX,b.y,23,'#7bf9fd65');ctx.shadowColor='#affbff';ctx.shadowBlur=12;rect(b.x-cameraX-8,b.y-3,16,6,'#a4fcff');ctx.shadowBlur=0;
    }
    for(const b of hostileBullets){glow(b.x-cameraX,b.y,27,'#ff658488');rect(b.x-cameraX-8,b.y-6,16,12,'#ff89a0');}
  }
  function drawParticles(){
    for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);rect(p.x-cameraX,p.y,p.size,p.size,p.color);}ctx.globalAlpha=1;
  }
  function drawCompass(){
    ctx.fillStyle='#8fb6cb';ctx.font='bold 11px ui-monospace, monospace';
    ctx.fillText(`X ${String(Math.floor(player.x)).padStart(4,'0')} M`,28,67);
    const progress=clamp(player.x/level.width,0,1);
    rounded(26,77,178,6,3,'#32516b');rounded(26,77,Math.max(4,178*progress),6,3,level.tone);
    ctx.fillStyle='#b0d5e2';ctx.fillText(`${Math.round(progress*100)}%`,215,84);
  }
  function render(){
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    sky();drawGround();drawHazards();drawCheckpoint();
    for(const c of level.cells)if(!c.got)drawCell(c);
    for(const e of level.enemies)if(e.alive)drawEnemy(e);
    if(level.boss?.alive)drawBoss(level.boss);
    drawGate();drawBullets();drawIrving(player);drawParticles();drawCompass();
    if(stage==='playing'&&player.x<400&&tick<16){
      ctx.fillStyle='#b2e6f2';ctx.font='bold 12px monospace';
      ctx.fillText('D / →  AVANZAR',60,355);
      ctx.fillText('ESPACIO  SALTAR',60,374);
      ctx.fillText('J / X  DISPARAR',60,393);
    }
    // Subtle VHS scanlines, deliberately limited for performance.
    ctx.fillStyle='#08132311';for(let y=0;y<HEIGHT;y+=5)ctx.fillRect(0,y,WIDTH,1);
  }
  function loop(now){
    const dt=Math.min(.034,(now-last)/1000||.016);last=now;
    if(stage==='playing')update(dt);
    else if(stage==='menu')tick+=dt*.28;
    if(level&&player)render();
    if(toastUntil&&now>toastUntil){$('toast').classList.remove('show');toastUntil=0;}
    requestAnimationFrame(loop);
  }
  intro();requestAnimationFrame(loop);
})();
