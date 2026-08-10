(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const toast = $('.toast');
  let timer;
  const showToast = text => { toast.textContent = text; toast.classList.add('show'); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 2400); };

  const women = {
    songlian: { no:'04', role:'颂莲 · 新进入者', title:'她带着新式教育进入旧式婚姻，却很快学会用旧规则保护自己。', body:'颂莲既是受害者，也是规则的参与者。她的变化让小说最尖锐的问题浮现：个人是否能够在不伤害他人的情况下，从一个以伤害为基础的系统中获益？', mark:'颂' },
    yuru: { no:'01', role:'毓如 · 正房', title:'她离权力中心最近，却同样无法决定权力如何分配。', body:'正房的名分提供了位置，却没有带来自由。她看起来最稳定，也最能说明宅院的秩序并不以任何一个女人的幸福为目标。', mark:'毓' },
    zhuoyun: { no:'02', role:'卓云 · 第二位', title:'她最熟悉规则，也最擅长把亲近变成武器。', body:'卓云的算计不是脱离环境的“天性”。她展示了一个人如何在长期的不安全中，把信息、照料与姐妹关系都转换成竞争资源。', mark:'卓' },
    meishan: { no:'03', role:'梅珊 · 第三位', title:'她的声音最响亮，因此也最容易被秩序标记为危险。', body:'梅珊的表演、爱情与反抗保存着另一种生活的可能。正因为如此，她的存在不断提醒宅院：规则并不是天然的。', mark:'梅' }
  };
  $$('.women-tabs button').forEach(button => button.addEventListener('click', () => {
    $$('.women-tabs button').forEach(b => b.classList.toggle('active', b === button));
    const item = women[button.dataset.woman];
    $('.portrait-no').textContent = item.no; $('#woman-role').textContent = item.role; $('#woman-title').textContent = item.title; $('#woman-body').textContent = item.body; $('#woman-mark').textContent = item.mark;
  }));

  const room = $('.room-shell');
  $('#fullscreen').addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await room.requestFullscreen(); else await document.exitFullscreen(); }
    catch { window.open($('iframe', room).src, '_blank', 'noopener'); }
  });

  const tips = { wisteria:'进入后院，紫藤架位于废井上方。它的花期与井的阴影同时出现。', well:'废井在庭院最深处；需要先收集其他三件物品的证词才能打开井盖。', flute:'沿西侧回廊寻找箫。声音能够越过院墙，人却不能。', mirror:'颂莲房内的梳妆镜记录了她从“学生”到“第四位妻妾”的身份变化。' };
  $$('.object-index button').forEach(button => button.addEventListener('click', () => { showToast(tips[button.dataset.object]); $('.room-shell').scrollIntoView({behavior:'smooth',block:'center'}); }));

  $('#save-thought').addEventListener('click', () => {
    const field = $('.discussion textarea');
    if (!field.value.trim()) return showToast('先写下一句话，再保存到阅读档案');
    try { localStorage.setItem('her-rooms-wife-thought', field.value.trim()); } catch {}
    showToast('已保存到这台设备的阅读档案');
  });
  try { $('.discussion textarea').value = localStorage.getItem('her-rooms-wife-thought') || ''; } catch {}

  window.addEventListener('message', event => {
    if (event.data?.type === 'wife-room-clue') showToast(`已收集：${event.data.label}（${event.data.count}/4）`);
  });
})();
