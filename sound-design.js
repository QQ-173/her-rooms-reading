(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const instrument = $('.reading-instrument');
  if (!instrument) return;
  const world = instrument.dataset.soundWorld;
  let context, master, enabled = false, ambientTimer, captionTimer, sliderToneAt = 0;

  const dock = document.createElement('div');
  dock.className = 'sound-dock';
  dock.innerHTML = '<button class="sound-toggle" type="button" aria-pressed="false"><span class="sound-icon">♪</span><span class="sound-label">开启阅读声场</span></button><label>音量 <input class="sound-volume" type="range" min="0" max="100" value="45" aria-label="阅读声场音量"></label>';
  const caption = document.createElement('div'); caption.className = 'sound-caption'; caption.setAttribute('role','status'); caption.setAttribute('aria-live','polite');
  document.body.append(dock, caption);

  function showCaption(text) { caption.textContent = text; caption.classList.add('show'); clearTimeout(captionTimer); captionTimer = setTimeout(() => caption.classList.remove('show'), 2600); }
  function ensureAudio() {
    if (context) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) { showCaption('当前浏览器不支持阅读声场，但页面交互仍可使用。'); return false; }
    context = new AudioCtx(); master = context.createGain(); master.gain.value = .45; master.connect(context.destination); return true;
  }
  function playTone(frequency, duration = .35, options = {}) {
    if (!enabled || !ensureAudio()) return;
    const start = context.currentTime + (options.delay || 0), osc = context.createOscillator(), gain = context.createGain();
    osc.type = options.type || 'sine'; osc.frequency.setValueAtTime(frequency, start);
    if (options.to) osc.frequency.exponentialRampToValueAtTime(options.to, start + duration);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(options.gain || .055, start + .025); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + duration + .03);
  }
  function noise(duration = .22, gainValue = .03, filterFreq = 1200) {
    if (!enabled || !ensureAudio()) return;
    const length = Math.max(1, Math.floor(context.sampleRate * duration)), buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(); source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = filterFreq; gain.gain.value = gainValue; source.connect(filter); filter.connect(gain); gain.connect(master); source.start();
  }
  function motif(freq, shape = 'friend') {
    if (shape === 'friend') [1, 1.25, 1.5].forEach((ratio, i) => playTone(freq * ratio, .42, { delay: i * .12, gain: .045, type: i === 1 ? 'triangle' : 'sine' }));
    else [1, .84, 1.12].forEach((ratio, i) => playTone(freq * ratio, .55, { delay: i * .18, gain: .038, type: 'triangle' }));
  }
  function ambientPulse() {
    if (!enabled) return;
    if (world === 'genius') { playTone(146.83, 1.8, { gain: .012, type: 'sine' }); if (Math.random() > .5) noise(.07,.017,1800); }
    else { playTone(110, 2.2, { gain: .012, type: 'sine' }); if (Math.random() > .45) noise(.8,.008,500); }
  }
  function setEnabled(value, message) {
    enabled = value && ensureAudio();
    const toggle = $('.sound-toggle', dock); toggle.setAttribute('aria-pressed', String(enabled)); $('.sound-label', dock).textContent = enabled ? '关闭阅读声场' : '开启阅读声场'; $('.sound-icon', dock).textContent = enabled ? '◉' : '♪';
    clearInterval(ambientTimer);
    if (enabled) { context.resume(); ambientPulse(); ambientTimer = setInterval(ambientPulse, 3900); }
    showCaption(message || (enabled ? (world === 'genius' ? '阅读声场已开启：远处街声与纸页音色。' : '阅读声场已开启：院墙风声与低频房间音色。') : '阅读声场已关闭。'));
  }
  $('.sound-toggle', dock).addEventListener('click', () => setEnabled(!enabled));
  $('.sound-volume', dock).addEventListener('input', event => { if (ensureAudio()) master.gain.setTargetAtTime(Number(event.target.value) / 100, context.currentTime, .04); });

  const activeVoices = new Set();
  $$('.voice-node', instrument).forEach(node => node.addEventListener('click', () => {
    if (!enabled) setEnabled(true, '声音已因你的操作开启，可随时从右下角关闭。');
    const voice = node.dataset.voice, on = node.classList.toggle('active'); on ? activeVoices.add(voice) : activeVoices.delete(voice);
    node.setAttribute('aria-pressed', String(on)); node.classList.add('pulse-ring'); setTimeout(() => node.classList.remove('pulse-ring'), 520);
    if (on) motif(Number(node.dataset.frequency), world === 'genius' ? 'friend' : 'courtyard'); else playTone(Number(node.dataset.frequency) * .75, .3, { gain: .025, to: Number(node.dataset.frequency) * .5 });
    const status = $('.instrument-status', instrument);
    if (world === 'genius') showCaption(activeVoices.size >= 2 ? '两个声部开始互相改变：单独的旋律变成关系。' : on ? `${$('b',node).textContent}的声部已加入。` : `${$('b',node).textContent}的声部已移除。`);
    else showCaption(activeVoices.size >= 3 ? '声场变得拥挤：每个房间都更难被单独听清。' : on ? `${$('b',node).textContent}的房间声部已加入。` : `${$('b',node).textContent}的房间声部已移除。`);
    if (status) status.dataset.voices = String(activeVoices.size);
  }));

  const geniusReadings = ['她们彼此衡量，关系首先表现为害怕落后的竞争。','竞争与模仿同时存在：她们借对方确认自己能够做到什么。','她们把彼此当作尺度：既害怕落后，也因此看见更远的可能。','共同想象逐渐超过输赢，阅读、写作和创造开始成为两个人之间的第三空间。','“天才”不再像奖章属于一人，而像一股在两个人之间来回流动的力量。'];
  const courtyardReadings = ['门窗仍像生活空间，但每一次开合都可能把日常变成证据。','被看见和被监听开始重叠，亲近也可能成为收集信息的方式。','每个人都同时是观察者与被观察者，沉默成为自我保护。','当凝视过强，房间不再提供隐私，只提供更精确的位置。','宅院最有效的墙不是砖墙，而是让每个人提前想象别人正在看自己。'];
  const slider = $('.relation-slider', instrument), reading = $('.relation-reading', instrument);
  slider.addEventListener('input', () => {
    const i = Math.min(4, Math.floor(Number(slider.value) / 21)); reading.textContent = (world === 'genius' ? geniusReadings : courtyardReadings)[i];
    const now = performance.now(); if (enabled && now - sliderToneAt > 130) { sliderToneAt = now; const base = world === 'genius' ? 210 : 130; playTone(base + Number(slider.value) * 1.7, .16, { gain: .018, type:'triangle' }); }
  });

  const fragmentTexts = world === 'genius' ? {
    dolls:'两个不同高度的回声落入同一片黑暗。重要的不是物件失而复得，而是她们第一次把恐惧变成共同动作。',
    pages:'纸页与铅笔形成细小、持续的节奏。她们共同相信写作能够带来金钱，也能够让人生出现另一种版本。',
    shoe:'敲击越来越像生产线，提示创造进入交易以后，设计、劳动、资本与所有权不再属于同一个人。'
  } : {
    wind:'风沿回廊移动，不承认房间之间的等级。它让封闭空间短暂出现一条没有主人的路线。',
    flute:'箫声能够越过院墙，也越过陈府安排的身份。它代表另一种生活仍可被想象，却未必能被抵达。',
    well:'低频空响没有提供答案，只把被宣布为“失足”和“疯癫”的女性历史重新送回听者面前。'
  };
  const opened = new Set();
  $$('.memory-fragment', instrument).forEach(fragment => fragment.addEventListener('click', () => {
    if (!enabled) setEnabled(true, '声音已因你的操作开启，可随时关闭。');
    const id = fragment.dataset.fragment; opened.add(id); fragment.classList.add('open'); $('.memory-reveal', instrument).textContent = fragmentTexts[id];
    if (world === 'genius') { if (id === 'dolls') { playTone(210,.7,{gain:.04}); playTone(286,.7,{gain:.035,delay:.08}); } else if (id === 'pages') noise(.55,.028,2400); else [0,.12,.24].forEach(delay=>playTone(115,.12,{delay,gain:.055,type:'square'})); }
    else { if (id === 'wind') noise(1.2,.022,650); else if (id === 'flute') [293.66,369.99,440].forEach((f,i)=>playTone(f,.65,{delay:i*.22,gain:.035,type:'sine'})); else { playTone(82.41,1.5,{gain:.05,to:55}); setTimeout(()=>noise(.7,.014,260),180); } }
    $('.instrument-status', instrument).textContent = `已打开 ${opened.size} / 3 段${world === 'genius' ? '记忆' : '声场'}${opened.size === 3 ? ' · 完整聆听已形成' : ''}`;
  }));

  document.addEventListener('click', event => {
    if (!enabled || event.target.closest('.sound-dock,.voice-node,.memory-fragment')) return;
    if (event.target.closest('button,a')) playTone(world === 'genius' ? 440 : 330, .08, { gain:.012, type:'triangle' });
  });
  document.addEventListener('visibilitychange', () => { if (context) document.hidden ? context.suspend() : enabled && context.resume(); });
})();
