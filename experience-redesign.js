(() => {
  const params = new URLSearchParams(location.search);
  const isGeniusPage = document.querySelector('main.book-experience');
  const isWifePage = document.body.classList.contains('wife-page');
  const reader = params.get('reader') === 'finished' ? 'finished' : 'unread';

  if (isGeniusPage && !params.has('book')) {
    document.body.classList.add('home-mode');
    return;
  }
  if (!isGeniusPage && !isWifePage) return;

  document.body.classList.add('reader-mode');
  document.body.dataset.reader = reader;
  const desiredState = reader === 'finished' ? 'finished' : 'unread';
  const stateButton = document.querySelector(`[data-state="${desiredState}"]`);
  if (stateButton && !stateButton.classList.contains('active')) stateButton.click();
  document.querySelectorAll('[data-reader-link]').forEach(link => {
    link.classList.toggle('active', link.dataset.readerLink === reader);
  });

  const journey = document.querySelector('.reading-journey');
  const deepPuzzle = document.querySelector('.deep-puzzle');
  if (reader === 'unread' && journey && deepPuzzle) {
    deepPuzzle.before(journey);
    const gate = document.createElement('section');
    gate.className = 'deep-challenge-gate';
    const finishedUrl = isWifePage
      ? 'wife-concubines.html?reader=finished#courtyard-puzzle'
      : 'index.html?book=genius&reader=finished#deep-puzzle';
    gate.innerHTML = `<div><span><h2>深度谜题留到读后</h2><p>现在不需要理解人物全部经历。读完原著后再回来，谜题会从“猜答案”变成“重新解释故事”。</p></span><a href="${finishedUrl}">我已经读过，打开挑战</a></div>`;
    journey.after(gate);
  }

  const nav = document.querySelector('.primary-nav, .topbar nav');
  if (nav) {
    const roomId = isWifePage ? 'courtyard' : 'room';
    const archiveId = isWifePage ? 'archive' : 'reading';
    nav.innerHTML = `<a href="#book">01 故事背景</a><a href="#${roomId}">02 探索空间</a><a href="#reading-journey">03 带着问题阅读</a><a href="#${archiveId}">延伸内容</a>`;
  }
})();
