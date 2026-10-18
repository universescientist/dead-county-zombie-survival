(()=>{
"use strict";
const T=32,W=112,H=112,CH=16,IH=16,IW=32,TAU=Math.PI*2,SAVE="dead-county-save-v1";let SW=640,SH=360;
const $=id=>document.getElementById(id), canvas=$("game"),ctx=canvas.getContext("2d",{alpha:false}),mc=$("minimap"),mctx=mc.getContext("2d");
ctx.imageSmoothingEnabled=false;mctx.imageSmoothingEnabled=false;
let seed=78453321;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function rint(a,b){return a+Math.floor(rand()*(b-a+1))}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function hash(x,y){let h=Math.imul(x^0x9e3779b9,374761393)+Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0}
function variation(x,y){return hash(x,y)%100}
function iso(x,y){return {x:(x-y)*IW/T,y:(x+y)*IH/T}}
function inverseIso(x,y){return {x:(x/IW+y/IH)*T/2,y:(y/IH-x/IW)*T/2}}
function screenDeltaToWorld(dx,dy){return inverseIso(dx,dy)}
function walkVector(sx,sy){const world=screenDeltaToWorld(sx,sy);const length=Math.hypot(world.x,world.y)||1;return {x:world.x/length,y:world.y/length}}
function diamond(c,x,y,w=IW,h=IH,color="#384939"){c.fillStyle=color;c.beginPath();c.moveTo(Math.round(x),Math.round(y-h));c.lineTo(Math.round(x+w),Math.round(y));c.lineTo(Math.round(x),Math.round(y+h));c.lineTo(Math.round(x-w),Math.round(y));c.closePath();c.fill()}
function poly(c,pts,color,stroke){c.beginPath();c.moveTo(Math.round(pts[0].x),Math.round(pts[0].y));for(let i=1;i<pts.length;i++)c.lineTo(Math.round(pts[i].x),Math.round(pts[i].y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}

const tiles=new Uint8Array(W*H),treeSet=new Set(),cars=[],containers=[],houses=[],debris=[],barriers=[];
const at=(x,y)=>x<0||y<0||x>=W||y>=H?5:tiles[y*W+x];
const set=(x,y,t)=>{if(x>=0&&y>=0&&x<W&&y<H)tiles[y*W+x]=t};
let nextLoot=0;
function makeWorld(){
seed=78453321;tiles.fill(0);treeSet.clear();cars.length=0;containers.length=0;houses.length=0;debris.length=0;barriers.length=0;nextLoot=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 if(x<2||y<2||x>W-3||y>H-3){set(x,y,5);continue}
 if(x%24>=0&&x%24<5||y%24>=0&&y%24<5)set(x,y,1);
}
for(let gy=7;gy<103;gy+=24)for(let gx=7;gx<103;gx+=24){
 const bx=gx+rint(0,2),by=gy+rint(0,2),bw=rint(9,12),bh=rint(8,11),doorX=bx+Math.floor(bw/2);
 if(bx+bw>W-4||by+bh>H-4)continue;
 houses.push({x:bx,y:by,w:bw,h:bh,door:doorX});
 for(let y=by;y<by+bh;y++)for(let x=bx;x<bx+bw;x++)set(x,y,(y===by||y===by+bh-1||x===bx||x===bx+bw-1)?3:2);
 set(doorX,by+bh-1,4);set(doorX-1,by+bh-1,4);
 containers.push({id:nextLoot++,x:(bx+3+rint(0,bw-7))*T+16,y:(by+3+rint(0,bh-7))*T+16,type:"cabinet",used:false});
 containers.push({id:nextLoot++,x:(bx+bw-3)*T+16,y:(by+2)*T+16,type:"cabinet",used:false});
}
for(let i=0;i<500;i++){
 const x=rint(4,W-5),y=rint(4,H-5),nearStart=Math.hypot(x-52,y-52)<9;
 if(at(x,y)===0&&!nearStart&&!treeSet.has(y*W+x)&&(hash(x,y)%5)!==0){treeSet.add(y*W+x);}
}
for(let i=0;i<46;i++){
 let x=rint(4,W-5),y=rint(4,H-5);
 if(at(x,y)!==1||Math.hypot(x-52,y-52)<6)continue;
 cars.push({x:x*T+16,y:y*T+16,rot:rand()<.5?0:1,col:rint(0,3),id:nextLoot++});
 containers.push({id:nextLoot++,x:x*T+16,y:y*T+16,type:"car",used:false});
}
for(let i=0;i<120;i++){let x=rint(3,W-4),y=rint(3,H-4);if(at(x,y)===0||at(x,y)===1)debris.push({x:x*T+10,y:y*T+8,type:rint(0,3)});}
containers.push({id:nextLoot++,x:53*T+16,y:53*T+16,type:"supply",used:false});
containers.push({id:nextLoot++,x:50*T+16,y:50*T+16,type:"supply",used:false});
}
// Fixed mission point beside a major east-west road
const tower={x:99*T+16,y:25*T+16};
function clearTower(){for(let y=23;y<=27;y++)for(let x=97;x<=101;x++){set(x,y,1);treeSet.delete(y*W+x)}}
makeWorld();clearTower();
const itemDef={
food:{name:"COMIDA ENLATADA",icon:"▣",desc:"Recupera 40 pontos de fome."},
water:{name:"ÁGUA POTÁVEL",icon:"◈",desc:"Recupera 45 pontos de sede."},
med:{name:"CURATIVO",icon:"✚",desc:"Recupera 40 pontos de saúde."},
ammo:{name:"MUNIÇÃO 9MM",icon:"⌖",desc:"Balas para a pistola."},
wood:{name:"MADEIRA",icon:"▥",desc:"Material para barreiras."},
cloth:{name:"TECIDO",icon:"▤",desc:"Material médico."},
scrap:{name:"SUCATA",icon:"⚙",desc:"Peças e fabricação."},
circuit:{name:"CIRCUITO",icon:"▦",desc:"Necessário à torre."},
fuel:{name:"COMBUSTÍVEL",icon:"◉",desc:"Necessário à torre."}
};
const recipes=[
 {name:"CURATIVO",desc:"Tecido ×2, sucata ×1",req:{cloth:2,scrap:1},out:{med:1}},
 {name:"MUNIÇÃO 9MM ×8",desc:"Sucata ×2",req:{scrap:2},out:{ammo:8}},
 {name:"BARRICADA",desc:"Madeira ×3, sucata ×1",req:{wood:3,scrap:1},action:"barrier"},
 {name:"KIT DE SUPRIMENTOS",desc:"Tecido ×1, madeira ×1",req:{cloth:1,wood:1},out:{food:1,water:1}}
];
let state,player,zombies=[],particles=[],tracers=[],texts=[],spawnTimer=0,clock=0,uiTimer=0,miniTimer=0,last=0,saveTimer=0,started=false,paused=true,modalActive=true,screenShake=0,audioEnabled=false,audioCtx=null,attackHeld=false,runHeld=false;
let aim={x:SW/2+80,y:SH/2},keys=new Set(),joy={x:0,y:0},frame=0,chunkCache=new Map(),nearObject=null;
function resizeGame(){const ratio=Math.max(280,innerWidth)/Math.max(280,innerHeight);if(ratio>=.9){SH=360;SW=Math.round(360*ratio)}else{SW=360;SH=Math.round(360/ratio)}canvas.width=SW;canvas.height=SH;ctx.imageSmoothingEnabled=false;aim={x:SW/2+80,y:SH/2};chunkCache.clear()}
window.addEventListener("resize",resizeGame);resizeGame();
const defaultInv=()=>({food:2,water:2,med:2,ammo:48,wood:1,cloth:1,scrap:1,circuit:0,fuel:0});
function fresh(){
 state={hp:100,stamina:100,hunger:100,thirst:100,infection:0,daytime:0,kills:0,weapon:1,mag:8,inv:defaultInv(),looted:[],stage:"collect",defend:50,elapsed:0,weaponCooldown:0,reload:0,weather:0,weatherTime:120,shout:0};
 player={x:52*T+16,y:52*T+16,facing:0,walk:0,hurt:0};
 makeWorld();clearTower();zombies=[];particles=[];tracers=[];texts=[];chunkCache.clear();spawnTimer=2;clock=0;frame=0;screenShake=0;
}
fresh();
function notify(msg,bad=false){const e=document.createElement("div");e.className="toast"+(bad?" bad":"");e.textContent=msg;$("toasts").prepend(e);setTimeout(()=>{e.remove()},4200)}
function sound(freq=280,dur=.1,type="square",vol=.025){if(!audioEnabled)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(60,freq*.55),audioCtx.currentTime+dur);g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur+.01)}catch{}}
function save(){if(!started||state.hp<=0||state.stage==="won")return;try{localStorage.setItem(SAVE,JSON.stringify({v:1,state,player:{x:player.x,y:player.y,facing:player.facing},barriers,when:Date.now()}))}catch{}}
function load(){try{const a=JSON.parse(localStorage.getItem(SAVE)||"null");if(!a||a.v!==1||!a.state)return false;fresh();state={...state,...a.state,inv:{...defaultInv(),...a.state.inv}};player={...player,...a.player};for(const c of containers)c.used=state.looted.includes(c.id);barriers.push(...(a.barriers||[]));return true}catch{return false}}
function hideModals(){for(const id of ["modal","inventoryModal","craftModal","endModal"])$(id).classList.remove("show");modalActive=false;paused=false;canvas.focus()}
function start(loadExisting=false){if(!loadExisting||!load())fresh();started=true;hideModals();last=performance.now();notify("SINAL RECEBIDO. SOBREVIVA. ENCONTRE A TORRE.");notify("VAS-CULHE AS CASAS E COLETE SUPRIMENTOS.");save();}
function end(win){started=false;paused=true;modalActive=true;if(win){state.stage="won";try{localStorage.removeItem(SAVE)}catch{}}else try{localStorage.removeItem(SAVE)}catch{}
 $("endLabel").textContent=win?"MISSÃO CONCLUÍDA · EXTRAÇÃO CONFIRMADA":"ARQUIVO ENCERRADO · O CONDADO VENCEU";
 $("endTitle").innerHTML=win?"VOCÊ <span>SOBREVIVEU</span>":"VOCÊ <span>MORREU</span>";
 $("endText").textContent=win?"A torre voltou ao ar. O sinal alcançou uma equipe de resgate. Contra todas as chances, você escapou de Greenwood.":"Mais uma voz desapareceu no silêncio de Greenwood. A cidade continua esperando por alguém que resista.";
 $("endStats").innerHTML="<span>ABATES <b>"+state.kills+"</b></span><span>TEMPO <b>"+Math.floor(state.elapsed/60)+"m "+Math.floor(state.elapsed%60)+"s</b></span>";
 $("endModal").classList.add("show");sound(win?540:120,.6,"sawtooth",.04);
}
function solidPoint(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T),tile=at(tx,ty);if(tile===3||tile===5||treeSet.has(ty*W+tx))return true;
 for(const c of cars)if(Math.abs(c.x-x)<(c.rot?12:21)&&Math.abs(c.y-y)<(c.rot?21:12))return true;
 for(const b of barriers)if(Math.abs(b.x-x)<14&&Math.abs(b.y-y)<14)return true;
 return false}
function canWalk(x,y,r=9){return !solidPoint(x-r,y-r)&&!solidPoint(x+r,y-r)&&!solidPoint(x-r,y+r)&&!solidPoint(x+r,y+r)}
function slideMove(obj,dx,dy,r=9){if(canWalk(obj.x+dx,obj.y,r))obj.x+=dx;if(canWalk(obj.x,obj.y+dy,r))obj.y+=dy}
function addParticle(x,y,col,n=7,speed=60){for(let i=0;i<n;i++){const a=rand()*TAU,sp=rand()*speed+8;particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rand()*.36+.18,max:.6,color:col,size:rint(1,3)})}}
function floater(x,y,msg,col="#fff"){texts.push({x,y,msg,col,life:1,vy:-25})}
function spawnZombie(x,y,kind){if(!canWalk(x,y,11))return;zombies.push({x,y,hp:kind?68:45,max:kind?68:45,kind,attack:rand()*.8,walk:rand()*10,dir:rand()*TAU,noise:0,stun:0})}
function spawnWave(dt){spawnTimer-=dt;if(spawnTimer>0||zombies.length>=65)return;spawnTimer=(state.stage==="defend"?.6:2.4)-Math.min(.9,state.elapsed/250);let amount=state.stage==="defend"?3:rint(1,2);
 for(let i=0;i<amount;i++){let angle=rand()*TAU,range=230+rand()*170;let x=clamp(player.x+Math.cos(angle)*range,85,W*T-85),y=clamp(player.y+Math.sin(angle)*range,85,H*T-85);spawnZombie(x,y,rand()<(state.elapsed>130?.27:.12)?1:0)}
}
function damage(amount,infectChance=0){if(player.hurt>0)return;state.hp=clamp(state.hp-amount,0,100);player.hurt=.55;screenShake=5;floater(player.x,player.y-26,"-"+Math.ceil(amount),"#ff8580");sound(110,.14,"sawtooth",.05);if(rand()<infectChance)state.infection=clamp(state.infection+3,0,100);if(state.hp<=0)end(false)}
function hitZombie(z,damage,angle){z.hp-=damage;z.stun=.2;z.x+=Math.cos(angle)*14;z.y+=Math.sin(angle)*14;addParticle(z.x,z.y,"#963e43",9,105);floater(z.x,z.y-20,String(Math.floor(damage)),"#f3e7b8");screenShake=2;if(z.hp<=0){state.kills++;addParticle(z.x,z.y,"#57272c",13,80);if(rand()<.16)state.inv.scrap++;zombies.splice(zombies.indexOf(z),1);sound(85,.11,"triangle")}}
function reload(){if(state.weapon!==2||state.mag>=8||state.reload>0||state.inv.ammo<1)return;state.reload=1.35;state.reloadPending=true;notify("RECARREGANDO...");sound(320,.12)}
function attack(){if(!started||paused||modalActive||state.weaponCooldown>0||state.reload>0)return;let angle=player.facing;if(state.weapon===3){useItem("med");state.weaponCooldown=.28;return}
 if(state.weapon===1){state.weaponCooldown=.45;state.stamina=Math.max(0,state.stamina-5);sound(115,.11,"triangle",.045);for(const z of [...zombies]){let d=dist(player,z),a=Math.atan2(z.y-player.y,z.x-player.x),delta=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));if(d<63&&Math.abs(delta)<.95)hitZombie(z,35,angle)}screenShake=1.4}
 else if(state.weapon===2){if(state.mag<1){reload();return}state.mag--;state.weaponCooldown=.24;state.shout=4;sound(165,.18,"sawtooth",.07);screenShake=4;let closest=null,range=315;for(const z of zombies){let d=dist(player,z),a=Math.atan2(z.y-player.y,z.x-player.x),delta=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));if(d<range&&Math.abs(delta)<.13+9/d){closest=z;range=d}}
 let endX=player.x+Math.cos(angle)*320,endY=player.y+Math.sin(angle)*320;
 for(let d=12;d<range;d+=8){let tx=player.x+Math.cos(angle)*d,ty=player.y+Math.sin(angle)*d;if(solidPoint(tx,ty)){range=d;closest=null;break}}
 if(closest){endX=closest.x;endY=closest.y;hitZombie(closest,55,angle)}
 else{endX=player.x+Math.cos(angle)*range;endY=player.y+Math.sin(angle)*range}
 tracers.push({x:player.x+Math.cos(angle)*12,y:player.y+Math.sin(angle)*12,x2:endX,y2:endY,life:.10});addParticle(player.x+Math.cos(angle)*17,player.y+Math.sin(angle)*17,"#e6c56c",5,40);if(state.mag===0&&state.inv.ammo)reload();
 }}
function useItem(id){if((state.inv[id]||0)<1){notify("SEM "+(itemDef[id]?.name||"ITEM"),true);return}
 if(id==="food"){if(state.hunger>=100)return notify("VOCÊ NÃO ESTÁ COM FOME.");state.hunger=clamp(state.hunger+42,0,100)}
 else if(id==="water"){if(state.thirst>=100)return notify("VOCÊ NÃO ESTÁ COM SEDE.");state.thirst=clamp(state.thirst+48,0,100)}
 else if(id==="med"){if(state.hp>=100&&state.infection<=0)return notify("SAÚDE ESTÁVEL.");state.hp=clamp(state.hp+45,0,100);state.infection=Math.max(0,state.infection-15)}
 else return;
 state.inv[id]--;sound(540,.15,"sine");notify("USADO: "+itemDef[id].name);inventoryRender();save();
}
function lootFrom(c){if(c.used)return;if(dist(player,c)>55)return;
 c.used=true;state.looted.push(c.id);let gets={};let n=c.type==="supply"?5:c.type==="cabinet"?rint(2,4):rint(1,3);
 const table=c.type==="supply"?["ammo","food","water","wood","scrap","circuit","fuel","med"]:["food","water","scrap","wood","cloth","ammo","med","fuel","circuit"];
 for(let i=0;i<n;i++){let v=table[rint(0,table.length-1)];if((v==="circuit"||v==="fuel")&&rand()<.35)v="scrap";let num=v==="ammo"?rint(4,12):1;gets[v]=(gets[v]||0)+num;state.inv[v]=(state.inv[v]||0)+num}
 let msg=Object.entries(gets).map(([k,v])=>itemDef[k].name+" +"+v).join("  ·  ");notify("ENCONTRADO: "+msg);floater(c.x,c.y-20,"+ SUPRIMENTOS","#d9ed9e");sound(520,.16,"triangle");if(c.type==="supply")addParticle(c.x,c.y,"#cfba72",10);save();
}
function interact(){if(!started||paused)return;
 if(dist(player,tower)<74){if(state.stage==="collect"){let i=state.inv;if(i.circuit>=3&&i.fuel>=2&&i.scrap>=5){i.circuit-=3;i.fuel-=2;i.scrap-=5;state.stage="defend";state.defend=50;notify("TORRE ATIVADA. HORDA A CAMINHO!",true);sound(680,.6,"sawtooth");save()}else notify("FALTAM RECURSOS. CONSULTE A MISSÃO.",true)}else notify("PROTEJA O TRANSMISSOR!",true);return}
 let c=containers.filter(q=>!q.used&&dist(player,q)<55).sort((a,b)=>dist(player,a)-dist(player,b))[0];if(c)lootFrom(c);else notify("NADA PARA VASCULHAR POR AQUI.");
}
function craft(r){const i=state.inv;if(Object.entries(r.req).some(([k,v])=>(i[k]||0)<v))return notify("RECURSOS INSUFICIENTES.",true);
 if(r.action==="barrier"){let x=player.x+Math.cos(player.facing)*38,y=player.y+Math.sin(player.facing)*38;if(!canWalk(x,y,17))return notify("ESPAÇO BLOQUEADO.",true)}
 Object.entries(r.req).forEach(([k,v])=>i[k]-=v);
 if(r.out)Object.entries(r.out).forEach(([k,v])=>i[k]=(i[k]||0)+v);
 if(r.action==="barrier"){barriers.push({x:Math.round((player.x+Math.cos(player.facing)*38)/T)*T+16,y:Math.round((player.y+Math.sin(player.facing)*38)/T)*T+16,hp:90})}
 sound(420,.2,"square");notify("FABRICADO: "+r.name);renderCraft();save();
}
function setWeapon(i){state.weapon=i;document.querySelectorAll("[data-slot]").forEach(b=>b.classList.toggle("active",Number(b.dataset.slot)===i));sound(280,.06)}
function inventoryRender(){$("inventoryItems").innerHTML=Object.entries(itemDef).map(([k,v])=>'<div class="item"><span class="item-emoji">'+v.icon+'</span><b>'+v.name+'</b><small>QUANTIDADE: '+(state.inv[k]||0)+'</small>'+((["food","water","med"].includes(k))?'<button data-use="'+k+'">USAR</button>':"")+'</div>').join("");document.querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>useItem(b.dataset.use))}
function renderCraft(){$("recipes").innerHTML=recipes.map((r,i)=>'<div class="recipe"><div><h3>'+r.name+'</h3><p>'+r.desc+'</p></div><button data-craft="'+i+'" '+(Object.entries(r.req).some(([k,v])=>(state.inv[k]||0)<v)?"disabled":"")+'>FABRICAR</button></div>').join("");document.querySelectorAll("[data-craft]").forEach(b=>b.onclick=()=>craft(recipes[+b.dataset.craft]))}
function showOverlay(id){if(!started)return;paused=true;modalActive=true;$("inventoryModal").classList.toggle("show",id==="inventoryModal");$("craftModal").classList.toggle("show",id==="craftModal");if(id==="inventoryModal")inventoryRender();else renderCraft()}
function togglePause(){if(!started)return;if(modalActive){hideModals();return}paused=!paused;notify(paused?"JOGO PAUSADO. ESC PARA CONTINUAR.":"RETOMANDO...");if(paused)save()}
function update(dt){clock+=dt;frame++;state.elapsed+=dt;state.weaponCooldown=Math.max(0,state.weaponCooldown-dt);const previousReload=state.reload;state.reload=Math.max(0,state.reload-dt);player.hurt=Math.max(0,player.hurt-dt);screenShake=Math.max(0,screenShake-dt*14);state.shout=Math.max(0,state.shout-dt);
 if(state.reloadPending&&previousReload>0&&state.reload===0&&state.weapon===2&&state.mag<8&&state.inv.ammo>0){state.reloadPending=false;let n=Math.min(8-state.mag,state.inv.ammo);state.mag+=n;state.inv.ammo-=n;sound(440,.08)}
 let mx=(keys.has("d")||keys.has("ArrowRight")?1:0)-(keys.has("a")||keys.has("ArrowLeft")?1:0)+joy.x,my=(keys.has("s")||keys.has("ArrowDown")?1:0)-(keys.has("w")||keys.has("ArrowUp")?1:0)+joy.y,mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag}const movement=walkVector(mx,my);const running=(keys.has("Shift")||runHeld)&&state.stamina>2&&mag>.1&&state.hunger>0;let speed=running?155:99;if(state.stamina<12)speed*=.7;if(mag>.05){slideMove(player,movement.x*speed*dt,movement.y*speed*dt,9);player.walk+=dt*(running?15:9);if(running)state.stamina=Math.max(0,state.stamina-dt*15)}else player.walk+=dt*1.4;state.stamina=Math.min(100,state.stamina+dt*(running?1:10));
 const aX=aim.x-SW/2,aY=aim.y-SH/2;if(Math.hypot(aX,aY)>10){let w=screenDeltaToWorld(aX,aY);player.facing=Math.atan2(w.y,w.x)}else if(mag>.05)player.facing=Math.atan2(movement.y,movement.x);
 if(attackHeld)attack();
 state.hunger=Math.max(0,state.hunger-dt*.027);state.thirst=Math.max(0,state.thirst-dt*.038);if(state.hunger===0||state.thirst===0)state.hp=Math.max(0,state.hp-dt*1.8);if(state.infection>0)state.hp=Math.max(0,state.hp-dt*.014*state.infection);if(state.hp<=0){end(false);return}
 state.weatherTime-=dt;if(state.weatherTime<=0){state.weather=rand()<.38?1:0;state.weatherTime=rand()*80+80;notify(state.weather?"CHUVA SE APROXIMANDO.":"O CÉU ESTÁ LIMPANDO.")}
 if(state.stage==="defend"){state.defend-=dt;if(state.defend<=0){end(true);return}}
 spawnWave(dt);
 for(const z of [...zombies]){z.attack=Math.max(0,z.attack-dt);z.stun=Math.max(0,z.stun-dt);const d=dist(player,z);if(d>1280){zombies.splice(zombies.indexOf(z),1);continue}
 let speed=z.kind?87:53,sense=z.kind?520:360;let angle=z.dir;if(d<sense||state.shout>0&&d<720){angle=Math.atan2(player.y-z.y,player.x-z.x);z.dir=angle}
 else if(rand()<dt*.45)z.dir+=(rand()-.5)*1.6;
 if(d>19&&z.stun<=0){let ox=Math.cos(angle)*speed*dt,oy=Math.sin(angle)*speed*dt,px=z.x,py=z.y;slideMove(z,ox,oy,8);if(Math.abs(z.x-px)+Math.abs(z.y-py)<.4){z.dir+=.5;slideMove(z,Math.cos(z.dir)*speed*dt,Math.sin(z.dir)*speed*dt,8)}}
 z.walk+=dt*(z.kind?12:7);if(d<24&&z.attack<=0){damage(z.kind?13:8,.1);z.attack=1.1}
 }
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.93;p.vy*=.93;p.life-=dt}particles=particles.filter(p=>p.life>0).slice(-500);
 for(const p of tracers)p.life-=dt;tracers=tracers.filter(p=>p.life>0);
 for(const t of texts){t.y+=t.vy*dt;t.life-=dt}texts=texts.filter(t=>t.life>0);
 nearObject=dist(player,tower)<74?tower:containers.filter(c=>!c.used&&dist(player,c)<55).sort((a,b)=>dist(player,a)-dist(player,b))[0];
 uiTimer-=dt;miniTimer-=dt;saveTimer-=dt;if(uiTimer<=0){updateHud();uiTimer=.12}if(miniTimer<=0){drawMinimap();miniTimer=.4}if(saveTimer<=0){save();saveTimer=12}
}
function updateHud(){
 $("hpbar").style.width=state.hp+"%";$("hpval").textContent=Math.ceil(state.hp)+"/100";$("stbar").style.width=state.stamina+"%";$("stval").textContent=Math.ceil(state.stamina)+"%";$("hunger").textContent=Math.ceil(state.hunger)+"%";$("thirst").textContent=Math.ceil(state.thirst)+"%";$("infection").textContent=Math.floor(state.infection)+"%";
 const minutes=(360+Math.floor(state.elapsed*3))%1440;$("time").textContent=String(Math.floor(minutes/60)).padStart(2,"0")+":"+String(minutes%60).padStart(2,"0");$("day").textContent="DIA "+String(1+Math.floor((360+state.elapsed*3)/1440)).padStart(2,"0");$("weather").textContent=state.weather?"☂ CHUVA":"◌ LIMPO";
 $("kills").textContent=String(state.kills).padStart(3,"0");$("ammo").textContent=state.mag+"/"+state.inv.ammo;
 $("questtitle").textContent=state.stage==="collect"?"O ÚLTIMO SINAL":"DEFENDA A TRANSMISSÃO";
 $("questbody").textContent=state.stage==="collect"?"Vasculhe casas e carros. Reúna peças e ative a torre marcada em amarelo.":"A antena está transmitindo! Aguente a invasão até o sinal ser recebido.";
 $("questprogress").textContent=state.stage==="collect"?"CIRCUITOS "+Math.min(3,state.inv.circuit)+"/3 · COMBUSTÍVEL "+Math.min(2,state.inv.fuel)+"/2 · SUCATA "+Math.min(5,state.inv.scrap)+"/5":Math.ceil(state.defend)+" SEGUNDOS RESTANTES";
 $("nearby").classList.toggle("hide",!nearObject);if(nearObject)$("nearby").textContent=nearObject===tower?"[ E ] "+(state.stage==="collect"?"ATIVAR TORRE":"PROTEGER TORRE"):"[ E ] VASCULHAR "+(nearObject.type==="car"?"VEÍCULO":"SUPRIMENTOS");
}
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)}
function tileArt(c,x,y,t,tx,ty){
 const h=hash(tx,ty),colors=[
 ["#43543e","#495841","#3d523d","#455740"],
 ["#505956","#515955","#4a5350","#565e59"],
 ["#706856","#716858","#746c5e","#655e52"],
 ["#6d625b","#73645c","#776b62","#75675c"],
 ["#77644c","#817153","#78644b","#8b7459"],
 ["#254349","#28454a","#224249","#284047"]
 ],color=colors[t] ? colors[t][h%4] : "#43543f";
 diamond(c,x,y,IW+1,IH+1,color);
 if(t===1){
  if(tx%24===2&&ty%24>5)diamond(c,x,y,1.8,5,"#a7a17d");
  if(ty%24===2&&tx%24>5)diamond(c,x,y,7,1.2,"#a7a17d");
  if(h%7===0)px(c,x-9,y-3,7,1,"#686a5d");
 }else if(t===0){if(h%3===0){px(c,x-7,y-3,2,4,"#64815a");px(c,x+6,y+1,2,2,"#53674b")}if(h%17===1)px(c,x+1,y-3,2,2,"#d9b777")}
 else if(t===2){if(h%4===0)px(c,x-5,y,9,1,"#867766");if(h%8===0)px(c,x+8,y+4,2,2,"#b0a27c")}
 else if(t===3){px(c,x-3,y-1,7,2,"#504d48")}
 else if(t===5){px(c,x-7,y-2,6,1,"#45656b")}
}

function drawTree(c,x,y,h){
 px(c,x-11,y+3,25,5,"#0c19188a");
 px(c,x-4,y-28,9,35,"#493a2e");
 px(c,x+1,y-24,4,26,"#6a503b");
 diamond(c,x-3,y-35,24,15,h%2?"#284b38":"#2c523d");
 diamond(c,x+6,y-49,20,13,h%2?"#315c40":"#355f47");
 diamond(c,x-7,y-57,20,12,h%2?"#476f4d":"#416b49");
 px(c,x-13,y-63,11,4,"#5f8655");px(c,x+5,y-52,9,4,"#63865a");
 px(c,x-2,y-70,11,4,"#73916b");
}

const carCols=["#8b6958","#566b68","#65685b","#8a8070"];
function drawCar(c,x,y,car){
 const color=carCols[car.col];c.save();c.translate(Math.round(x),Math.round(y));
 if(car.rot){c.scale(-1,1)}
 poly(c,[{x:-30,y:-7},{x:-8,y:-18},{x:27,y:-3},{x:5,y:9}],"#1c2424");
 poly(c,[{x:-27,y:-11},{x:-7,y:-23},{x:28,y:-7},{x:7,y:4}],color,"#25302d");
 poly(c,[{x:-18,y:-20},{x:-4,y:-34},{x:15,y:-25},{x:4,y:-11}],"#5a7773","#364c49");
 poly(c,[{x:-18,y:-20},{x:-7,y:-8},{x:6,y:-14},{x:-4,y:-34}],"#344f4e");
 poly(c,[{x:15,y:-25},{x:25,y:-12},{x:7,y:4},{x:4,y:-11}],"#495a53");
 px(c,-20,-1,7,5,"#1c2424");px(c,9,7,9,4,"#1c2424");
 px(c,-29,-10,6,3,"#e4cfa7");px(c,20,-6,6,2,"#d75d4f");
 c.restore();
}

function makeChunk(cx,cy){
 // Cached static terrain, never recreate per frame. All elevated objects are depth-sorted separately.
 const a=document.createElement("canvas");a.width=CH*IW*2+2;a.height=CH*IH*2+2;
 const c=a.getContext("2d",{alpha:true});c.imageSmoothingEnabled=false;
 const minX=(cx-cy-1)*CH*IW,minY=(cx+cy)*CH*IH;
 for(let sum=0;sum<CH*2-1;sum++)for(let x=0;x<CH;x++){
   const y=sum-x;if(y<0||y>=CH)continue;
   const tx=cx*CH+x,ty=cy*CH+y,center=iso(tx*T+T/2,ty*T+T/2);
   tileArt(c,center.x-minX,center.y-minY,at(tx,ty),tx,ty);
 }
 for(const d of debris)if(Math.floor(d.x/(CH*T))===cx&&Math.floor(d.y/(CH*T))===cy){
   const q=iso(d.x,d.y);px(c,q.x-minX-4,q.y-minY-2,8,2,d.type===0?"#ac926c":"#1e3733");
 }
 chunkCache.set(cx+","+cy,a);if(chunkCache.size>36)chunkCache.delete(chunkCache.keys().next().value);return a;
}
function ground(camX,camY){
 const corners=[[0,0],[SW,0],[0,SH],[SW,SH]];
 let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
 for(const [xx,yy] of corners){const q=inverseIso(xx+camX,yy+camY);mnX=Math.min(mnX,q.x);mnY=Math.min(mnY,q.y);mxX=Math.max(mxX,q.x);mxY=Math.max(mxY,q.y)}
 let fromX=clamp(Math.floor((mnX-CH*T)/(CH*T)),0,Math.ceil(W/CH)-1),
 fromY=clamp(Math.floor((mnY-CH*T)/(CH*T)),0,Math.ceil(H/CH)-1),
 toX=clamp(Math.floor((mxX+CH*T)/(CH*T)),0,Math.ceil(W/CH)-1),
 toY=clamp(Math.floor((mxY+CH*T)/(CH*T)),0,Math.ceil(H/CH)-1);
 for(let gy=fromY;gy<=toY;gy++)for(let gx=fromX;gx<=toX;gx++){
   let key=gx+","+gy,b=chunkCache.get(key)||makeChunk(gx,gy);
   ctx.drawImage(b,Math.round((gx-gy-1)*CH*IW-camX),Math.round((gx+gy)*CH*IH-camY));
 }
}
function drawHouse(c,house,camX,camY){
 const x=house.x*T,y=house.y*T,x2=x+house.w*T,y2=y+house.h*T,height=44;
 const p0=iso(x,y),p1=iso(x2,y),p2=iso(x2,y2),p3=iso(x,y2);
 for(const p of [p0,p1,p2,p3]){p.x-=camX;p.y-=camY}
 const inside=player.x>x&&player.x<x2&&player.y>y&&player.y<y2;
 const near=player.x>x-48&&player.x<x2+48&&player.y>y-48&&player.y<y2+48;
 c.save();c.globalAlpha=inside?.13:near?.30:1;
 poly(c,[{x:p1.x,y:p1.y-height},{x:p2.x,y:p2.y-height},p2,p1], "#625850","#333931");
 poly(c,[{x:p3.x,y:p3.y-height},{x:p2.x,y:p2.y-height},p2,p3],"#82715f","#3a4039");
 // Side windows in an evenly spaced repeating rhythm.
 for(let i=1;i<house.w;i+=3){let f=i/house.w,xw=p3.x+(p2.x-p3.x)*f,yw=p3.y+(p2.y-p3.y)*f;
   poly(c,[{x:xw-6,y:yw-31},{x:xw+1,y:yw-34},{x:xw+1,y:yw-23},{x:xw-6,y:yw-20}],"#324a4a","#ad9e79")}
 for(let i=1;i<house.h;i+=3){let f=i/house.h,xw=p1.x+(p2.x-p1.x)*f,yw=p1.y+(p2.y-p1.y)*f;
   poly(c,[{x:xw-2,y:yw-31},{x:xw+5,y:yw-27},{x:xw+5,y:yw-17},{x:xw-2,y:yw-20}],"#293e40","#b2a384")}
 const door=iso((house.door+.5)*T,(house.y+house.h)*T);door.x-=camX;door.y-=camY;
 poly(c,[{x:door.x-5,y:door.y-21},{x:door.x+4,y:door.y-25},{x:door.x+4,y:door.y},{x:door.x-5,y:door.y+3}],"#443c2d","#b6a878");
 const roof=[p0,p1,p2,p3].map(q=>({x:q.x,y:q.y-height}));
 poly(c,roof,variation(house.x,house.y)%2?"#765f51":"#68716a","#293b3a");
 // Roof ridge and pixel slates. A raised ridge makes the 3/4 building silhouette obvious.
 const peak={x:(roof[0].x+roof[2].x)/2,y:(roof[0].y+roof[2].y)/2-17};
 poly(c,[roof[0],roof[1],peak],"#7d806d");poly(c,[roof[1],roof[2],peak],"#565e56");
 poly(c,[roof[2],roof[3],peak],"#535b54");poly(c,[roof[3],roof[0],peak],"#899080");
 c.strokeStyle="#9a9472";c.lineWidth=2;c.beginPath();c.moveTo(roof[0].x,roof[0].y);c.lineTo(peak.x,peak.y);c.lineTo(roof[2].x,roof[2].y);c.stroke();
 px(c,peak.x-28,peak.y+13,12,16,"#604f49");px(c,peak.x-30,peak.y+10,16,5,"#948777");
 c.restore();
}

function survivor(c,x,y,d,walk,hurt){
 const q=iso(Math.cos(d)*T,Math.sin(d)*T),screenAngle=Math.atan2(q.y,q.x);
 const back=Math.sin(screenAngle)<-.28,right=Math.cos(screenAngle)>.12;
 const stride=Math.round(Math.sin(walk)*3);
 c.save();c.translate(Math.round(x),Math.round(y));
 px(c,-9,2,21,5,"#101a19a3");
 px(c,-8,0+stride,6,7,"#292f2f");px(c,2,0-stride,6,7,"#252d2c");
 px(c,-8,-19,17,22,hurt?"#b66660":"#3a5349");
 px(c,-7,-20,15,16,"#57715b");px(c,-6,-23,12,12,"#a17b58");
 px(c,-9,-31,17,13,back?"#4d483b":"#c19c76");
 px(c,-10,-33,20,6,"#34372f");
 px(c,-11,-19,5,14,"#b38d66");px(c,8,-19,5,13,"#b38d66");
 px(c,right?2:-7,-27,4,4,back?"#565c48":"#383d31");
 if(state.weapon===2){px(c,right?12:-15,-26,5,20,"#222d2b");px(c,right?12:-15,-28,5,7,"#a7aca2")}
 else if(state.weapon===1){px(c,right?13:-14,-34,5,27,"#765b3d");px(c,right?12:-15,-36,7,5,"#caa16d")}
 c.restore();
}
function zombieArt(c,z,x,y){
 const stride=Math.round(Math.sin(z.walk)*3),q=iso(Math.cos(z.dir)*T,Math.sin(z.dir)*T),back=q.y<-.3;
 c.save();c.translate(Math.round(x),Math.round(y));
 px(c,-9,2,20,5,"#0b1515a0");px(c,-8,0+stride,6,8,"#333830");px(c,3,0-stride,6,8,"#3a3a32");
 px(c,-10,-21,20,23,z.kind?"#954a45":"#555b4d");
 px(c,-8,-18,16,16,z.kind?"#a35a4e":"#606959");
 px(c,-9,-30,17,12,back?"#465444":"#89947a");px(c,-9,-33,17,5,"#34392d");
 px(c,-7,-27,4,3,"#d77b69");px(c,3,-27,4,3,"#d77b69");
 px(c,-15,-18,5,13,"#90947b");px(c,11,-18,5,12,"#8a8d74");c.restore();
 if(z.hp<z.max){px(c,x-12,y-40,24,3,"#271e1d");px(c,x-12,y-40,Math.ceil(24*z.hp/z.max),3,"#b75b54")}
}

function boxArt(c,x,y,used,type){px(c,x-12,y-2,25,17,"#111b1a70");px(c,x-12,y-13,23,18,used?"#56564a":type==="car"?"#726f5d":"#7c7053");px(c,x-10,y-15,20,5,used?"#666659":"#a8976b");px(c,x-2,y-11,4,14,"#3c3d31");if(!used){px(c,x+6,y-17,4,4,"#e0bb69");px(c,x+5,y-18,6,2,"#f4d391")}}
function towerArt(c,x,y){px(c,x-30,y+17,60,13,"#252a26");px(c,x-27,y+14,54,5,"#7a775c");px(c,x-4,y-83,8,99,"#9b9a83");for(let j=0;j<6;j++){let yy=y-70+j*13;px(c,x-18,yy,36,4,"#92978a");px(c,x-17,yy+4,3,11,"#505f59");px(c,x+14,yy+4,3,11,"#505f59");px(c,x-14+j%2*5,yy+4,29,2,"#767c75")}px(c,x-21,y+2,42,16,"#526b61");px(c,x-11,y-3,19,16,"#a3aa88");px(c,x-6,y+1,10,7,"#2c423c");px(c,x-2,y-94,4,16,"#b1b6a1");px(c,x-5,y-88,11,4,"#a8ada0");px(c,x-5,y-100,10,9,state.stage==="defend"?"#d96b5f":"#a94943")}
function drawMinimap(){
 const sx=mc.width/W,sy=mc.height/H;mctx.fillStyle="#1b2b26";mctx.fillRect(0,0,130,130);
 for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){let t=at(x,y);if(t===1)mctx.fillStyle="#5a6059";else if(t===2||t===4)mctx.fillStyle="#999180";else if(t===3)mctx.fillStyle="#6d514e";else if(t===5)mctx.fillStyle="#203b42";else mctx.fillStyle="#355441";mctx.fillRect(x*sx,y*sy,sx*2+1,sy*2+1)}
 mctx.fillStyle="#e3c66f";mctx.fillRect(tower.x/T*sx-2,tower.y/T*sy-2,5,5);mctx.fillStyle="#e5edbb";mctx.fillRect(player.x/T*sx-2,player.y/T*sy-2,4,4);
}
function render(){
 const pos=iso(player.x,player.y),camX=Math.round(pos.x-SW/2),camY=Math.round(pos.y-SH/2);
 ctx.save();if(screenShake>0&&started)ctx.translate(Math.round((rand()-.5)*screenShake),Math.round((rand()-.5)*screenShake));
 ctx.fillStyle="#1c302d";ctx.fillRect(0,0,SW,SH);ground(camX,camY);
 const onScreen=(wx,wy)=>{let p=iso(wx,wy);return {x:p.x-camX,y:p.y-camY}};
 const visible=(q,pad=75)=>q.x>-pad&&q.x<SW+pad&&q.y>-pad&&q.y<SH+pad;
 const renderables=[];
 for(const n of treeSet){let x=n%W,y=Math.floor(n/W),px=x*T+T/2,py=y*T+T/2;const p=onScreen(px,py);if(visible(p,90))renderables.push({depth:iso(px,py).y,kind:"tree",p,h:hash(x,y)})}
 for(const car of cars){const p=onScreen(car.x,car.y);if(visible(p,80))renderables.push({depth:iso(car.x,car.y).y,kind:"car",p,car})}
 for(const c of containers)if(!c.used){const p=onScreen(c.x,c.y);if(visible(p,55))renderables.push({depth:iso(c.x,c.y).y,kind:"box",p,item:c})}
 for(const b of barriers){const p=onScreen(b.x,b.y);if(visible(p,55))renderables.push({depth:iso(b.x,b.y).y,kind:"barrier",p})}
 for(const h of houses){const corner=iso((h.x+h.w)*T,(h.y+h.h)*T);const mid=onScreen((h.x+h.w/2)*T,(h.y+h.h/2)*T);
   if(visible(mid,Math.max(h.w,h.h)*IW+80))renderables.push({depth:corner.y,kind:"house",house:h})}
 let towerPoint=onScreen(tower.x,tower.y);
 if(visible(towerPoint,115))renderables.push({depth:iso(tower.x,tower.y).y,kind:"tower",p:towerPoint});
 for(const z of zombies){let p=onScreen(z.x,z.y);if(visible(p,75))renderables.push({depth:iso(z.x,z.y).y,kind:"zombie",p,z})}
 renderables.push({depth:pos.y,kind:"player",p:{x:SW/2,y:SH/2}});
 renderables.sort((a,b)=>a.depth-b.depth);
 for(const object of renderables){
  const {p,kind}=object;
  if(kind==="house"){drawHouse(ctx,object.house,camX,camY);continue}
  if(kind==="tree"){drawTree(ctx,p.x,p.y,object.h);continue}
  if(kind==="car"){drawCar(ctx,p.x,p.y,object.car);continue}
  if(kind==="box"){boxArt(ctx,p.x,p.y,object.item.used,object.item.type);continue}
  if(kind==="barrier"){px(ctx,p.x-15,p.y-16,30,15,"#47392c");px(ctx,p.x-13,p.y-19,27,5,"#b2905e");px(ctx,p.x-13,p.y-10,27,5,"#95794e");px(ctx,p.x-10,p.y-21,5,26,"#59442e");continue}
  if(kind==="tower"){ctx.strokeStyle=state.stage==="defend"?"#e8907b":"#d9c475";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+2,44+Math.sin(clock*2)*3,20,0,0,TAU);ctx.stroke();towerArt(ctx,p.x,p.y);continue}
  if(kind==="player"){survivor(ctx,p.x,p.y,player.facing,player.walk,player.hurt);continue}
  if(kind==="zombie")zombieArt(ctx,object.z,p.x,p.y);
 }
 for(const part of particles){let q=onScreen(part.x,part.y);if(!visible(q,10))continue;ctx.globalAlpha=clamp(part.life/part.max,0,1);px(ctx,q.x,q.y,part.size,part.size,part.color)}ctx.globalAlpha=1;
 for(const t of tracers){let q=onScreen(t.x,t.y),e=onScreen(t.x2,t.y2);ctx.strokeStyle="#ffe4a1";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(Math.round(q.x),Math.round(q.y-18));ctx.lineTo(Math.round(e.x),Math.round(e.y-18));ctx.stroke()}
 ctx.font="bold 10px monospace";ctx.textAlign="center";for(const t of texts){let q=onScreen(t.x,t.y);ctx.globalAlpha=t.life;ctx.fillStyle="#0c1311";ctx.fillText(t.msg,q.x+1,q.y-35);ctx.fillStyle=t.col;ctx.fillText(t.msg,q.x,q.y-36)}ctx.globalAlpha=1;
 const minutes=(360+state.elapsed*3)%1440,hour=minutes/60;let darkness=hour>=19||hour<=5?.52:hour>=17?(hour-17)*.25:hour<=7?(7-hour)*.26:0;
 if(darkness>0){ctx.fillStyle="rgba(5,12,22,"+darkness+")";ctx.fillRect(0,0,SW,SH);const radius=160,light=ctx.createRadialGradient(SW/2,SH/2,6,SW/2,SH/2,radius);
 light.addColorStop(0,"rgba(255,220,146,.20)");light.addColorStop(1,"rgba(255,220,146,0)");ctx.fillStyle=light;ctx.fillRect(SW/2-radius,SH/2-radius,radius*2,radius*2)}
 if(state.weather&&started){ctx.strokeStyle="#a9b8b653";ctx.lineWidth=1;for(let i=0;i<80;i++){let x=(hash(i,23)+Math.floor(clock*130))%SW,y=(hash(i,41)+Math.floor(clock*280))%SH;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+11);ctx.stroke()}}
 if(player.hurt>0){ctx.fillStyle="rgba(179,37,40,"+(player.hurt*.25)+")";ctx.fillRect(0,0,SW,SH)}
 if(state.stage==="collect"&&started){let vec={x:towerPoint.x-SW/2,y:towerPoint.y-SH/2},d=Math.hypot(vec.x,vec.y);if(d>155){const angle=Math.atan2(vec.y,vec.x),xx=SW/2+Math.cos(angle)*130,yy=SH/2+Math.sin(angle)*115;ctx.save();ctx.translate(xx,yy);ctx.rotate(angle);ctx.fillStyle="#e7ce84";ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-5,-6);ctx.lineTo(-5,6);ctx.fill();ctx.restore();ctx.fillStyle="#e8d18c";ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText(Math.round(dist(player,tower)/T)+"m",xx,yy-14)}}
 if(!modalActive&&started){ctx.strokeStyle="#f2e7cbaa";ctx.beginPath();ctx.moveTo(aim.x-5,aim.y);ctx.lineTo(aim.x-2,aim.y);ctx.moveTo(aim.x+2,aim.y);ctx.lineTo(aim.x+5,aim.y);ctx.moveTo(aim.x,aim.y-5);ctx.lineTo(aim.x,aim.y-2);ctx.moveTo(aim.x,aim.y+2);ctx.lineTo(aim.x,aim.y+5);ctx.stroke()}
 if(paused&&started&&!modalActive){ctx.fillStyle="#08110cc4";ctx.fillRect(0,0,SW,SH);ctx.textAlign="center";ctx.fillStyle="#e1ebd4";ctx.font="bold 30px monospace";ctx.fillText("PAUSADO",SW/2,SH/2);ctx.font="11px monospace";ctx.fillText("APERTE ESC PARA CONTINUAR",SW/2,SH/2+27)}
 ctx.restore();
}

function loop(now){const dt=clamp((now-last)/1000||0,0,.05);last=now;if(started&&!paused&&!modalActive)update(dt);render();requestAnimationFrame(loop)}
function normPointer(e){let b=canvas.getBoundingClientRect(),scale=Math.max(b.width/SW,b.height/SH);return{x:clamp((e.clientX-b.left-(b.width-SW*scale)/2)/scale,0,SW),y:clamp((e.clientY-b.top-(b.height-SH*scale)/2)/scale,0,SH)}}
canvas.addEventListener("pointermove",e=>{if(e.pointerType==="mouse")aim=normPointer(e)});
canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;aim=normPointer(e);attackHeld=true;attack()});
window.addEventListener("pointerup",()=>attackHeld=false);
document.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase()==="shift"?"Shift":e.key.length===1?e.key.toLowerCase():e.key);if(e.repeat)return;
 const key=e.key.toLowerCase();
 if(key==="escape"&&started){if(modalActive)hideModals();else togglePause()}
 if(!started)return;
 if(key==="i")modalActive?hideModals():showOverlay("inventoryModal");
 if(key==="c")modalActive?hideModals():showOverlay("craftModal");
 if(key==="e")interact();if(key==="r")reload();if(key==="q")useItem("med");if(key==="1"||key==="2"||key==="3")setWeapon(+key);
 if(key===" ")attack();
});
document.addEventListener("keyup",e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
$("startBtn").onclick=()=>start(false);$("continueBtn").onclick=()=>start(true);$("restartBtn").onclick=()=>start(false);
$("inventoryBtn").onclick=()=>modalActive?hideModals():showOverlay("inventoryModal");$("craftBtn").onclick=()=>modalActive?hideModals():showOverlay("craftModal");
document.querySelectorAll("[data-slot]").forEach(b=>b.onclick=()=>setWeapon(+b.dataset.slot));
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=hideModals);
$("pauseBtn").onclick=togglePause;
$("audioBtn").onclick=()=>{audioEnabled=!audioEnabled;$("audioBtn").style.color=audioEnabled?"#e5ea9d":"#889c87";if(audioEnabled)sound(440,.08);notify(audioEnabled?"ÁUDIO ATIVADO":"ÁUDIO DESATIVADO")};
const pad=$("joystick"),knob=pad.querySelector(".joy-knob");let joyId=null;
function joyMove(e){let r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.max(1,Math.hypot(dx,dy));joy.x=clamp(dx/40,-1,1);joy.y=clamp(dy/40,-1,1);if(d>40){joy.x=dx/d;joy.y=dy/d}knob.style.transform="translate("+joy.x*27+"px,"+joy.y*27+"px)";if(Math.hypot(joy.x,joy.y)>.15){aim={x:SW/2+joy.x*100,y:SH/2+joy.y*100}}}
pad.addEventListener("pointerdown",e=>{e.preventDefault();joyId=e.pointerId;pad.setPointerCapture(joyId);joyMove(e)});pad.addEventListener("pointermove",e=>{if(joyId===e.pointerId)joyMove(e)});
function joyEnd(e){if(joyId!==e.pointerId)return;joyId=null;joy.x=joy.y=0;knob.style.transform="translate(0,0)"}
pad.addEventListener("pointerup",joyEnd);pad.addEventListener("pointercancel",joyEnd);
$("mobAttack").addEventListener("pointerdown",e=>{e.preventDefault();attackHeld=true;let best=zombies.filter(z=>dist(z,player)<330).sort((a,b)=>dist(a,player)-dist(b,player))[0];if(best){let q=iso(best.x-player.x,best.y-player.y);aim={x:SW/2+q.x,y:SH/2+q.y}};attack()});
$("mobAttack").addEventListener("pointerup",()=>attackHeld=false);$("mobAttack").addEventListener("pointercancel",()=>attackHeld=false);
$("mobRun").addEventListener("pointerdown",e=>{e.preventDefault();runHeld=true});$("mobRun").addEventListener("pointerup",()=>runHeld=false);$("mobRun").addEventListener("pointercancel",()=>runHeld=false);
$("mobE").onclick=interact;
window.addEventListener("beforeunload",save);
window.addEventListener("blur",()=>{if(started&&!modalActive){paused=true;save()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&started){paused=true;save()}});
if(localStorage.getItem(SAVE))$("continueBtn").hidden=false;
updateHud();drawMinimap();requestAnimationFrame(loop);
window.DeadCountyDebug={iso,inverseIso,walkVector,readPixel:(x,y)=>[...ctx.getImageData(x,y,1,1).data],getMetrics:()=>({chunkCache:chunkCache.size,worldObjects:treeSet.size+cars.length+houses.length+containers.length}),getState:()=>({stage:state.stage,player:{...player},zombies:zombies.length,world:{w:W,h:H},kills:state.kills,started,paused,inventory:{...state.inv}}),start:()=>start(false),tick:(n=1)=>{for(let i=0;i<n;i++)update(.016)},teleport:(tx,ty)=>{player.x=tx*T+16;player.y=ty*T+16},grant:(i,n)=>{if(i in state.inv)state.inv[i]+=n},interact,craft:()=>craft(recipes[0]),save,load};
})();
