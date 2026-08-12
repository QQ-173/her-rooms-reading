(() => {
  const room = document.querySelector('#room .room-stage');
  const frame = room?.querySelector('iframe');
  if (!room || !frame) return;

  const state = { perspective: '', done: new Set(), current: '', future: [], shoe: new Set(), signature: '' };
  const copy = {
    lila: { name: '跟随莉拉', hint: '寻找那些被看见、却没有被承认的创造。', question: '如果一个人的创造不断被别人命名，她要怎样证明那曾经属于自己？' },
    lenu: { name: '跟随莱农', hint: '寻找那些让一个女孩离开、又不断回望的东西。', question: '离开街区以后，我们是在获得自己，还是在学习用别人的目光重新看自己？' },
    between: { name: '站在她们之间', hint: '不要判断谁更天才，观察机会怎样把她们分开。', question: '一段友谊究竟能否抵抗教育、金钱与家庭为两个人安排的不同命运？' }
  };

  const shell = document.createElement('div');
  shell.className = 'literary-game-shell';
  shell.innerHTML = `
    <div class="game-cinematic">
      <div class="game-intro"><p class="game-kicker">A PLAYABLE LITERARY ROOM · 1950s NAPLES</p><h3>两个女孩从同一条街出发。<br>房间会记住她们如何分开。</h3><p>这不是原著测试。你不需要知道答案，只需要走近三件物品，观察谁有权学习、创造与离开。</p><button class="game-start" type="button">戴上耳机 · 进入鞋匠铺</button></div>
    </div>
    <div class="perspective-panel"><h3>你想从哪里看这段友谊？</h3><p>视角不会改变事实，但会改变房间首先让你看见什么。</p><div class="perspective-grid">
      <button class="perspective-card role-card" data-perspective="lila"><i class="role-silhouette wave"></i><span class="role-copy"><em class="role-tag">莉拉 · 被迫留下</em><b>跟随莉拉</b><span>敏锐、反抗，没有继续读书。她的天赋不断进入劳动与交易。</span></span></button>
      <button class="perspective-card role-card" data-perspective="lenu"><i class="role-silhouette"></i><span class="role-copy"><em class="role-tag">莱农 · 得以离开</em><b>跟随莱农</b><span>通过教育离开街区，也不断借由书写回望留下的朋友。</span></span></button>
      <button class="perspective-card role-card" data-perspective="between"><i class="role-silhouette short"></i><span class="role-copy"><em class="role-tag">旁观者 · 两人的尺度</em><b>站在她们之间</b><span>不判断谁更天才，观察机会如何在同一条街制造距离。</span></span></button>
    </div></div>
    <div class="game-hud"><div class="game-hud-panel"><div><small>CURRENT VIEW</small><b class="hud-view">等待选择</b></div><div class="game-task-dots"><i></i><i></i><i></i></div></div><div class="game-hud-panel game-hud-hint">靠近并点击：玩偶、《小妇人》、男式旅行鞋</div></div>
    <div class="game-object-modal" role="dialog" aria-modal="true"><article class="game-object-card"><div class="game-card-top"><div><span class="game-object-no"></span><h3 class="game-object-title"></h3><p class="game-object-copy"></p></div><button class="game-close" aria-label="关闭" type="button">×</button></div><div class="game-workspace"></div><p class="game-feedback" aria-live="polite"></p></article></div>
    <div class="memory-veil"><div class="memory-final"><p class="game-kicker">THE ROOM REMEMBERS</p><h3>两道影子走向不同的出口。</h3><p>你完成的不是答案，而是一种观看方式。现在决定：离开房间时，你要跟随谁的脚步？</p><div class="final-choice"><button data-ending="lila">跟随留下的人</button><button data-ending="lenu">跟随离开的人</button><button data-ending="between">留在两道影子之间</button></div><blockquote class="memory-question"></blockquote><a class="continue-reading" href="#reading-journey">带着这个问题进入原著 →</a></div></div>`;
  room.classList.add('game-ready');
  room.appendChild(shell);

  const cinematic = shell.querySelector('.game-cinematic');
  const perspective = shell.querySelector('.perspective-panel');
  const hud = shell.querySelector('.game-hud');
  const modal = shell.querySelector('.game-object-modal');
  const workspace = shell.querySelector('.game-workspace');
  const feedback = shell.querySelector('.game-feedback');

  const tone = (frequency = 220, duration = .16) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = frequency; gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.055, ctx.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration + .02);
    } catch {}
  };

  const markDone = id => {
    if (state.done.has(id)) return;
    state.done.add(id); tone(440 + state.done.size * 80, .35);
    window.dispatchEvent(new CustomEvent('herrooms:game-clue-complete', { detail: { id } }));
    [...shell.querySelectorAll('.game-task-dots i')].forEach((dot, i) => dot.classList.toggle('done', i < state.done.size));
    document.querySelector(`.clue-strip [data-clue="${id}"]`)?.classList.add('found');
    if (state.done.size === 3) setTimeout(showMemory, 900);
  };

  const closeModal = () => modal.classList.remove('open');
  shell.querySelector('.game-close').addEventListener('click', closeModal);

  const openDolls = () => {
    workspace.innerHTML = `<div class="shadow-stage" style="--shadow-one:24%;--shadow-two:76%;--lamp:50%"><i class="shadow-figure one"></i><i class="shadow-figure two"></i></div><div class="shadow-controls"><label>移动蒂娜的影子<input data-shadow="one" type="range" min="15" max="75" value="24"></label><label>移动努的影子<input data-shadow="two" type="range" min="25" max="85" value="76"></label></div><button class="shadow-nudge" type="button">让两个影子再靠近一点</button>`;
    feedback.textContent = '让两个影子重合。一个女孩独自越界，不会构成她们共同的故事。';
    const stage = workspace.querySelector('.shadow-stage');
    const checkShadows = () => {
      const values = [...workspace.querySelectorAll('input')].map(x => +x.value);
      values.forEach((value, index) => stage.style.setProperty(`--shadow-${index ? 'two' : 'one'}`, `${value}%`));
      if (Math.abs(values[0] - values[1]) < 6) { feedback.textContent = '两个影子终于重合：勇气不是一个人的属性，也可能在模仿中被共同制造。'; markDone('dolls'); }
    };
    workspace.querySelectorAll('input').forEach(input => input.addEventListener('input', checkShadows));
    workspace.querySelector('.shadow-nudge').addEventListener('click', event => {
      const inputs = [...workspace.querySelectorAll('input')];
      inputs[0].value = Math.min(50, +inputs[0].value + 9);
      inputs[1].value = Math.max(50, +inputs[1].value - 9);
      event.currentTarget.textContent = Math.abs(+inputs[0].value - +inputs[1].value) < 6 ? '两个影子已经重合' : '再靠近一点';
      tone(220 + (+inputs[0].value) * 2, .18); checkShadows();
    });
  };

  const openBook = () => {
    const words = ['写作', '留下', '离开', '被看见']; state.future = [];
    workspace.innerHTML = `<div class="future-words">${words.map(w => `<button class="future-word" type="button">${w}</button>`).join('')}</div><div class="future-line">点击词语，排列你想象中的未来。</div><button class="future-confirm" type="button" disabled>把这句话留在书页里</button>`;
    const line = workspace.querySelector('.future-line'), confirm = workspace.querySelector('.future-confirm');
    workspace.querySelectorAll('.future-word').forEach(btn => btn.addEventListener('click', () => {
      btn.classList.toggle('chosen'); state.future = [...workspace.querySelectorAll('.future-word.chosen')].map(x => x.textContent); line.textContent = state.future.length ? `她们相信：${state.future.join('，然后')}。` : '点击词语，排列你想象中的未来。'; confirm.disabled = state.future.length < 3; tone(280 + state.future.length * 45);
    }));
    confirm.addEventListener('click', () => { feedback.textContent = '同一本书给了她们共同的想象，却没有给她们相同的道路。'; markDone('book'); });
    feedback.textContent = '这里没有正确顺序。重要的是：谁有机会把想象变成生活？';
  };

  const openShoe = () => {
    state.shoe.clear(); state.signature = '';
    workspace.innerHTML = `<div class="shoe-parts"><button class="shoe-part" data-part="sole"><b>鞋底</b><br><small>劳动与耐用</small></button><button class="shoe-part" data-part="upper"><b>鞋面</b><br><small>设计与想象</small></button><button class="shoe-part" data-part="lace"><b>鞋带</b><br><small>使作品完整</small></button></div><div class="signature-choice"><button data-signature="designer">署名：设计者</button><button data-signature="owner">署名：出资者</button></div><button class="shoe-confirm" type="button" disabled>完成这双鞋</button>`;
    const confirm = workspace.querySelector('.shoe-confirm');
    const check = () => confirm.disabled = state.shoe.size < 3 || !state.signature;
    workspace.querySelectorAll('.shoe-part').forEach(btn => btn.addEventListener('click', () => { btn.classList.toggle('selected'); btn.classList.contains('selected') ? state.shoe.add(btn.dataset.part) : state.shoe.delete(btn.dataset.part); tone(180 + state.shoe.size * 55); check(); }));
    workspace.querySelectorAll('[data-signature]').forEach(btn => btn.addEventListener('click', () => { workspace.querySelectorAll('[data-signature]').forEach(x => x.classList.remove('selected')); btn.classList.add('selected'); state.signature = btn.dataset.signature; check(); }));
    confirm.addEventListener('click', () => { feedback.textContent = state.signature === 'designer' ? '你把名字还给了设计者，但交易仍然决定这双鞋将去哪里。' : '作品完成了，设计者的名字却从商品上消失了。'; markDone('shoe'); });
    feedback.textContent = '选择构成鞋的三个部分，再决定最后写上谁的名字。';
  };

  const openGame = id => {
    if (!state.perspective || !['dolls','book','shoe'].includes(id)) return;
    state.current = id; modal.classList.add('open');
    const data = { dolls:['OBJECT 01 · SHADOW','蒂娜与努','移动两只玩偶留下的影子。'], book:['OBJECT 02 · FUTURE','《小妇人》','用四个词排列她们共同想象的未来。'], shoe:['OBJECT 03 · OWNERSHIP','男式旅行鞋','组装一件作品，并决定谁能留下名字。'] }[id];
    shell.querySelector('.game-object-no').textContent = data[0]; shell.querySelector('.game-object-title').textContent = data[1]; shell.querySelector('.game-object-copy').textContent = data[2];
    ({dolls:openDolls,book:openBook,shoe:openShoe}[id])();
  };

  const showMemory = () => { closeModal(); room.classList.add('memory-mode'); shell.querySelector('.memory-veil').classList.add('show'); tone(146.8,.8); };

  shell.querySelector('.game-start').addEventListener('click', () => { tone(196,.4); cinematic.classList.add('hidden'); perspective.classList.add('show'); });
  shell.querySelectorAll('[data-perspective]').forEach(btn => btn.addEventListener('click', () => { state.perspective = btn.dataset.perspective; perspective.classList.remove('show'); hud.classList.add('show'); shell.querySelector('.hud-view').textContent = copy[state.perspective].name; shell.querySelector('.game-hud-hint').textContent = copy[state.perspective].hint; tone(261.6,.32); }));
  shell.querySelectorAll('[data-ending]').forEach(btn => btn.addEventListener('click', () => { const ending = btn.dataset.ending; const q = ending === state.perspective ? copy[ending].question : copy.between.question; shell.querySelector('.memory-question').textContent = q; shell.querySelector('.memory-question').classList.add('show'); shell.querySelector('.continue-reading').classList.add('show'); localStorage.setItem('herrooms-game-question', q); window.dispatchEvent(new CustomEvent('herrooms:game-question', { detail: { question: q } })); tone(392,.5); }));

  document.querySelectorAll('.clue-strip [data-clue]').forEach(btn => btn.addEventListener('click', () => openGame(btn.dataset.clue)));
  window.addEventListener('message', event => { if (event.data?.type === 'genius-room-clue') openGame(event.data.id); });
})();
