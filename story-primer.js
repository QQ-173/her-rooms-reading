(() => {
  document.querySelectorAll('.story-primer').forEach(primer => {
    const panels = [...primer.querySelectorAll('[data-primer-panel]')];
    const dots = [...primer.querySelectorAll('[data-primer-dot]')];
    let current = 0;

    function show(index, shouldScroll = true) {
      current = Math.max(0, Math.min(index, panels.length - 1));
      panels.forEach((panel, i) => {
        panel.classList.toggle('active', i === current);
        panel.hidden = i !== current;
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
        dot.setAttribute('aria-current', i === current ? 'step' : 'false');
      });
      if (current === panels.length - 1) window.dispatchEvent(new CustomEvent('herrooms:primer-complete'));
      if (shouldScroll) primer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
    primer.querySelectorAll('[data-primer-next]').forEach(button => button.addEventListener('click', () => show(current + 1)));
    primer.querySelectorAll('[data-primer-back]').forEach(button => button.addEventListener('click', () => show(current - 1)));

    const response = primer.querySelector('.choice-response');
    primer.querySelectorAll('.primer-choice').forEach(button => button.addEventListener('click', () => {
      primer.querySelectorAll('.primer-choice').forEach(choice => choice.classList.toggle('selected', choice === button));
      response.textContent = button.dataset.response;
    }));

    const seen = new Set();
    const readout = primer.querySelector('.clue-readout');
    const count = primer.querySelector('.clue-count');
    primer.querySelectorAll('.primer-clue').forEach(button => button.addEventListener('click', () => {
      seen.add(button);
      button.classList.add('seen');
      button.setAttribute('aria-pressed', 'true');
      readout.innerHTML = `<b>${button.dataset.title}</b><br>${button.dataset.detail}`;
      count.textContent = `已触碰 ${seen.size} / 4 条背景线索 · 不必全部打开也可以继续`;
    }));

    const archiveToggle = primer.querySelector('.archive-toggle');
    if (archiveToggle) archiveToggle.addEventListener('click', () => {
      const archive = document.querySelector('#book');
      archive.classList.toggle('primer-expanded');
      archiveToggle.textContent = archive.classList.contains('primer-expanded') ? '收起完整书籍档案' : '想了解更多？展开书籍档案';
      if (archive.classList.contains('primer-expanded')) archive.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    show(0, false);
  });
})();
