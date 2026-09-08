# -*- coding: utf-8 -*-
"""
AURA — генератор публичной витрины каталога из хранилища BizHub (данные 1С).
Вход : warehouse.db + warehouse_agg.db (проект BizHub, выгрузка 1С)
Выход: data/site_catalog.db + data/products.json + data/salons.json + data/meta.json
Запуск: python catalog_build.py   (пути к warehouse можно переопределить env:
        WH_DB, WH_AGG_DB; выходной каталог: OUT_DIR)
Принцип: строит ТОЛЬКО публичные данные (товар, металл, цена, наличие по салонам).
         Никаких телефонов/ФИО/внутренних сумм в витрину не попадает.
"""
import os, re, json, sqlite3, sys, datetime, hashlib
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

WH_DB    = os.environ.get('WH_DB',    r'E:\dsh work\bizhub\data\out\warehouse.db')
WH_AGG   = os.environ.get('WH_AGG',   r'E:\dsh work\bizhub\data\out\warehouse_agg.db')
OUT_DIR  = os.environ.get('OUT_DIR',  os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data'))
os.makedirs(OUT_DIR, exist_ok=True)

# ---- Города AURA и соответствующие магазины 1С (по именам складов) ----
# Жуковский закрыт; точки вне городов AURA на сайте не показываем.
CITY_SHOPS = {
    'Раменское':    ['Маг №1 Раменское №1'],
    'Ногинск':      ['Маг №8 Ног №1', 'Маг№11 Ногинск №3'],
    'Воскресенск':  ['Маг№12 Воскресенск №2'],
    'Егорьевск':    ['Маг №7 Егорьевск №1', 'Маг№15 Егорьевск №2'],
    'Луховицы':     ['Маг №4 Луховицы'],
    'Озёры':        ['Маг №5 Озёры'],
    'Электрогорск': ['Маг№14 Электрогорск'],
}
CITY_ORDER = ['Раменское', 'Ногинск', 'Воскресенск', 'Егорьевск', 'Луховицы', 'Озёры', 'Электрогорск']
STORE_TO_CITY = {store: city for city, stores in CITY_SHOPS.items() for store in stores}

# ---- Правила: категория и металл по названию ----
METAL_SUF = re.compile(r'\((au|ag|pt|pd)[.\s]*([0-9,]+)\)', re.I)
PREFIX = re.compile(r'^о\d+\.\s*')
WORDS = {
    'кольцо обр': 'Обручальные', 'кольцо помолвоч': 'Помолвочные', 'кольцо помол': 'Помолвочные',
    'кольцо сис': '', 'кольцо': '',
}
CATEGORIES = ['Кольца', 'Серьги', 'Браслеты', 'Цепи', 'Колье', 'Подвески', 'Броши', 'Пирсинг', 'Запонки', 'Бусы', 'Комплекты']
STOP = ('подарок', 'футляр', 'сувенир', 'икона', 'кружка', 'стакан', 'вилка', 'ложка', 'посуда',
        'значок', 'часы', 'зажим', 'чистка', 'ионизатор', 'брелок', 'соска')

def norm_name(raw):
    n = PREFIX.sub('', raw).strip()
    return n

def metal_from(raw):
    m = METAL_SUF.search(raw.lower())
    if not m:
        return None
    g = m.group(1).upper()
    lab = {'AU': 'Золото', 'AG': 'Серебро', 'PT': 'Платина', 'PD': 'Палладий'}[g]
    return '%s %s' % (lab, m.group(2))

def classify(raw):
    n = norm_name(raw).lower()
    for s in STOP:
        if s in n:
            return None, None
    if n.startswith('кольцо'):
        cat = 'Кольца'
        sub = 'Обручальные' if 'обр' in n else ('Помолвочные' if ('помолвоч' in n or 'помол ' in n or n.startswith('кольцо помол')) else '')
    elif n.startswith('серьги'):  cat, sub = 'Серьги', ''
    elif n.startswith('браслет'): cat, sub = 'Браслеты', ''
    elif n.startswith('цепь'):    cat, sub = 'Цепи', ''
    elif n.startswith('колье'):   cat, sub = 'Колье', ''
    elif n.startswith('подвеска'):cat, sub = 'Подвески', ''
    elif n.startswith('брошь'):   cat, sub = 'Броши', ''
    elif n.startswith('пирсинг'): cat, sub = 'Пирсинг', ''
    elif n.startswith('запонки'): cat, sub = 'Запонки', ''
    elif n.startswith('комплект'):cat, sub = 'Комплекты', ''
    elif n.startswith('бусы'):    cat, sub = 'Бусы', ''
    else: return None, None
    return cat, sub

def key_for_group(raw, metal):
    # ключ объединения дублей одной модели: название без металла/суффиксов + металл
    n = norm_name(raw).lower()
    n = METAL_SUF.sub('', n)
    n = re.sub(r'\s*\(шт\.?\)', '', n).strip()
    return (n, metal)

def q(cur, sql, *args):
    try:
        return cur.execute(sql, args).fetchall()
    except Exception as e:
        print('  ERR:', str(e)[:140])
        return []

def main():
    t0 = datetime.datetime.now()
    print('== AURA: сборка витрины ==', flush=True)
    print('warehouse:', WH_DB, flush=True)
    print('agg      :', WH_AGG, flush=True)

    wh = sqlite3.connect(WH_DB)
    w = wh.cursor()
    agg = sqlite3.connect(WH_AGG)
    a = agg.cursor()

    # 1) склады: имя -> ref
    sklad_ref = {}
    for ref, name in q(w, "select ref, name from catalog where type='Склады'"):
        sklad_ref[name] = ref
    shop_refs = []
    for city in CITY_ORDER:
        for store in CITY_SHOPS[city]:
            if store in sklad_ref:
                shop_refs.append((city, store, sklad_ref[store]))
    print('салонов на сайте: %d (%s)' % (len(shop_refs), ', '.join(CITY_ORDER)), flush=True)
    missing = [s for c in CITY_ORDER for s in CITY_SHOPS[c] if s not in sklad_ref]
    if missing:
        print('ВНИМАНИЕ: магазины не найдены в складах 1С:', missing, flush=True)
    shop_ref_set = {r for _, _, r in shop_refs}

    # 2) номенклатура: ref -> (code, name)
    info = {}
    for ref, code, name in q(w, 'select ref, code, name from dim_nomen'):
        info[ref] = (code, name)
    print('номенклатура:', len(info), flush=True)

    # 3) металл из справочника Пробы для позиций без суффикса
    probe = {}
    for ref, nm in q(w, "select ref, name from catalog where type='Пробы'"):
        probe[ref] = nm
    attr_proba = {}
    for ref, pr in q(w, 'select ref, proba_ref from nomen_attrs'):
        attr_proba[ref] = pr

    def probe_label(pname):
        p = (pname or '').strip().lower()
        m = re.match(r'^(au|ag|pt|pd)\.([0-9,]+)', p)
        if m:
            return {'au': 'Золото', 'ag': 'Серебро', 'pt': 'Платина', 'pd': 'Палладий'}[m.group(1)] + ' ' + m.group(2)
        if p.startswith('золото'):
            mm = re.search(r'(\d[\d,]*)', p); return 'Золото ' + mm.group(1) if mm else 'Золото'
        if p.startswith('серебро'):
            mm = re.search(r'(\d[\d,]*)', p); return 'Серебро ' + mm.group(1) if mm else 'Серебро'
        if p.startswith('платина'): return 'Платина'
        if p.startswith('палладий'): return 'Палладий'
        if p == 'сталь': return 'Сталь'
        return None

    # 4) остатки по витринным салонам
    bal = {}   # nomen -> {store: qty}
    for nref, sref, qty in q(a, 'select nomen_ref, sklad_ref, qty from mv_balance where qty != 0'):
        if sref in shop_ref_set and qty:
            bal.setdefault(nref, {})
            bal[nref][sref] = qty
    print('моделей с остатком в салонах AURA:', len(bal), flush=True)

    # 5) продажи: агрегат + последняя цена
    sale = {}
    for nref, cnt, sm, last_dt in q(w, 'select nomen_ref, count(*), sum(summa), max(date) from fact_retail group by nomen_ref'):
        sale[nref] = [int(cnt), round(sm or 0), str(last_dt)[:10], None]
    for nref, cena in w.execute('select nomen_ref, cena from fact_retail order by date'):
        if nref in sale and cena:
            sale[nref][3] = cena
    print('номенклатура с продажами:', len(sale), flush=True)

    # 6) группировка моделей (дедуп по названию+металл)
    groups = {}  # key -> dict
    for nref, store_qty in bal.items():
        code, raw = info.get(nref, ('?', '?'))
        cat, sub = classify(raw)
        if not cat:
            continue
        metal = metal_from(raw) or probe_label(probe.get(attr_proba.get(nref)))
        metal = metal or ''
        key = key_for_group(raw, metal)
        g = groups.setdefault(key, {
            'name': norm_name(raw), 'cat': cat, 'sub': sub or '', 'metal': metal,
            'codes': [], 'by_store': {}, 'sales': 0, 'sum_sales': 0, 'last_dt': None,
            'last_price': None, 'best_ref': None, 'refs': [],
        })
        if code not in g['codes']:
            g['codes'].append(code)
        g['refs'].append(nref)
        for sref, qt in store_qty.items():
            g['by_store'][sref] = g['by_store'].get(sref, 0) + qt
        sc = sale.get(nref, [0, 0, None, None])
        g['sales'] += sc[0]; g['sum_sales'] += sc[1]
        if sc[2] and (g['last_dt'] is None or sc[2] > g['last_dt']):
            g['last_dt'] = sc[2]
        # цена модели берём у карточки с наибольшим числом продаж (самая авторитетная)
        if g['best_ref'] is None or (sale.get(nref) or [0])[0] > (sale.get(g['best_ref']) or [0])[0]:
            g['best_ref'] = nref
    for g in groups.values():
        sc = sale.get(g['best_ref'], [0, 0, None, None])
        g['last_price'] = sc[3]
    print('моделей после группировки (дедуп):', len(groups), flush=True)

    # 7) сборка строк витрины
    salons_out = []
    for city in CITY_ORDER:
        for store in CITY_SHOPS[city]:
            salons_out.append({'city': city, 'store_1c': store, 'store_ref': None})
    rows = []
    for key, g in groups.items():
        city_qty = {}
        for city in CITY_ORDER:
            v = 0
            for store in CITY_SHOPS[city]:
                ref = sklad_ref.get(store)
                if ref:
                    v += g['by_store'].get(ref, 0)
            if v:
                city_qty[city] = int(v)
        total = sum(city_qty.values())
        if total <= 0:
            continue
        # цена: последняя продажа по самой продаваемой ссылке — здесь уже выбрана по дате
        rows.append({
            'name': g['name'], 'name_1c': g['name'], 'category': g['cat'], 'subcategory': g['sub'],
            'metal': g['metal'], 'codes': '; '.join(g['codes']), 'codes_list': g['codes'],
            'qty': int(total), 'cities': city_qty, 'n_cities': len(city_qty),
            'sales': g['sales'], 'sum_sales': g['sum_sales'], 'last_sale_dt': g['last_dt'],
            'price': round(g['last_price'], 2) if g['last_price'] else None,
        })
    rows.sort(key=lambda r: (-(r['sales'] or 0), -(r['sum_sales'] or 0)))

    # 8) запись SQLite
    dbp = os.path.join(OUT_DIR, 'site_catalog.db')
    if os.path.exists(dbp):
        os.remove(dbp)
    con = sqlite3.connect(dbp)
    cur = con.cursor()
    cur.execute('create table products (id integer primary key, name text, name_1c text, category text, '
                'subcategory text, metal text, codes text, qty integer, n_cities integer, '
                'cities_json text, sales integer, sum_sales real, last_sale_dt text, price real)')
    cur.execute('create index ix_cat on products(category)')
    cur.execute('create index ix_metal on products(metal)')
    today = datetime.date.today().isoformat()
    for i, r in enumerate(rows, start=1):
        cur.execute('insert into products values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    (i, r['name'], r['name_1c'], r['category'], r['subcategory'], r['metal'],
                     r['codes'], r['qty'], r['n_cities'], json.dumps(r['cities'], ensure_ascii=False),
                     r['sales'], r['sum_sales'], r['last_sale_dt'], r['price']))
    cur.execute('create table salons (city text, store_1c text)')
    for s in salons_out:
        cur.execute('insert into salons values (?,?)', (s['city'], s['store_1c']))
    cur.execute('create table meta (k text, v text)')
    cur.execute('insert into meta values (?,?)', ('built_at', datetime.datetime.now().isoformat(timespec='seconds')))
    try:
        data_date = a.execute('select max(dt) from mv_balance').fetchone()[0] or ''
    except Exception:
        data_date = ''
    cur.execute('insert into meta values (?,?)', ('data_date', str(data_date)))
    cur.execute('insert into meta values (?,?)', ('source', WH_DB))
    cur.execute('insert into meta values (?,?)', ('product_count', str(len(rows))))
    con.commit()

    # 9) JSON (удобно для отладки/деплоя на статику)
    with open(os.path.join(OUT_DIR, 'products.json'), 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, 'salons.json'), 'w', encoding='utf-8') as f:
        json.dump(salons_out, f, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, 'meta.json'), 'w', encoding='utf-8') as f:
        json.dump({'built_at': datetime.datetime.now().isoformat(timespec='seconds'),
                   'product_count': len(rows)}, f, ensure_ascii=False)

    # 10) сводка
    from collections import Counter
    cc = Counter(r['category'] for r in rows)
    cm = Counter(r['metal'] or '—' for r in rows)
    print(flush=True)
    print('ГОТОВО за %.1f c: витрина из %d моделей' % ((datetime.datetime.now() - t0).total_seconds(), len(rows)), flush=True)
    print('категории:', dict(cc), flush=True)
    print('металл   :', dict(cm), flush=True)
    print('файлы:', dbp, ', products.json, salons.json, meta.json', flush=True)

if __name__ == '__main__':
    main()
