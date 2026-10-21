'use strict';
/* ===== b_core: constants, RNG, helpers, definitions, synth audio ===== */
const T=32, FW=40, FH=30;
const WP={dbg:{crossFloor:0,nan:0,wallClip:0,log:[]},G:null,ver:'0.1-прототип'};
let RS=1;
function srand(s){RS=(s>>>0)||1}
function rnd(){RS=(RS+0x6D2B79F5)>>>0;let t=RS;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
const rr=(a,b)=>a+rnd()*(b-a), ri=(a,b)=>Math.floor(rr(a,b+1)), pick=a=>a[Math.floor(rnd()*a.length)];
const fr=(a,b)=>a+Math.random()*(b-a); // visual-only randomness
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d}
/* sprint & stamina: hold Run (Shift / button) for x1.5 speed; drains while running, refills after a pause */
/* per-map balance: generator repair speed + killer speed multiplier (tuned with tests/tune.py, target killer win 35-50%) */
const TUNE={mansion:{gen:0.85,stitches:1.08,bride:1.086,rotjaw:0.84,shepherd:1.15,oni:0.83},village:{gen:2.8,stitches:0.975,bride:0.936,rotjaw:0.895,shepherd:1.03,oni:0.87},ship:{gen:2.2,stitches:1.16,bride:1.117,rotjaw:0.91,shepherd:1.041,oni:0.92}};
const STAM={s:{dur:4,full:6,walk:88,mul:1.5,hurt:0.9,delay:1,exDelay:2.2},k:{dur:2.5,full:8,walkMul:0.88,mul:1.5,delay:1,exDelay:2.6}};
const tc=v=>Math.floor(v/T), cc=t=>t*T+T/2;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

const KILLERS={
 stitches:{id:'stitches',name:'Мистер Стежок',speed:115,body:'#5b3b2c',hood:'#2e1f18',skin:'#cdb393',acc:'#b8322c',
  desc:'Сшитый из чужих лиц мясник с крюком на верёвке.',
  ab:[{id:'rope',name:'Нить',cd:12,kind:'ray',range:270,desc:'Крюк на верёвке подтягивает выжившего'},
      {id:'rip',name:'Разрыв',cd:20,kind:'self',radius:46,desc:'4 с ускорения, ломает препятствия с одного удара'}],
  passive:{name:'Сшитый',desc:'Оглушение от мебели вдвое короче'}},
 bride:{id:'bride',name:'Бледная Невеста',speed:114,body:'#d9d4cc',hood:'#efeae2',skin:'#b9c4c8',acc:'#7a8ea0',
  desc:'Невеста, которую так и не нашли. Шепчет за спиной.',
  ab:[{id:'whisper',name:'Шёпот',cd:25,kind:'target',range:520,desc:'Исчезает и появляется за ближайшим выжившим'},
      {id:'veil',name:'Фата',cd:10,kind:'proj',range:240,desc:'Брошенная фата опутывает на 3 с'}],
  passive:{name:'Холод',desc:'Рядом с ней генераторы чинят медленнее, экран покрывается инеем'}},
 rotjaw:{id:'rotjaw',name:'Гнилая Челюсть',speed:116,body:'#4a5a34',hood:'#2c3620',skin:'#8a9a5a',acc:'#e8e0b0',
  desc:'Сгорбленный зверь с вывернутой челюстью. Чует кровь.',
  ab:[{id:'sense',name:'Чутьё',cd:30,kind:'self',radius:0,desc:'6 с слышит все сердца на карте'},
      {id:'pounce',name:'Прыжок',cd:26,kind:'dash',range:190,desc:'Длинный прыжок сбивает с ног'}],
  passive:{name:'Нюх',desc:'Видит кровавые следы вдвое дольше'}}
};
const SURVS={
 nora:{id:'nora',name:'Нора Вэнс',hp:100,body:'#3c6e8a',hood:'#284c60',skin:'#e0b896',hair:'#5a3220',
  desc:'Медсестра из Огайо. Пропала после ночной смены.',ab:{id:'shot',name:'Укол',cd:30,kind:'circle',range:90,desc:'Лечит 30 ОЗ себе или союзнику в круге'}},
 tyler:{id:'tyler',name:'Тайлер Грейвс',hp:85,body:'#b8662a',hood:'#7a3e18',skin:'#d8a882',hair:'#2a1a10',
  desc:'Курьер из Техаса. Быстрые ноги.',ab:{id:'sprint',name:'Рывок',cd:25,kind:'arrow',range:120,desc:'2 с спринта'}},
 ruth:{id:'ruth',name:'Рут Окафор',hp:100,body:'#6a4a8a',hood:'#46305e',skin:'#7a4e30',hair:'#1a1010',
  desc:'Электрик из Атланты.',ab:{id:'overload',name:'Перегрузка',cd:40,kind:'circle',range:60,desc:'Генератор рядом чинится вдвое быстрее 10 с'}},
 sam:{id:'sam',name:'Сэм Келлер',hp:70,body:'#4a6a3a',hood:'#2e4424',skin:'#e8c8a8',hair:'#c8a050',
  desc:'Школьник из Орегона. Умеет прятаться.',ab:{id:'hide',name:'Затаиться',cd:30,kind:'self',range:0,desc:'Сердце молчит 6 с'}},
 victor:{id:'victor',name:'Виктор Хейл',hp:100,body:'#5a5a62',hood:'#34343c',skin:'#d0a080',hair:'#6a6a6a',
  desc:'Бывший полицейский из Мэна. С фонарём.',ab:{id:'lamp',name:'Фонарь',cd:25,kind:'cone',range:150,half:0.42,desc:'Ослепляет убийцу на 2 с'}}
};
const DIFF=[
 {name:'Лёгкий',kReact:0.7,kAim:0.35,kSight:0.8,kAb:0.4,kSlug:0.6,sFlee:150,sSkill:0.6,sAb:0.5},
 {name:'Нормальный',kReact:0.4,kAim:0.18,kSight:1,kAb:0.75,kSlug:0.5,sFlee:220,sSkill:0.8,sAb:0.8},
 {name:'Кошмар',kReact:0.2,kAim:0.06,kSight:1.15,kAb:1,kSlug:0.4,sFlee:260,sSkill:1,sAb:1}];
const HIT_DMG=45, TERROR=190, SIGHT=300;

/* ---- synthesized audio (WebAudio, no files) ---- */
const AU={ctx:null,master:null,on:true,lastBeat:0,
 init(){if(this.ctx||!this.on)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=0.6;this.master.connect(this.ctx.destination);this.drone()}catch(e){this.ctx=null}},
 env(node,t0,a,d,peak){const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+a);g.gain.exponentialRampToValueAtTime(0.0001,t0+a+d);node.connect(g);g.connect(this.master);return g},
 tone(freq,dur,type,vol,slide){if(!this.ctx)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);this.env(o,t,0.01,dur,vol||0.3);o.start(t);o.stop(t+dur+0.05)},
 noise(dur,vol,lp){if(!this.ctx)return;const t=this.ctx.currentTime,n=Math.floor(this.ctx.sampleRate*dur),b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=b;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=lp||1200;s.connect(f);this.env(f,t,0.005,dur,vol||0.3);s.start(t)},
 siren(){if(!this.ctx)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';for(let i=0;i<4;i++){o.frequency.setValueAtTime(380,t+i*0.9);o.frequency.linearRampToValueAtTime(760,t+i*0.9+0.45);o.frequency.linearRampToValueAtTime(380,t+i*0.9+0.9)}const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.09,t+0.2);g.gain.setValueAtTime(0.09,t+3.3);g.gain.exponentialRampToValueAtTime(0.0001,t+3.7);o.connect(lp);lp.connect(g);g.connect(this.master);o.start(t);o.stop(t+3.8)},
 beat(vol){if(!this.ctx)return;const t=this.ctx.currentTime;[0,0.16].forEach((dt,i)=>{const o=this.ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(i?52:62,t+dt);o.frequency.exponentialRampToValueAtTime(30,t+dt+0.15);this.env(o,t+dt,0.008,0.18,vol*(i?0.7:1));o.start(t+dt);o.stop(t+dt+0.3)})},
 drone(){const t=this.ctx.currentTime;[41,61.7].forEach(f=>{const o=this.ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;const g=this.ctx.createGain();g.gain.value=0.035;o.connect(lp);lp.connect(g);g.connect(this.master);o.start(t)})},
 sfx(n){if(!this.ctx)return;switch(n){
  case'hit':this.noise(0.25,0.5,900);this.tone(180,0.25,'square',0.15,60);break;
  case'scream':this.tone(880,0.7,'sawtooth',0.08,320);this.tone(660,0.7,'triangle',0.08,250);break;
  case'totem':this.tone(110,0.9,'sawtooth',0.12,70);this.noise(0.5,0.18,500);this.tone(220,0.6,'square',0.04,330);break;
  case'slash':this.noise(0.25,0.3,3000);this.tone(1800,0.18,'sawtooth',0.06,500);break;
  case'souls':this.tone(180,2.2,'sine',0.12,90);this.tone(272,2.0,'triangle',0.06,140);this.noise(1.2,0.12,900);break;
  case'soulhit':this.tone(520,0.3,'sine',0.08,260);this.noise(0.15,0.1,1800);break;
  case'tp':this.tone(90,1.0,'sawtooth',0.1,420);this.tone(660,0.9,'sine',0.05,1320);this.noise(0.9,0.12,700);break;
  case'bell':this.tone(660,1.4,'triangle',0.16,640);this.tone(990,1.0,'sine',0.08,980);this.tone(1320,0.6,'sine',0.04);break;
  case'bleat':this.tone(420,0.5,'sawtooth',0.06,300);this.tone(430,0.5,'square',0.03,310);break;
  case'whistle':this.tone(2400,0.18,'sine',0.06,2600);break;
  case'creak':this.tone(310,0.28,'square',0.04,240);this.tone(190,0.3,'sawtooth',0.03,150);break;
  case'thunder':this.noise(1.8,0.5,260);this.tone(38,1.4,'sine',0.35,25);break;
  case'blackout':this.tone(220,0.6,'square',0.08,40);this.noise(0.5,0.2,900);break;
  case'hook':this.tone(120,0.5,'square',0.2,40);this.noise(0.4,0.3,500);break;
  case'gen':this.tone(220,0.4,'square',0.12,440);this.tone(330,0.6,'triangle',0.12,660);break;
  case'gate':[0,1,2].forEach(i=>setTimeout(()=>this.tone(300+i*120,0.3,'square',0.1),i*150));break;
  case'swing':this.noise(0.12,0.2,3000);break;
  case'stun':this.noise(0.3,0.5,400);this.tone(90,0.3,'square',0.2,40);break;
  case'fall':this.noise(0.35,0.6,300);break;
  case'ab':this.tone(500,0.25,'triangle',0.12,1000);break;
  case'spark':this.noise(0.05,0.08,6000);break;
  case'stair':this.noise(0.08,0.12,700);break;
 }}
};
