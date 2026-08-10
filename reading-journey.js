(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const journey = $('.reading-journey');
  if (!journey) return;

  const book = journey.dataset.book;
  const prefix = `her-rooms-journey-${book}`;
  const toast = document.createElement('div');
  toast.className = 'journey-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  let toastTimer;

  const notify = message => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  };
  const read = (key, fallback = null) => {
    try {
      const value = localStorage.getItem(`${prefix}-${key}`);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => {
    try { localStorage.setItem(`${prefix}-${key}`, JSON.stringify(value)); } catch {}
  };

  const plan = $('.reading-plan', journey);
  const finishedNote = $('.finished-note', journey);
  function setState(state, announce = true) {
    $$('[data-state]', journey).forEach(button => {
      const active = button.dataset.state === state;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.body.dataset.readingState = state;
    plan.hidden = state === 'unread';
    finishedNote.hidden = state !== 'finished';
    write('state', state);
    if (announce) {
      const messages = {
        unread: '已切换为无剧透的读前状态',
        reading: '阅读计划已打开，进度会保存在这台设备',
        finished: '已打开读后回看提示'
      };
      notify(messages[state]);
    }
  }
  $$('[data-state]', journey).forEach(button => button.addEventListener('click', () => setState(button.dataset.state)));

  const lock = $('.bridge-lock', journey);
  const content = $('.bridge-content', journey);
  function unlockBridge(message, announce = true) {
    lock.hidden = true;
    content.hidden = false;
    write('game-complete', true);
    if (announce) notify(message);
  }
  if (read('game-complete', false)) unlockBridge('', false);

  const matchBoard = $('.match-board', journey);
  if (matchBoard) {
    let first = null;
    let matched = 0;
    $$('.match-card', matchBoard).forEach(card => card.addEventListener('click', () => {
      if (card.classList.contains('matched') || card === first) return;
      card.classList.add('selected');
      if (!first) {
        first = card;
        $('.game-feedback', journey).textContent = '再选择一张与它在意义上相连的卡片。';
        return;
      }
      if (first.dataset.pair === card.dataset.pair) {
        first.classList.remove('selected');
        card.classList.remove('selected');
        first.classList.add('matched');
        card.classList.add('matched');
        first.disabled = true;
        card.disabled = true;
        matched += 1;
        first = null;
        $('.game-feedback', journey).textContent = matched === 3
          ? '三组关系成立。现在选择一个必须进入原著才能回答的问题。'
          : `已经连接 ${matched} / 3 组。`;
        if (matched === 3) unlockBridge('小游戏完成：阅读问题已经打开');
      } else {
        const previous = first;
        previous.classList.add('wrong');
        card.classList.add('wrong');
        $('.game-feedback', journey).textContent = '这两张卡可以共存，但还没有形成网站设计的那条问题线。';
        first = null;
        setTimeout(() => {
          previous.classList.remove('selected', 'wrong');
          card.classList.remove('selected', 'wrong');
        }, 420);
      }
    }));
  }

  const allocation = $('.room-allocation', journey);
  if (allocation) {
    const chosen = new Set();
    let opened = read('game-complete', false);
    $$('button', allocation).forEach(button => button.addEventListener('click', () => {
      if (chosen.has(button)) {
        chosen.delete(button);
        button.classList.remove('chosen');
      } else if (chosen.size < 3) {
        chosen.add(button);
        button.classList.add('chosen');
      } else {
        notify('只有三枚筹码；先撤回一枚，才能改变分配');
        return;
      }
      $$('.token-count i', journey).forEach((token, index) => token.classList.toggle('used', index < chosen.size));
      $$('button', allocation).forEach(room => room.classList.remove('excluded'));
      const left = 3 - chosen.size;
      if (chosen.size === 3) {
        const excluded = $$('button', allocation).find(room => !chosen.has(room));
        excluded.classList.add('excluded');
        $('.game-feedback', journey).textContent = `${excluded.textContent}被留在筹码之外。问题不在于你选错，而在于规则要求必须排除一个人。`;
        if (!opened) {
          opened = true;
          unlockBridge('分配完成：带着被排除的人进入阅读');
        }
      } else {
        $('.game-feedback', journey).textContent = `剩余 ${left} 枚。你可以重新点击撤回。`;
      }
    }));
  }

  const selectedBox = $('.selected-question', journey);
  $$('.question-card', journey).forEach(button => button.addEventListener('click', () => {
    $$('.question-card', journey).forEach(card => card.classList.toggle('selected', card === button));
    selectedBox.textContent = `我的读前问题：${button.textContent}`;
    write('question', button.textContent);
    notify('问题已保存为读前书签');
  }));
  const savedQuestion = read('question', '');
  if (savedQuestion) {
    const savedButton = $$('.question-card', journey).find(button => button.textContent === savedQuestion);
    if (savedButton) {
      savedButton.classList.add('selected');
      selectedBox.textContent = `我的读前问题：${savedQuestion}`;
    }
  }

  $('.start-plan', journey).addEventListener('click', () => {
    setState('reading');
    plan.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  const checks = $$('.plan-day input', journey);
  const savedDays = read('days', []);
  checks.forEach((check, index) => {
    check.checked = Boolean(savedDays[index]);
    check.addEventListener('change', updateProgress);
  });
  function updateProgress() {
    const values = checks.map(check => check.checked);
    const count = values.filter(Boolean).length;
    $('.plan-progress i', journey).style.width = `${count / checks.length * 100}%`;
    $('.plan-summary', journey).textContent = `完成 ${count} / ${checks.length} 天${count === checks.length ? ' · 可以切换到“已经读完”重新回答谜题' : ''}`;
    write('days', values);
    if (count === checks.length) notify('七天计划完成：回到谜题，比较读前与读后的答案');
  }

  const switcher = $('.book-switcher');
  if (switcher) {
    const updateSwitcher = () => switcher.classList.toggle('journey-collapsed', window.scrollY > 520);
    window.addEventListener('scroll', updateSwitcher, { passive: true });
    updateSwitcher();
  }

  updateProgress();
  setState(read('state', 'unread'), false);
})();
