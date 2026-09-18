# -*- coding: utf-8 -*-
"""
AURA — слой данных для личного кабинета и бонусов (Уровень 2).

Сейчас источник данных — то, что реально есть на этом ПК:
  1) заказы с сайта (server/data/orders.json) — самовывоз, те же, что видит салон;
  2) витрина 1С (site_catalog.db) — чтобы показать артикулы и наличие по покупкам.

Когда появится выгрузка лояльности из BizHub/1С (карты, бонусный счёт, история
покупок по карте), достаточно реализовать from_bizhub() и переключить источник
переменной окружения  AURA_LOYALTY_SOURCE=bizhub  — интерфейс profile() не меняется.

Правила бонусов (совпадают с тем, что написано на странице «Бонусы AURA»):
  2% от суммы заказа, 1 бонус = 1 ₽, списание до 30% суммы покупки.
"""
import hmac
import hashlib
import json
import os
import random
import re
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ORDERS = os.environ.get('ORDERS_FILE', os.path.join(HERE, 'data', 'orders.json'))
SECRET = os.environ.get('AURA_AUTH_SECRET', 'aura-local-secret-2026')
SOURCE = os.environ.get('AURA_LOYALTY_SOURCE', 'orders')
SMS_READY = bool(os.environ.get('AURA_SMS_PROVIDER'))

BONUS_RATE = 0.02          # 2% от суммы заказа
BONUS_MAX_SHARE = 0.30     # списывать можно до 30% суммы
LEVELS = [                 # порог по сумме покупок, ₽ -> уровень
    (0, 'Серебро'),
    (50000, 'Золото'),
    (150000, 'Платина'),
]

_codes = {}                # phone -> (code, expires_at)


def _digits(phone):
    return re.sub(r'\D', '', phone or '')


def load_orders():
    if not os.path.exists(ORDERS):
        return []
    try:
        with open(ORDERS, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


def orders_of(phone):
    d = _digits(phone)
    if not d:
        return []
    out = [o for o in load_orders() if _digits(o.get('phone')) == d]
    return sorted(out, key=lambda o: o.get('created', ''), reverse=True)


# ---------- вход по коду ----------

def start_auth(phone):
    """Возвращает (ok, demo, code). demo=True — SMS-шлюз не подключён,
    поэтому код возвращается в ответе и показывается прямо на странице."""
    d = _digits(phone)
    if len(d) < 10:
        return False, not SMS_READY, None
    code = '%04d' % random.randint(0, 9999)
    _codes[d] = (code, time.time() + 300)
    return True, not SMS_READY, code


def verify(phone, code):
    d = _digits(phone)
    rec = _codes.get(d)
    if not rec:
        return None
    real, exp = rec
    if time.time() > exp or str(code).strip() != real:
        return None
    _codes.pop(d, None)
    return token_for(d)


def token_for(phone_digits):
    mac = hmac.new(SECRET.encode(), phone_digits.encode(), hashlib.sha256).hexdigest()[:24]
    return phone_digits + '.' + mac


def phone_from_token(token):
    if not token or '.' not in token:
        return None
    d, mac = token.split('.', 1)
    return d if hmac.compare_digest(mac, token_for(d).split('.', 1)[1]) else None


# ---------- профиль ----------

def from_orders(phone):
    """Бонусы и история — по заказам сайта (реальные данные, не выдуманные)."""
    orders = orders_of(phone)
    paid = [o for o in orders if o.get('status') in ('выдан', 'оплачен', 'готов')]
    turnover = sum(sum((i.get('price') or 0) * (i.get('qty') or 1) for i in (o.get('items') or [])) for o in paid)
    active = [o for o in orders if o.get('status') not in ('выдан', 'отменён')]
    return {
        'source': 'orders',
        'source_note': 'Заказы, оформленные на сайте (самовывоз). Бонусы начислены по правилам AURA: 2% от суммы.',
        'orders': orders,
        'active': len(active),
        'turnover': round(turnover),
        'bonuses': int(turnover * BONUS_RATE),
        'bonus_rate': BONUS_RATE,
        'bonus_max_share': BONUS_MAX_SHARE,
    }


def from_bizhub(phone):
    """Заготовка под выгрузку BizHub/1С: карты лояльности, бонусный счёт.
    Пока данных нет — возвращаем None, вызывающий код откатывается на from_orders()."""
    return None


def profile(phone):
    data = None
    if SOURCE == 'bizhub':
        data = from_bizhub(phone)
    if data is None:
        data = from_orders(phone)
    orders = data['orders']
    name = ''
    for o in orders:
        if o.get('name'):
            name = o['name']
            break
    city = next((o.get('city') for o in orders if o.get('city')), 'Раменское')
    turnover = data['turnover']
    level, nxt = LEVELS[0][1], None
    for i, (threshold, label) in enumerate(LEVELS):
        if turnover >= threshold:
            level = label
            nxt = LEVELS[i + 1] if i + 1 < len(LEVELS) else None
    data.update({
        'phone': phone,
        'name': name,
        'city': city,
        'level': level,
        'next_level': nxt[1] if nxt else None,
        'next_level_at': nxt[0] if nxt else None,
        'passports': [i for o in orders for i in (o.get('items') or [])],
        'reserves': [o for o in data.get('orders', []) if o.get('status') == 'новый'],
    })
    return data
