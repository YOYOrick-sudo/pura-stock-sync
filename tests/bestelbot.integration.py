"""Run: python3 tests/bestelbot.integration.py after lovable auth-session --json --self.
Only reads and intentionally rejected writes; never creates or changes operational data.
"""
import json
import os
import unittest
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
config = {}
for line in (ROOT / '.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        config[key] = value.strip().strip('"').strip("'")
with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as handle:
    session = json.load(handle)['session']
URL = config['VITE_SUPABASE_URL'] + '/rest/v1/'
HEADERS = {
    'apikey': config.get('VITE_SUPABASE_PUBLISHABLE_KEY', config.get('VITE_SUPABASE_ANON_KEY', '')),
    'Authorization': 'Bearer ' + session['access_token'],
    'Content-Type': 'application/json',
}


def rpc(name, body):
    return requests.post(URL + 'rpc/' + name, headers=HEADERS, json=body, timeout=20)


class BestelbotRules(unittest.TestCase):
    def test_normalisation_removes_accents_spacing_and_punctuation(self):
        response = rpc('bestelbot_normaliseer', {'p_tekst': '  Éi-mengsel!  '})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), 'eimengsel')

    def test_typo_returns_falafel_for_west(self):
        response = rpc('rpc_zoek_artikel', {'p_vestiging': 'West', 'p_tekst': 'falaf'})
        self.assertEqual(response.status_code, 200)
        rows = response.json()
        self.assertTrue(any('falafel' in row['naam'].lower() for row in rows))
        self.assertLessEqual(len(rows), 5)
        self.assertTrue(all(0 <= float(row['score']) <= 1 for row in rows))

    def test_invalid_location_is_rejected(self):
        response = rpc('rpc_zoek_artikel', {'p_vestiging': 'Amsterdam', 'p_tekst': 'falaf'})
        self.assertEqual(response.status_code, 400)

    def test_client_cannot_execute_bot_rate_admission(self):
        response = rpc('bestelbot_aanroep_start', {'p_actie': 'GET', 'p_vestiging': 'West', 'p_ip': None})
        self.assertIn(response.status_code, [401, 403])

    def test_client_cannot_execute_bot_import(self):
        response = rpc('bestelbot_import_historie', {'p_vestiging': 'West', 'p_rijen': [], 'p_audit_id': '00000000-0000-0000-0000-000000000000'})
        self.assertIn(response.status_code, [401, 403])

    def test_client_cannot_insert_audit(self):
        response = requests.post(URL + 'bot_audit_log', headers=HEADERS, json={
            'actie': 'test-rejected', 'vestiging': 'West', 'resultaat': {}, 'succes': False,
        }, timeout=20)
        self.assertIn(response.status_code, [401, 403])

    def test_hanos_is_rejected_for_west(self):
        suppliers = requests.get(URL + 'leveranciers', headers=HEADERS, params={'select': 'id', 'naam': 'eq.Hanos'}, timeout=20)
        self.assertEqual(suppliers.status_code, 200)
        supplier = suppliers.json()[0]['id']
        articles = requests.get(URL + 'artikel_locaties', headers=HEADERS, params={
            'select': 'artikel_id', 'vestiging': 'eq.West', 'is_actief': 'eq.true', 'deleted_at': 'is.null', 'limit': '1',
        }, timeout=20)
        self.assertEqual(articles.status_code, 200)
        article = articles.json()[0]['artikel_id']
        response = requests.post(URL + 'leverancier_artikel_vestiging', headers=HEADERS, json={
            'leverancier_id': supplier, 'artikel_id': article, 'vestiging': 'West',
        }, timeout=20)
        self.assertIn(response.status_code, [400, 403])
        self.assertIn(response.json().get('code'), ['23514', '42501'])


if __name__ == '__main__':
    unittest.main(verbosity=2)