(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function baseController(root, names) {
    let stage = 0;
    const cards = $$('.puzzle-card', root);
    const dots = $$('.stage-dots i', root);
    const progress = $('.puzzle-progress-text', root);
    const showStage = next => {
      stage = Math.max(0, Math.min(next, cards.length - 1));
      cards.forEach((card, i) => card.classList.toggle('active', i === stage));
      dots.forEach((dot, i) => dot.classList.toggle('done', i < stage));
      progress.textContent = `阶段 ${stage + 1} / ${cards.length} · ${names[stage]}`;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $$('.stage-next', root).forEach(button => button.addEventListener('click', () => showStage(stage + 1)));
    return { get stage(){ return stage; }, showStage, dots, progress, cards };
  }

  function initGenius(root) {
    const ctl = baseController(root, ['双影', '物件时间', '鞋的归属', '标题镜像']);
    const feedback = i => $('.stage-feedback', ctl.cards[i]);
    const next = i => $('.stage-next', ctl.cards[i]);

    const zones = { tina: $('[data-zone="lenu"]', root), nu: $('[data-zone="lila"]', root) };
    const cellar = $('[data-zone="cellar"]', root);
    const home = { tina: zones.tina, nu: zones.nu };
    $$('.doll-piece', root).forEach(doll => doll.addEventListener('click', () => {
      const target = doll.parentElement === cellar ? home[doll.dataset.doll] : cellar;
      target.append(doll);
      const both = $$('.doll-piece', cellar).length === 2;
      if (both) {
        cellar.style.boxShadow = 'inset 0 0 45px rgba(210,161,105,.35), 0 0 25px rgba(139,68,56,.25)';
        feedback(0).textContent = '两个影子重叠了：勇敢在这里不是某个人的属性，而是互相模仿后共同完成的动作。';
        next(0).hidden = false; ctl.dots[0].classList.add('done');
      } else {
        cellar.style.boxShadow = '';
        feedback(0).textContent = $$('.doll-piece', cellar).length ? '只有一个影子。另一个人仍站在成人世界划出的边界外。' : '提示：玩偶不是钥匙，两个人共同越界才是。';
        next(0).hidden = true; ctl.dots[0].classList.remove('done');
      }
    }));

    function orderedButtons(cardIndex, selector, resultSelector, finalText) {
      const card = ctl.cards[cardIndex], buttons = $$(selector, card), result = $(resultSelector, card);
      let expected = 0;
      buttons.forEach(button => button.addEventListener('click', () => {
        const order = Number(button.dataset.order);
        if (order !== expected) {
          expected = 0; buttons.forEach(b => { b.disabled = false; b.classList.remove('selected'); });
          if (result.classList.contains('timeline-slots')) result.replaceChildren();
          feedback(cardIndex).textContent = '顺序断裂了。后来的物品已经带着前面事件留下的意义，请从起点重来。';
          return;
        }
        expected++;
        button.disabled = true; button.classList.add('selected');
        if (result.classList.contains('timeline-slots')) { const chip = document.createElement('button'); chip.type = 'button'; chip.textContent = button.textContent; chip.disabled = true; result.append(chip); }
        if (expected === buttons.length) {
          feedback(cardIndex).textContent = finalText; next(cardIndex).hidden = false; ctl.dots[cardIndex].classList.add('done');
        } else feedback(cardIndex).textContent = `顺序成立。还差 ${buttons.length - expected} 件物品。`;
      }));
    }
    orderedButtons(1, '.timeline-pool button', '.timeline-slots', '玩偶、阅读、写作、设计：天赋没有突然出现，它不断寻找能够存在的材料。');
    orderedButtons(2, '.ownership-path button', '.ownership-result', '鞋终于成为商品，却在每一步交易中离最初的创造者更远。价值增加了，署名反而消失了。');

    const interpretations = {
      lila: '你把称呼交给莉拉：莱农的书写在抵抗一种遗忘——没有被学校继续承认的天赋仍然真实存在。',
      lenu: '你把称呼交给莱农：莉拉看见莱农能够走出去，并把“天才”这个位置反射回她身上。',
      each: '你选择了彼此：她们既竞争又互相制造可能。“天才”不是固定身份，而是两个人之间持续发生的激发。'
    };
    $$('.mirror-choices button', root).forEach(button => button.addEventListener('click', () => {
      $$('.mirror-choices button', root).forEach(b => b.style.opacity = b === button ? '1' : '.38');
      const box = $('.interpretation', ctl.cards[3]); box.hidden = false; box.textContent = interpretations[button.dataset.answer];
      feedback(3).textContent = '谜题完成。你的选择没有封闭标题，而是留下了一条可以在讨论区继续争辩的解释。';
      ctl.dots.forEach(d => d.classList.add('done')); ctl.progress.textContent = '已完成 · 天才是关系，不是奖章';
      try { localStorage.setItem('her-rooms-genius-answer', button.dataset.answer); } catch {}
    }));

    $('.puzzle-reset', root).addEventListener('click', () => {
      Object.entries(home).forEach(([name, zone]) => zone.append($(`[data-doll="${name}"]`, root)));
      cellar.style.boxShadow = ''; $$('.stage-next', root).forEach(b => b.hidden = true); $$('.stage-feedback', root).forEach(p => p.textContent = '重新开始：观察动作之间的关系，而不是寻找孤立的密码。');
      $$('.timeline-slots', root).forEach(x => x.replaceChildren()); $$('button[data-order]', root).forEach(b => { b.disabled = false; b.classList.remove('selected'); });
      $('.interpretation', root).hidden = true; $$('.mirror-choices button', root).forEach(b => b.style.opacity = '1'); ctl.dots.forEach(d => d.classList.remove('done')); ctl.showStage(0);
    });
  }

  function initCourtyard(root) {
    const ctl = baseController(root, ['零和灯火', '凝视回路', '越墙箫声', '井口残句']);
    const feedback = i => $('.stage-feedback', ctl.cards[i]);
    const next = i => $('.stage-next', ctl.cards[i]);
    const lights = $$('.room-light', root); let active = [], attempts = 0;
    lights.forEach(light => light.addEventListener('click', () => {
      const id = Number(light.dataset.room); attempts++;
      if (active.includes(id)) active = active.filter(x => x !== id);
      else { active.push(id); if (active.length > 2) active.shift(); }
      lights.forEach((b, i) => b.classList.toggle('on', active.includes(i)));
      $$('.zero-sum-meter i', root).forEach((bar, i) => bar.classList.toggle('on', i < active.length));
      if (attempts >= 6) { feedback(0).textContent = '你没有失败：四间全亮本来就是不可能的。规则把稀缺制造成竞争，再让竞争看起来像女性的性格。'; next(0).hidden = false; ctl.dots[0].classList.add('done'); }
      else feedback(0).textContent = `已经尝试 ${attempts} 次。注意：亮起的永远不超过两间。`;
    }));

    let gazeExpected = 0; const gazeButtons = $$('.gaze-grid button', root);
    gazeButtons.forEach(button => button.addEventListener('click', () => {
      if (Number(button.dataset.order) !== gazeExpected) { gazeExpected = 0; gazeButtons.forEach(b => b.classList.remove('chosen')); feedback(1).textContent = '回路断开了。先问：一个人在宅院中最先得到的是什么？'; return; }
      button.classList.add('chosen'); gazeExpected++;
      if (gazeExpected === gazeButtons.length) { feedback(1).textContent = '身份决定资源，资源制造竞争，竞争提供惩罚的理由，惩罚最后生产沉默。回路闭合。'; next(1).hidden = false; ctl.dots[1].classList.add('done'); }
      else feedback(1).textContent = `回路正在闭合，还差 ${gazeButtons.length - gazeExpected} 个环节。`;
    }));

    const melody = [0,2,1,3], noteButtons = $$('.sound-board button', root); let heard = false, playing = false, input = [];
    $('.sound-start', root).addEventListener('click', () => {
      if (playing) return; playing = true; heard = true; input = []; feedback(2).textContent = '听……';
      melody.forEach((note, i) => setTimeout(() => { noteButtons[note].classList.add('flash'); setTimeout(() => noteButtons[note].classList.remove('flash'), 380); if (i === melody.length - 1) setTimeout(() => { playing = false; feedback(2).textContent = '现在让声音沿同一条路再次越过院墙。'; }, 450); }, i * 650));
    });
    noteButtons.forEach(button => button.addEventListener('click', () => {
      if (!heard || playing) { feedback(2).textContent = '先完整听一遍。猜测仍然被困在宅院里，记忆才会越墙。'; return; }
      const note = Number(button.dataset.note); button.classList.add('flash'); setTimeout(() => button.classList.remove('flash'), 180);
      if (note !== melody[input.length]) { input = []; feedback(2).textContent = '声音中断了。可以再听一遍，也可以从第一音重新尝试。'; return; }
      input.push(note);
      if (input.length === melody.length) { feedback(2).textContent = '箫声完整地越过了四扇窗：院墙能够限制身体，却不能证明院墙之外不存在生活。'; next(2).hidden = false; ctl.dots[2].classList.add('done'); }
    }));

    let wordExpected = 0; const wordButtons = $$('.word-path button', root), line = $('.word-line', root);
    wordButtons.forEach(button => button.addEventListener('click', () => {
      if (Number(button.dataset.order) !== wordExpected) { wordExpected = 0; line.textContent = ''; wordButtons.forEach(b => { b.disabled = false; b.style.opacity = '1'; }); feedback(3).textContent = '残句落回井中。先从宅院如何安排空间开始。'; return; }
      wordExpected++; button.disabled = true; button.style.opacity = '.35'; line.textContent += (line.textContent ? '，' : '') + button.textContent;
      if (wordExpected === wordButtons.length) { $('.well-reveal', root).hidden = false; feedback(3).textContent = '废井已经打开。你找到的不是凶手姓名，而是悲剧能够被重复的机制。'; ctl.dots.forEach(d => d.classList.add('done')); ctl.progress.textContent = '已完成 · 没有人能在零和规则中获胜'; }
    }));

    $('.puzzle-reset', root).addEventListener('click', () => {
      active = []; attempts = 0; gazeExpected = 0; heard = false; playing = false; input = []; wordExpected = 0;
      lights.forEach(b => b.classList.remove('on')); $$('.zero-sum-meter i', root).forEach(b => b.classList.remove('on')); gazeButtons.forEach(b => b.classList.remove('chosen')); noteButtons.forEach(b => b.classList.remove('flash')); wordButtons.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
      line.textContent = ''; $('.well-reveal', root).hidden = true; $$('.stage-next', root).forEach(b => b.hidden = true); $$('.stage-feedback', root).forEach(p => p.textContent = '谜题已重置。先观察规则怎样改变你的动作。'); ctl.dots.forEach(d => d.classList.remove('done')); ctl.showStage(0);
    });
  }

  $$('[data-puzzle="genius"]').forEach(initGenius);
  $$('[data-puzzle="courtyard"]').forEach(initCourtyard);
})();
