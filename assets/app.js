const palette = ['#FF6B6B','#FF8A65','#FFD93D','#FFC75F','#6BCB77','#2F9E44','#00C9A7','#4D96FF','#845EC2','#D65DB1','#A0CED9','#333333'];

let state = {
  groups: [],
  view: 'home',
  auth: !!window.APP_AUTH
};

const api = {
  async request(action, method = 'GET', body = null) {
    const opts = { method };
    if (method === 'POST') {
      opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
      const params = new URLSearchParams(body || {});
      params.append('action', action);
      opts.body = params.toString();
    }
    const url = method === 'GET'
      ? 'api.php?action=' + encodeURIComponent(action)
      : 'api.php';
    const res = await fetch(url, opts);
    let json;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok || !json || json.status !== 'ok') {
      const msg = (json && json.message) ? json.message : 'Ошибка запроса';
      throw new Error(msg);
    }
    return json;
  },
  list() { return this.request('list'); },
  login(data) { return this.request('login', 'POST', data); },
  logout() { return this.request('logout', 'GET'); },
  createGroup(data) { return this.request('create_group', 'POST', data); },
  updateGroup(data) { return this.request('update_group', 'POST', data); },
  deleteGroup(id) { return this.request('delete_group', 'POST', { id }); },
  createLink(data) { return this.request('create_link', 'POST', data); },
  updateLink(data) { return this.request('update_link', 'POST', data); },
  deleteLink(id) { return this.request('delete_link', 'POST', { id }); },
  reorderLinks(group_id, order) {
    return this.request('reorder_links', 'POST', { group_id, order: order.join(',') });
  },
  reorderGroups(order) {
    return this.request('reorder_groups', 'POST', { order: order.join(',') });
  }
};

function el(id){ return document.getElementById(id); }

function showToast(msg) {
  const t = el('toast') || el('auth-error');
  if (!t) { alert(msg); return; }
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(()=> t.classList.add('hidden'), 3000);
}

async function loadData() {
  try {
    const res = await api.list();
    state.groups = res.data.groups || [];
    if (window.APP_AUTH) {
      renderAll();
    }
  } catch (err) {
    showToast(err.message);
  }
}

function renderAll() {
  renderSidebarGroups();
  renderMobileMenu();
  renderGroupSelect();
  renderMain();

}

function renderSidebarGroups() {
  const list = el('group-list');
  if (!list) return;
  list.innerHTML = '';
  state.groups.forEach(g => {
    const li = document.createElement('li');
    li.className = 'group-row';
    li.dataset.id = g.id;
    li.innerHTML = `
      <div class="group-left">
        <span class="group-title">${escapeHtml(g.name)}</span>
        <span class="group-count">${(g.links || []).length}</span>
      </div>
      <div class="group-actions">
        <button class="icon-small" data-action="add-link-group" data-id="${g.id}" title="Добавить ссылку">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m5 11h-4v4h-2v-4H7v-2h4V7h2v4h4z"/>
          </svg>
        </button>
        <button class="icon-small" data-action="edit-group" data-id="${g.id}" title="Редактировать группу">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M7 17v-4l10-10l4 4l-10 10h-4"/>
            <path d="M14 6l4 4"/>
          </svg>
        </button>
        <button class="icon-small" data-action="del-group" data-id="${g.id}" title="Удалить группу">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4zm2 2h6V4H9zM6.074 8l.857 12H17.07l.857-12zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"/>
          </svg>
        </button>
      </div>
    `;
    li.addEventListener('click', (e)=>{
      if (e.target.closest('.icon-small')) return;
      state.view = 'group:' + g.id;
      const vm = el('view-mode');
      if (vm) vm.textContent = g.name;
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      renderMain();
    });
    list.appendChild(li);
  });

  new Sortable(list, {
    animation: 150,
    handle: '.group-row',
    onEnd: async () => {
      const ids = Array.from(list.querySelectorAll('.group-row')).map(li => li.dataset.id);
      try {
        await api.reorderGroups(ids);
        await loadData();
      } catch (err) {
        showToast(err.message);
      }
    }
  });
}

function renderMobileMenu() {
  const box = document.getElementById('mobile-menu');
  if (!box) return;

  const groupsHtml = state.groups.map(g => `
    <div class="mobile-group-item" data-id="${g.id}">
      <span>${escapeHtml(g.name)}</span>
      <span style="color:var(--muted);font-size:12px">${(g.links || []).length}</span>
    </div>
  `).join('');

  box.innerHTML = `
    <div class="mobile-group-item" data-home="1">
      <strong>Главная</strong>
    </div>

    <div class="mobile-section-title">Группы</div>
    <div class="mobile-group-list">
      ${groupsHtml}
    </div>
  `;

  const homeBtn = box.querySelector('[data-home]');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      state.view = 'home';
      const vm = document.getElementById('view-mode');
      if (vm) vm.textContent = 'Главная';
      renderMain();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  box.querySelectorAll('.mobile-group-item[data-id]').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      state.view = 'group:' + id;
      const g = state.groups.find(gr => gr.id === id);
      const vm = document.getElementById('view-mode');
      if (vm && g) vm.textContent = g.name;
      renderMain();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}



function renderGroupSelect() {
  const select = el('link-group-select');
  if (!select) return;
  select.innerHTML = '';
  state.groups.forEach(g=>{
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    select.appendChild(opt);
  });
}

function renderMain() {
  const container = el('groups-container');
  if (!container) return;
  container.innerHTML = '';
  let groupsToShow = state.groups;
  if (state.view.startsWith('group:')) {
    const id = state.view.split(':')[1];
    groupsToShow = state.groups.filter(g => g.id === id);
  } else {
    const vm = el('view-mode');
    if (vm) vm.textContent = 'Главная';
  }

  groupsToShow.forEach(g => {
    const block = document.createElement('div');
    block.className = 'group-block';
    block.dataset.id = g.id;
    block.innerHTML = `
      <div class="group-block-header">
        <div>
          <div class="group-block-title">${escapeHtml(g.name)}</div>
          <div class="group-block-sub">${(g.links || []).length}</div>
        </div>
        <div class="group-block-toggle" data-toggle>▾</div>
      </div>
      <div class="group-block-body" data-body></div>
    `;
    const body = block.querySelector('[data-body]');
    (g.links || []).forEach(link => {
      body.appendChild(createLinkCard(g, link));
    });
    block.querySelector('[data-toggle]').addEventListener('click', (e)=>{
      e.stopPropagation();
      const hidden = body.style.display === 'none';
      body.style.display = hidden ? 'flex' : 'none';
      block.querySelector('[data-toggle]').textContent = hidden ? '▾' : '▸';
    });
    container.appendChild(block);

    new Sortable(body, {
      group: 'links',
      animation: 150,
      onEnd: async (evt) => {
        const item = evt.item;
        const linkId = item.dataset.id;
        const fromGroupId = evt.from.closest('.group-block').dataset.id;
        const toGroupId = evt.to.closest('.group-block').dataset.id;
        const toIds = Array.from(evt.to.querySelectorAll('.card')).map(c => c.dataset.id);
        const fromIds = Array.from(evt.from.querySelectorAll('.card')).map(c => c.dataset.id);

        try {
          if (fromGroupId !== toGroupId) {
            const found = findLinkById(linkId);
            if (found) {
              const { link } = found;
              await api.updateLink({
                id: link.id,
                title: link.title,
                url: link.url,
                tags: (link.tags || []).join(','),
                group_id: toGroupId,
                color: link.color || palette[0]
              });
            }
          }
          await api.reorderLinks(toGroupId, toIds);
          if (fromGroupId !== toGroupId) {
            await api.reorderLinks(fromGroupId, fromIds);
          }
          await loadData();
        } catch (err) {
          showToast(err.message);
        }
      }
    });
  });

  applySearchFilter();
}

function createLinkCard(group, link) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = link.id;
  card.innerHTML = `
    <div class="meta">
      <div class="favicon" style="background:${link.color || '#e8f0ff'}">
        ${escapeHtml((link.title || 'L').charAt(0).toUpperCase())}
      </div>
      <div class="meta-main">
        <div class="title">${escapeHtml(link.title)}</div>
        <div class="url">${escapeHtml(link.url)}</div>
        <div class="dates" style="display:none">
          Создано: ${escapeHtml(link.created_at || '')}
          &nbsp;•&nbsp;
          Изменено: ${escapeHtml(link.updated_at || '')}
        </div>
      </div>
    </div>
    <div class="actions">
      <button class="icon-small" data-action="edit-link" data-id="${link.id}" title="Изменить">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"/>
        <path d="M7 17v-4l10-10l4 4l-10 10h-4"/>
        <path d="M14 6l4 4"/>
      </svg>
      </button>
      <button class="icon-small" data-action="del-link" data-id="${link.id}" title="Удалить">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4zm2 2h6V4H9zM6.074 8l.857 12H17.07l.857-12zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"/>
      </svg>
      </button>
    </div>
  `;
  card.addEventListener('click', (e)=>{
    if (e.target.closest('.icon-small')) return;
    if (link.url) {
      const url = link.url.startsWith('http') ? link.url : 'https://' + link.url;
      window.open(url, '_blank');
    }
  });
  return card;
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

function applySearchFilter() {
  const input = el('search');
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  document.querySelectorAll('.card').forEach(card=>{
    const text = card.textContent.toLowerCase();
    card.style.opacity = q && !text.includes(q) ? '0.35' : '1';
  });
}

function findLinkById(id) {
  for (const g of state.groups) {
    for (const l of (g.links || [])) {
      if (l.id === id) return { group: g, link: l };
    }
  }
  return null;
}

function renderPalette(container, inputField) {
  container.innerHTML = '';
  palette.forEach(color=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-dot';
    btn.style.background = color;
    if (inputField.value === color) btn.classList.add('active');
    btn.addEventListener('click', ()=>{
      inputField.value = color;
      container.querySelectorAll('.color-dot').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
    container.appendChild(btn);
  });
}

/* auth screen */
function attachEventsAuth() {
  const form = document.getElementById('form-auth');
  if (!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try {
      await api.login({
        login: form.login.value.trim(),
        password: form.password.value.trim()
      });
      window.location.reload();
    } catch (err) {
      const errBox = document.getElementById('auth-error');
      if (errBox) {
        errBox.textContent = err.message;
        errBox.classList.remove('hidden');
      } else {
        showToast(err.message);
      }
    }
  });
}

/* main app */
function randomColor() { return '#' + Math.floor(Math.random() * 0xffffff) .toString(16) .padStart(6, '0'); }

function attachEventsApp() {
  const navHome = el('nav-home');
  if (navHome) {
    navHome.addEventListener('click', ()=>{
      state.view = 'home';
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      navHome.classList.add('active');
      const vm = el('view-mode');
      if (vm) vm.textContent = 'Главная';
      renderMain();
    });
  }

  const btnToggle = el('btn-toggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', ()=>{
      const sidebar = el('sidebar');
      sidebar.classList.toggle('collapsed');
      btnToggle.textContent = sidebar.classList.contains('collapsed') ? '>' : 'Свернуть';
    });
  }

  const btnNewGroup = el('btn-new-group');
  if (btnNewGroup) {
    btnNewGroup.addEventListener('click', ()=>{
      const form = el('form-group');
      if (!form) return;
      form.reset();
      form.id.value = '';
      form.color.value = randomColor();
      const title = el('modal-group-title');
      if (title) title.textContent = 'Новая группа';
      openModal('#modal-group');
      const paletteBox = document.getElementById('group-color-palette');
      if (paletteBox) renderPalette(paletteBox, form.color);
    });
  }

  const btnNewLink = el('btn-new-link');
  if (btnNewLink) {
    btnNewLink.addEventListener('click', ()=>{
      const form = el('form-link');
      if (!form) return;
      form.reset();
      form.id.value = '';
      if (state.groups[0]) form.group_id.value = state.groups[0].id;
      form.color.value = randomColor();
      const title = el('modal-link-title');
      if (title) title.textContent = 'Новая ссылка';
      openModal('#modal-link');
      const paletteBox = document.getElementById('link-color-palette');
      if (paletteBox) renderPalette(paletteBox, form.color);
    });
  }

  document.querySelectorAll('[data-close]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      closeModal(btn.getAttribute('data-close'));
    });
  });

  const formGroup = el('form-group');
  if (formGroup) {
    formGroup.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = e.target;
      const id = form.id.value;
      const payload = {
        id,
        name: form.name.value.trim(),
        color: form.color.value
      };
      try {
        if (id) {
          await api.updateGroup(payload);
        } else {
          await api.createGroup(payload);
        }
        await loadData();
        closeModal('#modal-group');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  const formLink = el('form-link');
  if (formLink) {
    formLink.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const form = e.target;
      const id = form.id.value;
      const payload = {
        id,
        title: form.title.value.trim(),
        url: form.url.value.trim(),
        tags: form.tags.value.trim(),
        group_id: form.group_id.value,
        color: form.color.value
      };
      try {
        if (id) {
          await api.updateLink(payload);
        } else {
          await api.createLink(payload);
        }
        await loadData();
        closeModal('#modal-link');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  document.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action) return;

    if (action === 'edit-group') {
      const g = state.groups.find(x=>x.id === id);
      if (!g) return;
      const form = el('form-group');
      if (!form) return;
      form.id.value = g.id;
      form.name.value = g.name;
      form.color.value = g.color || palette[0];
      const title = el('modal-group-title');
      if (title) title.textContent = 'Редактировать группу';
      openModal('#modal-group');
      const paletteBox = document.getElementById('group-color-palette');
      if (paletteBox) renderPalette(paletteBox, form.color);
    }

    if (action === 'del-group') {
      if (!confirm('Удалить группу со всеми ссылками?')) return;
      try {
        await api.deleteGroup(id);
        await loadData();
      } catch (err) {
        showToast(err.message);
      }
    }

    if (action === 'add-link-group') {
      const g = state.groups.find(x=>x.id === id);
      if (!g) return;
      const form = el('form-link');
      if (!form) return;
      form.reset();
      form.id.value = '';
      form.group_id.value = g.id;
      form.color.value = randomColor();
      const title = el('modal-link-title');
      if (title) title.textContent = 'Новая ссылка в "' + g.name + '"';
      openModal('#modal-link');
      const paletteBox = document.getElementById('link-color-palette');
      if (paletteBox) renderPalette(paletteBox, form.color);
    }

    if (action === 'edit-link') {
      const found = findLinkById(id);
      if (!found) return;
      const { group, link } = found;
      const form = el('form-link');
      if (!form) return;
      form.id.value = link.id;
      form.title.value = link.title;
      form.url.value = link.url;
      form.tags.value = (link.tags || []).join(', ');
      form.group_id.value = group.id;
      form.color.value = link.color || palette[0];
      const title = el('modal-link-title');
      if (title) title.textContent = 'Редактировать ссылку';
      openModal('#modal-link');
      const paletteBox = document.getElementById('link-color-palette');
      if (paletteBox) renderPalette(paletteBox, form.color);
    }

    if (action === 'del-link') {
      if (!confirm('Удалить ссылку?')) return;
      try {
        await api.deleteLink(id);
        await loadData();
      } catch (err) {
        showToast(err.message);
      }
    }
  });

  const search = el('search');
  if (search) search.addEventListener('input', applySearchFilter);

  const btnAuth = el('btn-auth');
  if (btnAuth) {
    btnAuth.addEventListener('click', async ()=>{
      try {
        await api.logout();
        window.location.reload();
      } catch (err) {
        showToast(err.message);
      }
    });
  }
}

function openModal(id) {
  const m = document.querySelector(id);
  if (m) m.classList.remove('hidden');
}
function closeModal(id) {
  const m = document.querySelector(id);
  if (m) m.classList.add('hidden');
}

window.addEventListener('load', ()=>{
  if (!window.APP_AUTH) {
    attachEventsAuth();
  } else {
    attachEventsApp();
    loadData();
  }
});