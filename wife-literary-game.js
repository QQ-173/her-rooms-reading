(() => {
  const room = document.querySelector('#courtyard .room-shell');
  const frame = room?.querySelector('iframe');
  if (!room || !frame) return;

  const state = { perspective: '', done: new Set(), flute: [], roles: new Set() };
  const roles = {
    songlian: { name: '颂莲 · 新进入者', hint: '观察教育、尊严与生存如何在宅院中发生冲突。', question: '颂莲从什么时候开始不再只是规则的观察者，而成为了规则的参与者？' },
    meishan: { name: '梅珊 · 越界者', hint: '寻找那些能够越过院墙、却无法保护人的声音。', question: '当声音可以越过院墙而人不能时，梅珊真正拥有过怎样的自由？' },
    zhuoyun: { name: '卓云 · 熟悉规则', hint: '观察亲近、消息与安全如何被转化为优势。', question: '当安全必须依赖另一个人的失势，我们还能只用善恶评价卓云吗？' },
    yuru: { name: '毓如 · 秩序守门人', hint: '观察名分如何同时提供位置、制造禁锢。', question: '毓如是在维护宅院秩序，还是只能通过秩序证明自己仍然存在？' }
  };

  const shell = document.createElement('div');
  shell.className = 'literary-game-shell courtyard-game-shell';
  shell.innerHTML = `
    <div class="game-cinematic"><div class="game-intro"><p class="game-kicker">A PLAYABLE LITERARY COURTYARD · CHEN RESIDENCE</p><h3>四间房都亮着。<br>没有一扇门真正通向外面。</h3><p>你不需要知道人物结局。先领取一个观察位置，再从紫藤、箫与镜子里收集三份证词。</p><button class="game-start" type="button">进入陈府后院</button></div></div>
    <div class="perspective-panel"><h3>领取你的观察角色</h3><p>人物卡只提供开始体验所需的背景。进入宅院后，你会从她首先注意到的事物理解规则。</p><div class="perspective-grid four">
      <button class="perspective-card role-card" data-perspective="songlian"><i class="role-silhouette short"></i><span class="role-copy"><em class="role-tag">第四位 · 新进入者</em><b>颂莲</b><span>受过新式教育，因家庭变故进入陈府。她既抗拒规则，也逐渐学会借规则保护自己。</span></span></button>
      <button class="perspective-card role-card" data-perspective="meishan"><i class="role-silhouette wave"></i><span class="role-copy"><em class="role-tag">第三位 · 越界者</em><b>梅珊</b><span>曾是戏班名角。她用声音、情感与院外联系，保留不完全属于陈府的自己。</span></span></button>
      <button class="perspective-card role-card" data-perspective="zhuoyun"><i class="role-silhouette bun"></i><span class="role-copy"><em class="role-tag">第二位 · 熟悉规则</em><b>卓云</b><span>温和、体贴，也最懂得消息和亲近的价值。她在不安全中经营自己的位置。</span></span></button>
      <button class="perspective-card role-card" data-perspective="yuru"><i class="role-silhouette"></i><span class="role-copy"><em class="role-tag">正房 · 秩序守门人</em><b>毓如</b><span>拥有最稳定的名分，也承受长期被忽视的生活。她把秩序当作仅剩的确定性。</span></span></button>
    </div></div>
    <div class="game-hud"><div class="game-hud-panel"><div><small>ROLE VIEW</small><b class="hud-view">等待领取</b></div><div class="game-task-dots"><i></i><i></i><i></i></div></div><div class="game-hud-panel game-hud-hint">寻找紫藤、箫、镜与梳；废井会在最后打开。</div></div>
    <div class="game-object-modal" role="dialog" aria-modal="true"><article class="game-object-card"><div class="game-card-top"><div><span class="game-object-no"></span><h3 class="game-object-title"></h3><p class="game-object-copy"></p></div><button class="game-close" aria-label="关闭" type="button">×</button></div><div class="game-workspace"></div><p class="game-feedback" aria-live="polite"></p></article></div>
    <div class="memory-veil"><div class="memory-final"><p class="game-kicker">THE WELL REMEMBERS</p><h3>井盖打开了。<br>里面没有一个可以独自负责的人。</h3><p>门安排位置，窗制造观看，井负责让已经发生的事被忘记。你要怎样离开这座宅院？</p><div class="final-choice"><button data-ending="remember">记住被抹去的人</button><button data-ending="refuse">拒绝分配安全</button><button data-ending="leave">寻找院墙之外</button></div><blockquote class="memory-question"></blockquote><a class="continue-reading" href="#reading-journey">带着这个问题进入原著 →</a></div></div>`;
  room.classList.add('game-ready'); room.appendChild(shell);

  const cinematic = shell.querySelector('.game-cinematic');
  const perspective = shell.querySelector('.perspective-panel');
  const hud = shell.querySelector('.game-hud');
  const modal = shell.querySelector('.game-object-modal');
  const workspace = shell.querySelector('.game-workspace');
  const feedback = shell.querySelector('.game-feedback');

  const tone = (frequency = 220, duration = .18) => {
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = frequency; gain.gain.setValueAtTime(.0001,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.05,ctx.currentTime+.02); gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+duration+.03); } catch {}
  };
  const markDone = id => {
    if (state.done.has(id)) return;
    state.done.add(id); tone(330 + state.done.size * 70,.35);
    window.dispatchEvent(new CustomEvent('herrooms:game-clue-complete',{detail:{id}}));
    [...shell.querySelectorAll('.game-task-dots i')].forEach((dot,i)=>dot.classList.toggle('done',i<state.done.size));
    document.querySelector(`.object-index [data-object="${id}"]`)?.classList.add('found');
    if (state.done.size === 3) setTimeout(showMemory,900);
  };
  const closeModal = () => modal.classList.remove('open');
  shell.querySelector('.game-close').addEventListener('click',closeModal);

  const openWisteria = () => {
    workspace.innerHTML = `<div class="veil-stage"><i class="veil-well"></i><i class="veil-vines" style="--veil:.96"></i></div><label class="veil-control">拨开覆盖井口的紫藤<input type="range" min="0" max="100" value="4"></label><button class="veil-nudge" type="button">拨开一层枝叶</button>`;
    feedback.textContent = '美丽并不总是出口。它有时也会成为让阴影更难被看见的帘幕。';
    const input=workspace.querySelector('input'), vines=workspace.querySelector('.veil-vines');
    const check=()=>{vines.style.setProperty('--veil',String(1-(+input.value/110)));if(+input.value>78){feedback.textContent='井口一直都在，只是宅院训练所有人先看见花。';markDone('wisteria')}};
    input.addEventListener('input',check); workspace.querySelector('.veil-nudge').addEventListener('click',e=>{input.value=Math.min(100,+input.value+26);e.currentTarget.textContent=+input.value>78?'井口已经显露':'继续拨开';tone(190+(+input.value)*1.4);check()});
  };
  const openFlute = () => {
    state.flute=[]; workspace.innerHTML=`<div class="tone-pattern">${[1,2,3,4].map(n=>`<button class="tone-hole" data-hole="${n}" type="button">${n}</button>`).join('')}</div><p class="tone-sequence">听见的顺序：二 · 四 · 一</p>`;
    feedback.textContent='让三个音依次越过院墙。声音能够离开，人却仍留在原地。'; const target=[2,4,1];
    workspace.querySelectorAll('.tone-hole').forEach(btn=>btn.addEventListener('click',()=>{const n=+btn.dataset.hole;tone([220,293.66,329.63,392][n-1],.28);state.flute.push(n);btn.classList.add('active');setTimeout(()=>btn.classList.remove('active'),220);const index=state.flute.length-1;if(target[index]!==n){state.flute=[];feedback.textContent='声音在院内折返了。重新从第二个音孔开始。';return}if(state.flute.length===target.length){feedback.textContent='箫声越过了墙：宅院无法完全控制声音，却仍能惩罚发出声音的人。';markDone('flute')}}));
  };
  const openMirror = () => {
    state.roles.clear(); workspace.innerHTML=`<div class="identity-mirror"><span class="identity-name">颂莲</span></div><div class="identity-chips"><button class="identity-chip" type="button">学生</button><button class="identity-chip" type="button">第四位</button><button class="identity-chip" type="button">竞争者</button></div><button class="identity-confirm" type="button" disabled>擦去所有称谓</button>`;
    const confirm=workspace.querySelector('.identity-confirm'); feedback.textContent='点击三个称谓。每个名字都描述她，也都在缩小她。';
    workspace.querySelectorAll('.identity-chip').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.toggle('removed');btn.classList.contains('removed')?state.roles.add(btn.textContent):state.roles.delete(btn.textContent);confirm.disabled=state.roles.size<3;tone(260+state.roles.size*40)}));
    confirm.addEventListener('click',()=>{workspace.querySelector('.identity-name').textContent='她自己？';feedback.textContent='镜面没有给出纯粹的自己：人在规则中求生，也会被求生方式重新塑造。';markDone('mirror')});
  };
  const openWell = () => {
    modal.classList.add('open'); shell.querySelector('.game-object-no').textContent='OBJECT 04 · THE WELL'; shell.querySelector('.game-object-title').textContent='废井'; shell.querySelector('.game-object-copy').textContent='宅院要求所有人忘记的历史。';
    workspace.innerHTML='<div class="veil-stage"><i class="veil-well"></i></div>'; feedback.textContent=state.done.size<3?`井盖仍然封着。还缺少 ${3-state.done.size} 份证词。`:'三份证词已经让井盖松动。';
  };
  const openGame = id => {
    if(!state.perspective)return;
    if(id==='well'){openWell();return} if(!['wisteria','flute','mirror'].includes(id))return;
    modal.classList.add('open'); const data={wisteria:['EVIDENCE 01 · VEIL','紫藤','拨开美丽的遮挡，看见它同时隐藏了什么。'],flute:['EVIDENCE 02 · SOUND','箫','复现一段能够越过院墙的声音。'],mirror:['EVIDENCE 03 · IDENTITY','镜与梳','暂时擦去宅院赋予人物的三个称谓。']}[id];
    shell.querySelector('.game-object-no').textContent=data[0];shell.querySelector('.game-object-title').textContent=data[1];shell.querySelector('.game-object-copy').textContent=data[2];({wisteria:openWisteria,flute:openFlute,mirror:openMirror}[id])();
  };
  const showMemory=()=>{closeModal();room.classList.add('memory-mode');shell.querySelector('.memory-veil').classList.add('show');tone(110,.9)};

  shell.querySelector('.game-start').addEventListener('click',()=>{tone(174,.4);cinematic.classList.add('hidden');perspective.classList.add('show')});
  shell.querySelectorAll('[data-perspective]').forEach(btn=>btn.addEventListener('click',()=>{state.perspective=btn.dataset.perspective;perspective.classList.remove('show');hud.classList.add('show');shell.querySelector('.hud-view').textContent=roles[state.perspective].name;shell.querySelector('.game-hud-hint').textContent=roles[state.perspective].hint;tone(246.94,.35)}));
  shell.querySelectorAll('[data-ending]').forEach(btn=>btn.addEventListener('click',()=>{const q=roles[state.perspective].question;shell.querySelector('.memory-question').textContent=q;shell.querySelector('.memory-question').classList.add('show');shell.querySelector('.continue-reading').classList.add('show');window.dispatchEvent(new CustomEvent('herrooms:game-question',{detail:{question:q}}));tone(btn.dataset.ending==='leave'?392:293.66,.5)}));
  document.querySelectorAll('.object-index [data-object]').forEach(btn=>btn.addEventListener('click',()=>openGame(btn.dataset.object)));
  window.addEventListener('message',event=>{if(event.data?.type==='wife-room-clue')openGame(event.data.id)});
})();
