<?php
session_start();

const DATA_FILE = __DIR__ . '/data/groups.json';
const USER_LOGIN = 'admin';
const USER_PASS  = 'admin123';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$type = $_GET['type'] ?? '';

if ($action === 'login' && $method === 'POST') {
    $login = trim($_POST['login'] ?? '');
    $password = trim($_POST['password'] ?? '');
    if ($login === USER_LOGIN && $password === USER_PASS) {
        $_SESSION['user'] = $login;
        echo json_encode(['status' => 'ok']);
    } else {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Неверный логин или пароль']);
    }
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'ok']);
    exit;
}

$authRequired = [
    'list','create_group','update_group','delete_group',
    'create_link','update_link','delete_link',
    'reorder_links','reorder_groups'
];
if (in_array($action, $authRequired, true) && empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if ($type === 'notes') {
    $file = __DIR__ . '/data/notes.json';
    $notes = json_decode(file_get_contents($file), true);

    // GET
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode($notes);
        exit;
    }

    // POST — добавление
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $new = [
            'id' => time(),
            'title' => $data['title'] ?? '',
            'content' => $data['content'] ?? '',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $notes[] = $new;
        file_put_contents($file, json_encode($notes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        echo json_encode(['status' => 'ok']);
        exit;
    }

    // DELETE
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if ($id) {
            $notes = array_filter($notes, fn($n) => $n['id'] != $id);
            file_put_contents($file, json_encode(array_values($notes), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
        echo json_encode(['status' => 'ok']);
        exit;
    }
}


function load_data() {
    if (!file_exists(DATA_FILE)) {
        return ['groups' => []];
    }
    $json = file_get_contents(DATA_FILE);
    $data = json_decode($json, true);
    if (!is_array($data)) $data = ['groups' => []];
    if (!isset($data['groups']) || !is_array($data['groups'])) $data['groups'] = [];
    return $data;
}

function save_data($data) {
    $tmp = DATA_FILE . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, DATA_FILE);
}

function uuid() {
    return bin2hex(random_bytes(8));
}

$data = load_data();

if ($action === 'list') {
    echo json_encode(['status' => 'ok', 'data' => $data]);
    exit;
}

if ($action === 'create_group' && $method === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $color = trim($_POST['color'] ?? '#e8f0ff');
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Название обязательно']);
        exit;
    }
    $group = [
        'id' => 'g_' . uuid(),
        'name' => $name,
        'color' => $color,
        'links' => []
    ];
    $data['groups'][] = $group;
    save_data($data);
    echo json_encode(['status' => 'ok', 'group' => $group]);
    exit;
}

if ($action === 'update_group' && $method === 'POST') {
    $id = $_POST['id'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $color = trim($_POST['color'] ?? '#e8f0ff');
    foreach ($data['groups'] as &$g) {
        if ($g['id'] === $id) {
            if ($name !== '') $g['name'] = $name;
            $g['color'] = $color;
            save_data($data);
            echo json_encode(['status' => 'ok', 'group' => $g]);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Группа не найдена']);
    exit;
}

if ($action === 'delete_group' && $method === 'POST') {
    $id = $_POST['id'] ?? '';
    foreach ($data['groups'] as $i => $g) {
        if ($g['id'] === $id) {
            array_splice($data['groups'], $i, 1);
            save_data($data);
            echo json_encode(['status' => 'ok']);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Группа не найдена']);
    exit;
}

if ($action === 'create_link' && $method === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $url = trim($_POST['url'] ?? '');
    $tags = trim($_POST['tags'] ?? '');
    $groupId = $_POST['group_id'] ?? '';
    $color = trim($_POST['color'] ?? '#e8f0ff');

    if ($title === '' || $url === '' || $groupId === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Заполните все поля']);
        exit;
    }

    $tagsArr = array_filter(array_map('trim', explode(',', $tags)));
    $now = date('Y-m-d H:i:s');

    foreach ($data['groups'] as &$g) {
        if ($g['id'] === $groupId) {
            $link = [
                'id' => 'l_' . uuid(),
                'title' => $title,
                'url' => $url,
                'tags' => $tagsArr,
                'color' => $color,
                'created_at' => $now,
                'updated_at' => $now
            ];
            $g['links'][] = $link;
            save_data($data);
            echo json_encode(['status' => 'ok', 'link' => $link, 'group_id' => $groupId]);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Группа не найдена']);
    exit;
}

if ($action === 'update_link' && $method === 'POST') {
    $id = $_POST['id'] ?? '';
    $title = trim($_POST['title'] ?? '');
    $url = trim($_POST['url'] ?? '');
    $tags = trim($_POST['tags'] ?? '');
    $groupId = $_POST['group_id'] ?? '';
    $color = trim($_POST['color'] ?? '#e8f0ff');

    $tagsArr = array_filter(array_map('trim', explode(',', $tags)));
    $now = date('Y-m-d H:i:s');

    foreach ($data['groups'] as &$g) {
        foreach ($g['links'] as $idx => &$l) {
            if ($l['id'] === $id) {
                if ($title !== '') $l['title'] = $title;
                if ($url !== '') $l['url'] = $url;
                $l['tags'] = $tagsArr;
                $l['color'] = $color;
                $l['updated_at'] = $now;

                if ($groupId && $groupId !== $g['id']) {
                    $linkCopy = $l;
                    array_splice($g['links'], $idx, 1);
                    foreach ($data['groups'] as &$g2) {
                        if ($g2['id'] === $groupId) {
                            $g2['links'][] = $linkCopy;
                            break;
                        }
                    }
                }

                save_data($data);
                echo json_encode(['status' => 'ok']);
                exit;
            }
        }
    }
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Ссылка не найдена']);
    exit;
}

if ($action === 'delete_link' && $method === 'POST') {
    $id = $_POST['id'] ?? '';
    foreach ($data['groups'] as &$g) {
        foreach ($g['links'] as $i => $l) {
            if ($l['id'] === $id) {
                array_splice($g['links'], $i, 1);
                save_data($data);
                echo json_encode(['status' => 'ok']);
                exit;
            }
        }
    }
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Ссылка не найдена']);
    exit;
}

if ($action === 'reorder_links' && $method === 'POST') {
    $groupId = $_POST['group_id'] ?? '';
    $order = $_POST['order'] ?? '';
    if (!$groupId || !$order) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Нет данных']);
        exit;
    }
    $ids = array_filter(array_map('trim', explode(',', $order)));
    foreach ($data['groups'] as &$g) {
        if ($g['id'] === $groupId) {
            $map = [];
            foreach ($g['links'] as $l) {
                $map[$l['id']] = $l;
            }
            $newLinks = [];
            foreach ($ids as $id) {
                if (isset($map[$id])) $newLinks[] = $map[$id];
            }
            $g['links'] = $newLinks;
            save_data($data);
            echo json_encode(['status' => 'ok']);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Группа не найдена']);
    exit;
}

if ($action === 'reorder_groups' && $method === 'POST') {
    $order = $_POST['order'] ?? '';
    $ids = array_filter(array_map('trim', explode(',', $order)));
    $map = [];
    foreach ($data['groups'] as $g) {
        $map[$g['id']] = $g;
    }
    $newGroups = [];
    foreach ($ids as $id) {
        if (isset($map[$id])) $newGroups[] = $map[$id];
    }
    $data['groups'] = $newGroups;
    save_data($data);
    echo json_encode(['status' => 'ok']);
    exit;
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Неизвестное действие']);
