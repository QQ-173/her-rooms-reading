(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('reader') === 'finished' || !document.querySelector('.reading-journey')) return;
  const wife = document.body.classList.contains('wife-page');
  const book = wife ? 'courtyard' : 'genius';
  const config = wife ? {
    title: '妻妾成群', room: 'courtyard', archive: 'archive', cardClass: 'courtyard-card',
    tasks: { wisteria: '紫藤', flute: '箫', mirror: '镜与梳' },
    buy: 'https://product.dangdang.com/product.aspx?product_id=28549085'
  } : {
    title: '我的天才女友', room: 'room', archive: 'reading', cardClass: 'genius-card',
    tasks: { dolls: '玩偶', book: '《小妇人》', shoe: '男式旅行鞋' },
    buy: 'https://e.dangdang.com/products/1900653911.html'
  };
  const key = `her-rooms-flow-${book}-v1`;
  const load = () => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
  const state = Object.assign({ primer: false, room: [], question: '', card: false }, load());
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} };

  const bar = document.createElement('aside');
  bar.className = 'journey-progress';
  bar.setAttribute('aria-label', '本次体验进度');
  bar.innerHTML = `<strong>本次体验</strong><nav><a data-flow="primer" href="#primer"><i>1</i><span>序章</span></a><a data-flow="room" href="#${config.room}"><i>2</i><span>房间</span></a><a data-flow="question" href="#reading-journey"><i>3</i><span>问题</span></a><a data-flow="card" href="#reading-card"><i>4</i><span>带走</span></a></nav><span class="flow-percent">0%</span>`;
  document.body.append(bar);

  const mission = document.createElement('div');
  mission.className = 'room-mission-strip';
  mission.innerHTML = `<strong>本次只寻找</strong>${Object.entries(config.tasks).map(([id,label]) => `<span class="room-task" data-room-task="${id}">${label}</span>`).join('')}<span class="room-task-count">0 / 3</span>`;
  const roomSection = document.querySelector(`#${config.room}`);
  roomSection.insertBefore(mission, roomSection.querySelector('.room-stage,.room-shell') || roomSection.firstChild);

  const result = document.createElement('section');
  result.id = 'reading-card';
  result.className = `reading-card-result ${config.cardClass}`;
  result.hidden = !state.question;
  result.innerHTML = `<div class="result-head"><div><p class="eyeline">TAKE A QUESTION WITH YOU</p><h2>带走你的阅读问题</h2></div><p>体验没有替你解释完这本书。它只负责把一个真正属于你的问题，交到阅读开始的地方。</p></div><div class="result-grid"><article class="question-share-card" aria-label="阅读问题卡"><span class="card-brand">她的房间 · HER ROOMS</span><p class="card-book"></p><blockquote class="card-question"></blockquote><span class="card-footer">一个只能继续进入原著才能回答的问题</span></article><aside class="result-actions"><blockquote class="result-quote"></blockquote><button class="save-card" type="button">保存问题卡 PNG</button><button class="share-card" type="button">分享 / 复制问题</button><a class="find-book" target="_blank" rel="noopener">开始阅读这本书 ↗</a><p class="completion-line">你没有解开这本书。<br>你获得了一个进入它的理由。</p><p class="card-toast" role="status" aria-live="polite"></p></aside></div>`;
  document.querySelector('.reading-journey').after(result);
  result.querySelector('.find-book').href = config.buy;

  function setQuestion(question) {
    state.question = question.trim();
    result.hidden = false;
    result.querySelector('.card-book').textContent = `《${config.title}》· 我的读前问题`;
    result.querySelector('.card-question').textContent = state.question;
    result.querySelector('.result-quote').textContent = state.question;
    save(); update();
  }
  if (state.question) setQuestion(state.question);
  else {
    const selected = document.querySelector('.question-card.selected');
    if (selected) setQuestion(selected.textContent);
  }

  function markRoom(id) {
    if (!config.tasks[id] || state.room.includes(id)) return;
    state.room.push(id); save(); update();
  }
  window.addEventListener('herrooms:primer-complete', () => { state.primer = true; save(); update(); });
  window.addEventListener('message', event => {
    if (event.data?.type === `${book === 'genius' ? 'genius' : 'wife'}-room-clue`) markRoom(event.data.id);
  });
  document.querySelectorAll(wife ? '.object-index button' : '.clue-strip button').forEach(button => button.addEventListener('click', () => {
    const id = wife ? button.dataset.object : ({ dolls:'dolls', book:'book', shoe:'shoe' }[button.dataset.clue]);
    markRoom(id);
  }));
  document.querySelectorAll('.question-card').forEach(button => button.addEventListener('click', () => setQuestion(button.textContent)));

  function update() {
    document.querySelectorAll('[data-room-task]').forEach(item => item.classList.toggle('found', state.room.includes(item.dataset.roomTask)));
    mission.querySelector('.room-task-count').textContent = `${Math.min(state.room.length, 3)} / 3`;
    const done = { primer: state.primer, room: state.room.length >= 3, question: Boolean(state.question), card: state.card };
    const order = ['primer','room','question','card'];
    const completed = order.filter(id => done[id]).length;
    bar.querySelector('.flow-percent').textContent = `${completed * 25}%`;
    order.forEach((id, index) => {
      const item = bar.querySelector(`[data-flow="${id}"]`);
      item.classList.toggle('done', done[id]);
      item.classList.toggle('current', !done[id] && order.slice(0,index).every(previous => done[previous]));
      item.querySelector('i').textContent = done[id] ? '✓' : String(index + 1);
    });
    result.classList.toggle('complete', state.card);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = [...text]; let line = '', lines = [];
    chars.forEach(char => { const test = line + char; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = char; } else line = test; });
    if (line) lines.push(line); lines.slice(0,maxLines).forEach((value,i) => ctx.fillText(value, x, y + i * lineHeight));
  }
  function makeCard() {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 760;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,1200,760); gradient.addColorStop(0, wife ? '#383631' : '#963c32'); gradient.addColorStop(1, '#4d2925'); ctx.fillStyle = gradient; ctx.fillRect(0,0,1200,760);
    ctx.fillStyle = '#ffffff12'; ctx.font = '360px serif'; ctx.fillText('她', 900, 760);
    ctx.fillStyle = '#f5e8da'; ctx.font = '700 24px sans-serif'; ctx.fillText('她的房间  ·  HER ROOMS', 80, 90);
    ctx.fillStyle = '#debfa8'; ctx.font = '28px serif'; ctx.fillText(`《${config.title}》· 我的读前问题`, 80, 205);
    ctx.fillStyle = '#fff6e9'; ctx.font = '52px serif'; wrapText(ctx, state.question, 80, 310, 1010, 78, 4);
    ctx.fillStyle = '#e8d5c799'; ctx.font = '22px sans-serif'; ctx.fillText('一个只能继续进入原著才能回答的问题', 80, 690);
    return canvas;
  }
  const finish = message => { state.card = true; save(); update(); result.querySelector('.card-toast').textContent = message; };
  result.querySelector('.save-card').addEventListener('click', () => {
    const link = document.createElement('a'); link.download = `${config.title}-我的阅读问题卡.png`; link.href = makeCard().toDataURL('image/png'); link.click(); finish('问题卡已经保存到你的设备');
  });
  result.querySelector('.share-card').addEventListener('click', async () => {
    const text = `我想带着这个问题阅读《${config.title}》：${state.question}\n${location.origin}${location.pathname}`;
    try { if (navigator.share) await navigator.share({ title: `${config.title} · 我的阅读问题`, text }); else await navigator.clipboard.writeText(text); finish(navigator.share ? '分享面板已经打开' : '问题和链接已经复制'); }
    catch { result.querySelector('.card-toast').textContent = '未能自动分享，你仍可以保存问题卡'; }
  });
  update();
})();
