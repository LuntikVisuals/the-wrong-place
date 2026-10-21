# The Wrong Place (прототип 0.1)
Build: `python3 build.py` → `dist/the-wrong-place.html` (concatenates src/*.js alphabetically after src/a_head.html).
Tests: `python3 tests/run_scen.py` (26 functional scenarios), `python3 tests/browser_test.py 100` (headless Chrome: console errors,
live play on every side/character/map, touch + aim input, screenshots → screens/, ~620 bot-vs-bot matches), `node tests/node_stuck.js 15 mansion` (fast node sim).

## Maps & balance
- Village and Ship are hand-designed in `tools/mapdesign.py` (ASCII), and `python3 tools/mapdesign.py` regenerates `src/c_maps2.js`. Per-map generator speed: `M.genMul` (village 1.5, ship 1.6).
- `node tests/mapcheck.js [village|ship]` checks reachability. `node tests/balance.js N [maps]` gives killer win % per map and killer.

## Lobby backgrounds
- `LBG` in `src/k_lobby.js` holds the backgrounds: parlor (free), graveyard 40, cabin 60, barn 80, chapel 100. You buy and equip them in Магазин, and they are saved in localStorage `twp_prof` (`bg`, `owned`).

## v0.1.1 (versionCode 2)

- Бег и стамина: кнопка «Бег»/Shift, полоска стамины, ×1.5 скорость, отдышка после истощения; анимация бега с пылью; боты бегут.
- Шкафчики (прятки, сердцебиение слышно, убийца вытаскивает сразу на плечо), следы бегущих (только для убийцы, 5 с), погоня (процедурная музыка + красные края), «последний шанс» (сирена, красный свет у ворот, убийца +10%).
- Погода/события: ясно, туман, гроза с молниями, отключение света (~10 с). Люка и тотемов нет.
- Новые персонажи: Пустой Пастух (Колокол, Овцы, пассив Стадо), Итан Коул (Молитва), Лили Марш (Свисток), Они (только модель/анимации/базовая атака).
- Карты: разнос одинаковых декораций по типу (колодцы ≥12 клеток, ничего не слипается), деревья без кучек; здания деревни — 2 входа, лишние дыры/проёмы подряд убраны (особняк: дыра не ближе 4 клеток к двери, реже). mapaudit проверяет декор и входы.
- Они: Тотем хранителя (до 4, замедление + Проклятие 20 с, видно сквозь стены), Телепорт к тотему, Рывок (удар катаной), Друзья из прошлого (5 душ на 60 с, слабый урон, не кладут). Пассивки нет.
- Баланс по таблице TUNE (карта × убийца), цель 35–50% побед убийцы.
- New lobby: profile (avatar/name/level/stats), trophies & ranks, Season I pass, coins + souls, menu, news/friends/club ("скоро"), daily rewards, quests, mode/map card.
- Modes: Обычный and Рейтинг (trophies won/lost by result, saved locally).
- Shop tabs: Акции, Фоны, Персонажи, Ресурсы. No real-money purchases.
- All overlays scroll on small screens and have a round X (top-left) back to the lobby; Android Back works there too.
- In-match navigation arrows: survivors → nearest unfinished generator + teammates; killer → nearest hook; floor-aware with stair hints.
- Hooks grouped in clusters (gallows) on all maps; generator speed retuned per map (village ×2.0, ship ×1.9).
- Rounded UI corners everywhere; pixel-aligned characters (integer device-pixel world scale, integer sprite units, symmetric rounding).
- Map audit fixes: village loft wall hole closed, ship hold hooks moved off the wall, ship deck cover props, mansion large empty rooms filled; new tests/mapaudit.js.
- Map spacing pass (relayoutObjects): generators ≥10 tiles apart per floor and ≥6 across floors; hooks stay in their area but ≥4 tiles apart, each on its own post, clear of walls/props/stairs/gens; items moved off other objects. Village loft keeps a single hook (room too small for two). Repair speed: mansion ×0.9, village ×2.4, ship ×1.8. tests/mapaudit.js checks all of it.
