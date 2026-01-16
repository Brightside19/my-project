<?php
session_start();
$isAuth = !empty($_SESSION['user']);
?>
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Links — Группы</title>
  <link rel="stylesheet" href="assets/style.css" />
</head>
<body>
<?php if (!$isAuth): ?>
  <div class="auth-screen">
    <div class="auth-panel">
      <h1>Links</h1>
      <p>Введите пароль для доступа к ссылкам</p>
      <form id="form-auth">
        <label>Логин
          <input name="login" required />
        </label>
        <label>Пароль
          <input name="password" type="password" required />
        </label>
        <div class="auth-actions">
          <button type="submit" class="btn primary">Войти</button>
        </div>
      </form>
      <div id="auth-error" class="error-banner hidden"></div>
    </div>
  </div>
  <script>
    window.APP_AUTH = false;
  </script>
  <script src="assets/app.js"></script>
<?php else: ?>
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <div class="brand">Links</div>
        <div class="sidebar-actions">
          <button class="btn primary" id="btn-new-group">Создать группу</button>
          <button class="btn" id="btn-new-link">Создать ссылку</button>
          <button class="btn ghost" id="btn-auth">Выйти</button>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-section">
          <div class="nav-title">Навигация</div>
          <ul class="nav-list">
            <li class="nav-item active" data-view="home" id="nav-home">Главная</li>
          </ul>
        </div>

        <div class="nav-section">
          <div class="nav-title">Группы</div>
          <ul id="group-list" class="group-list"></ul>
        </div>
      </nav>

      <div class="sidebar-bottom">
        <button class="btn small" id="btn-toggle">Свернуть</button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">

        <div class="search">
          <input id="search" placeholder="Поиск по ссылкам, URL или тегам" />
        </div>

        <div id="mobile-menu" class="mobile-menu"></div>
        
        <div class="top-actions">
          <div class="view-hint">Режим: <span id="view-mode">Главная</span></div>
        </div>
      </header>

      <section class="content">
        <div id="groups-container" class="groups-container"></div>
      </section>

      <footer class="footer">JSON‑хранилище, drag & drop, авторизация.</footer>
    </main>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast hidden"></div>

  <!-- Modal: group -->
  <div class="modal hidden" id="modal-group">
    <div class="modal-panel">
      <h4 id="modal-group-title">Новая группа</h4>
      <form id="form-group">
        <input type="hidden" name="id" />
        <label>Название
          <input name="name" required maxlength="100" />
        </label>
        <label>Цвет группы
          <input type="hidden" name="color" value="#e8f0ff" />
          <div id="group-color-palette" class="color-palette"></div>
        </label>
        <div class="modal-actions">
          <button type="submit" class="btn primary">Сохранить</button>
          <button type="button" class="btn" data-close="#modal-group">Отмена</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: link -->
  <div class="modal hidden" id="modal-link">
    <div class="modal-panel">
      <h4 id="modal-link-title">Новая ссылка</h4>
      <form id="form-link">
        <input type="hidden" name="id" />
        <label>Название
          <input name="title" required maxlength="255" />
        </label>
        <label>URL
          <input name="url" required maxlength="2000" />
        </label>
        <label>Теги (через запятую)
          <input name="tags" />
        </label>
        <label>Группа
          <select name="group_id" id="link-group-select"></select>
        </label>
        <label>Цвет ссылки
          <input type="hidden" name="color" value="#e8f0ff" />
          <div id="link-color-palette" class="color-palette"></div>
        </label>
        <div class="modal-actions">
          <button type="submit" class="btn primary">Сохранить</button>
          <button type="button" class="btn" data-close="#modal-link">Отмена</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    window.APP_AUTH = true;
  </script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
  <script src="assets/app.js"></script>
<?php endif; ?>
</body>
</html>