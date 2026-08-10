(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const header = $('.site-header');
  const toast = $('.toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 24), { passive: true });

  const menuButton = $('.menu-toggle');
  const navigation = $('.primary-nav');
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  $$('.primary-nav a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));

  const searchToggle = $('.search-toggle');
  const searchPanel = $('.search-panel');
  searchToggle.addEventListener('click', () => {
    const open = searchPanel.hidden;
    searchPanel.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) $('#site-search').focus();
  });
  searchPanel.addEventListener('submit', event => {
    event.preventDefault();
    const query = $('#site-search').value.trim();
    showToast(query ? `正在书房中寻找“${query}”` : '请输入搜索内容');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !searchPanel.hidden) {
      searchPanel.hidden = true;
      searchToggle.setAttribute('aria-expanded', 'false');
    }
  });

  const sectionLinks = $$('.primary-nav a');
  const observedSections = sectionLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-25% 0px -60%', threshold: [0, .2, .5] });
  observedSections.forEach(section => sectionObserver.observe(section));

  $$('.archive-tabs button').forEach(tab => tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    $$('.archive-tabs button').forEach(button => button.setAttribute('aria-selected', String(button === tab)));
    $$('.archive-panel').forEach(panel => panel.hidden = panel.id !== `panel-${name}`);
  }));

  const roomFrame = $('.room-stage iframe');
  $('.fullscreen-room').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await $('.room-stage').requestFullscreen();
        $('.fullscreen-room').textContent = '退出全屏';
      } else {
        await document.exitFullscreen();
      }
    } catch {
      window.open(roomFrame.src, '_blank', 'noopener');
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) $('.fullscreen-room').textContent = '全屏探索';
  });

  const clueMessages = {
    dolls: '进入房间后，在门外石地的铁格栅附近寻找两个玩偶。',
    book: '《小妇人》放在左侧靠窗的学习角。',
    fairy: '《蓝色仙女》手稿藏在鞋匠工作台上。',
    shoe: '男式旅行鞋位于右侧工作灯下，悬停会出现高亮轮廓。'
  };
  $$('.clue-strip button').forEach(button => button.addEventListener('click', () => {
    showToast(clueMessages[button.dataset.clue]);
    $('.room-stage').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  $$('.theme-tags button').forEach(button => button.addEventListener('click', () => {
    $('#community').scrollIntoView({ behavior: 'smooth' });
    showToast(`已为你定位“${button.textContent}”相关讨论`);
  }));

  const postList = $('.post-list');
  let activeFilter = 'all';
  function applyDiscussionFilter(filter) {
    activeFilter = filter;
    $$('.discussion-filters button').forEach(button => button.classList.toggle('active', button.dataset.filter === filter));
    $$('.post-card', postList).forEach(card => card.hidden = filter !== 'all' && card.dataset.category !== filter);
  }
  $$('.discussion-filters button').forEach(button => button.addEventListener('click', () => applyDiscussionFilter(button.dataset.filter)));

  postList.addEventListener('click', event => {
    const voteButton = event.target.closest('.vote button');
    if (voteButton) {
      const count = voteButton.nextElementSibling;
      const voted = voteButton.classList.toggle('voted');
      count.textContent = String(Number(count.textContent) + (voted ? 1 : -1));
      voteButton.setAttribute('aria-label', voted ? '取消赞同' : '赞同');
      return;
    }
    const revealButton = event.target.closest('.spoiler-cover button');
    if (revealButton) {
      const card = revealButton.closest('.post-card');
      $('.spoiler-cover', card).hidden = true;
      $('.spoiler-content', card).hidden = false;
      showToast('已显示剧透内容');
      return;
    }
    if (event.target.closest('footer button')) showToast('社区详情页将在接入后端后开放');
  });

  $$('.recommend-grid article > button').forEach(button => button.addEventListener('click', () => {
    const added = button.dataset.added === 'true';
    button.dataset.added = String(!added);
    button.textContent = added ? '加入书架' : '已加入书架 ✓';
    showToast(added ? '已从个人书架移除' : '已加入个人书架');
  }));

  const dialog = $('.compose-dialog');
  const composeForm = $('.compose-form');
  $$('.open-compose').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  $$('.close-dialog').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  const categoryLabels = { safe: '无剧透', symbol: '象征与细节', puzzle: '解谜提示' };
  const storageKey = 'her-rooms-local-posts-v1';
  function readPosts() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  }
  function savePosts(posts) {
    try { localStorage.setItem(storageKey, JSON.stringify(posts.slice(0, 20))); } catch { /* private mode */ }
  }
  function createPostCard(post) {
    const article = document.createElement('article');
    article.className = `post-card${post.spoiler ? ' spoiler' : ''}`;
    article.dataset.category = post.category;

    const vote = document.createElement('div');
    vote.className = 'vote';
    const voteButton = document.createElement('button');
    voteButton.type = 'button';
    voteButton.setAttribute('aria-label', '赞同');
    voteButton.textContent = '△';
    const count = document.createElement('strong');
    count.textContent = '0';
    vote.append(voteButton, count);

    const content = document.createElement('div');
    const meta = document.createElement('p');
    meta.className = 'post-meta';
    const category = document.createElement('span');
    category.textContent = categoryLabels[post.category] || '讨论';
    meta.append(category, document.createTextNode(' · 雅读者 · 刚刚'));
    const title = document.createElement('h3');
    title.textContent = post.title;
    content.append(meta, title);

    if (post.spoiler) {
      const cover = document.createElement('div');
      cover.className = 'spoiler-cover';
      const warning = document.createElement('p');
      warning.textContent = '本帖包含剧情或谜题答案';
      const reveal = document.createElement('button');
      reveal.type = 'button';
      reveal.textContent = '显示内容';
      cover.append(warning, reveal);
      const body = document.createElement('p');
      body.className = 'spoiler-content';
      body.hidden = true;
      body.textContent = post.body;
      content.append(cover, body);
    } else {
      const body = document.createElement('p');
      body.textContent = post.body;
      content.append(body);
    }

    const footer = document.createElement('footer');
    const replies = document.createElement('button');
    replies.type = 'button';
    replies.textContent = '0 条回复';
    const bookmark = document.createElement('button');
    bookmark.type = 'button';
    bookmark.textContent = '收藏';
    footer.append(replies, bookmark);
    content.append(footer);
    article.append(vote, content);
    return article;
  }

  readPosts().reverse().forEach(post => postList.prepend(createPostCard(post)));

  composeForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!composeForm.reportValidity()) return;
    const data = new FormData(composeForm);
    const post = {
      title: String(data.get('title')).trim(),
      category: String(data.get('category')),
      spoiler: data.get('spoiler') === 'on',
      body: String(data.get('body')).trim(),
      createdAt: Date.now()
    };
    const posts = readPosts();
    posts.push(post);
    savePosts(posts);
    postList.prepend(createPostCard(post));
    composeForm.reset();
    dialog.close();
    applyDiscussionFilter('all');
    showToast('讨论已发布到本地街区');
  });
})();
