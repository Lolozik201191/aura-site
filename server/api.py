# -*- coding: utf-8 -*-
"""
AURA — сервер витрины: JSON API каталога + статические страницы сайта + заказы (самовывоз).
Данные каталога: data/site_catalog.db (строится catalog_build.py).
Заказы: data/orders.json (заявки на самовывоз; в 1С ничего не создаётся).
Запуск: python api.py   (порт: AURA_API_PORT или 8138)
"""
import json, os, re, sqlite3, sys, urllib.parse, datetime, mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.environ.get('SITE_DB', os.path.join(HERE, 'data', 'site_catalog.db'))
# Корневая папка репозитория — единый «сайт» (Pages отдаёт её же); в страницы встроен live.js
PUBLIC = os.environ.get('SITE_PUBLIC', os.path.normpath(os.path.join(HERE, '..')))
ORDERS = os.environ.get('ORDERS_FILE', os.path.join(HERE, 'data', 'orders.json'))
PORT = int(os.environ.get('AURA_API_PORT', '8138'))
ADMIN_TOKEN = os.environ.get('AURA_ORDERS_TOKEN', 'aura2026')
SORTS = {'popular': 'sales desc, sum_sales desc', 'price_asc': 'price asc',
         'price_desc': 'price desc', 'new': 'last_sale_dt desc', 'qty': 'qty desc'}
MIME = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'}

def conn():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def load_orders():
    if not os.path.exists(ORDERS):
        return []
    try:
        with open(ORDERS, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_orders(orders):
    with open(ORDERS, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=1)

class H(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *a):
        pass

    def _send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, rel):
        # безопасный путь в пределах PUBLIC
        full = os.path.normpath(os.path.join(PUBLIC, rel.lstrip('/')))
        if not full.startswith(os.path.normpath(PUBLIC)):
            return self._send_json({'error': 'forbidden'}, 403)
        if os.path.isdir(full):
            full = os.path.join(full, 'index.html')
        if not os.path.exists(full):
            return self._send_json({'error': 'not found'}, 404)
        ext = os.path.splitext(full)[1].lower()
        ctype = MIME.get(ext) or mimetypes.guess_type(full)[0] or 'application/octet-stream'
        with open(full, 'rb') as f:
            body = f.read()
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip('/') or '/'
            params = urllib.parse.parse_qs(parsed.query)
            def p(name, default=None):
                v = params.get(name)
                return v[0] if v else default
            if path.startswith('/api/'):
                return self._api_get(path, p)
            return self._send_file(path)
        except Exception as e:
            return self._send_json({'error': str(e)}, 500)

    def _api_get(self, path, p):
        c = conn()
        if path == '/api/meta':
            return self._send_json({r['k']: r['v'] for r in c.execute('select k,v from meta')})
        if path == '/api/salons':
            rows = c.execute('select city, store_1c from salons order by city').fetchall()
            return self._send_json({'cities': sorted({r['city'] for r in rows}),
                                    'salons': [dict(r) for r in rows]})
        if path == '/api/categories':
            rows = c.execute('select category category, count(*) n from products group by category order by n desc').fetchall()
            out = [dict(r) for r in rows]
            # подкатегории обручальные
            for sub in ['Обручальные', 'Помолвочные']:
                n = c.execute('select count(*) from products where subcategory=?', (sub,)).fetchone()[0]
                if n:
                    out.append({'category': sub, 'n': n, 'group': 'Кольца'})
            return self._send_json({'categories': out})
        if path == '/api/products':
            where, args = [], []
            if p('category'):
                if p('category') in ('Обручальные', 'Помолвочные'):
                    where.append('subcategory=?'); args.append(p('category'))
                else:
                    where.append('category=?'); args.append(p('category'))
            if p('metal'):
                where.append('metal=?'); args.append(p('metal'))
            if p('q'):
                where.append('(name like ? or codes like ?)'); args += ['%' + p('q') + '%'] * 2
            if p('city'):
                where.append('cities_json like ?'); args.append('%"' + p('city') + '":%')
            if p('min_price'):
                where.append('price >= ?'); args.append(float(p('min_price')))
            if p('max_price'):
                where.append('price <= ?'); args.append(float(p('max_price')))
            sort = SORTS.get(p('sort'), SORTS['popular'])
            page = max(1, int(p('page', '1') or 1))
            per = min(100, max(1, int(p('per', '24') or 24)))
            wsql = (' where ' + ' and '.join(where)) if where else ''
            total = c.execute('select count(*) from products' + wsql, args).fetchone()[0]
            off = (page - 1) * per
            rows = c.execute(
                'select id, name, category, subcategory, metal, qty, n_cities, sales, price, last_sale_dt, cities_json '
                'from products' + wsql + ' order by ' + sort + ' limit ? offset ?',
                args + [per, off]).fetchall()
            items = []
            for r in rows:
                d = dict(r)
                try:
                    d['cities'] = json.loads(d.pop('cities_json') or '{}')
                except Exception:
                    d['cities'] = {}
                items.append(d)
            return self._send_json({'total': total, 'page': page, 'per': per, 'items': items})
        m = re.match(r'^/api/products/(\d+)$', path)
        if m:
            r = c.execute('select * from products where id=?', (int(m.group(1)),)).fetchone()
            if not r:
                return self._send_json({'error': 'not found'}, 404)
            d = dict(r)
            d['cities'] = json.loads(r['cities_json'])
            d.pop('cities_json', None)
            d['codes'] = [x for x in (d.get('codes') or '').split('; ')]
            return self._send_json(d)
        if path == '/api/orders':
            if p('token') != ADMIN_TOKEN:
                return self._send_json({'error': 'auth'}, 403)
            orders = load_orders()
            orders = sorted(orders, key=lambda o: o.get('created', ''), reverse=True)
            return self._send_json({'orders': orders})
        return self._send_json({'error': 'unknown api path', 'path': path}, 404)

    def do_POST(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path.rstrip('/') != '/api/orders':
                return self._send_json({'error': 'unknown'}, 404)
            ln = int(self.headers.get('Content-Length') or 0)
            raw = self.rfile.read(ln) if ln else b'{}'
            data = json.loads(raw.decode('utf-8') or '{}')
            phone = str(data.get('phone') or '').strip()
            if not re.match(r'^\+?[\d\s()-]{10,18}$', phone):
                return self._send_json({'error': 'bad phone'}, 400)
            orders = load_orders()
            oid = max([o.get('id', 0) for o in orders], default=0) + 1
            order = {
                'id': oid, 'created': datetime.datetime.now().isoformat(timespec='seconds'),
                'name': str(data.get('name') or '').strip(),
                'phone': phone, 'city': str(data.get('city') or '').strip(),
                'store': str(data.get('store') or '').strip(),
                'comment': str(data.get('comment') or '').strip(),
                'status': 'новый',
                'items': data.get('items') or [],
            }
            orders.append(order)
            save_orders(orders)
            return self._send_json({'ok': True, 'id': oid})
        except Exception as e:
            return self._send_json({'error': str(e)}, 500)

if __name__ == '__main__':
    print('AURA сервер: http://127.0.0.1:%d  (каталог: %s)' % (PORT, DB), flush=True)
    print('  страницы: /  /catalog.html  /product.html?id=2  /cart.html  /orders.html', flush=True)
    ThreadingHTTPServer(('0.0.0.0', PORT), H).serve_forever()
