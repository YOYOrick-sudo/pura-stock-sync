"""Authenticated staff checks; expects dedicated TEST fixture 000...901. No real seed writes."""
import json
import os
import unittest
from pathlib import Path
import requests

config = {}
for line in (Path(__file__).resolve().parents[1] / '.env').read_text().splitlines():
    if '=' in line:
        k, v = line.split('=', 1)
        config[k] = v.strip().strip('"').strip("'")
with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f:
    session = json.load(f)['session']
URL = config['VITE_SUPABASE_URL'] + '/rest/v1/'
H = {'apikey': config['VITE_SUPABASE_PUBLISHABLE_KEY'], 'Authorization': 'Bearer ' + session['access_token'], 'Content-Type': 'application/json'}
A = '00000000-0000-4000-8000-000000000901'

class TrialPermissions(unittest.TestCase):
    def test_no_count_is_unknown(self):
        r = requests.get(URL + 'v_voorraad_stand', headers=H, params={'select': 'naam,stand,status,tellen_nodig', 'naam': 'not.like.TEST%'}, timeout=30)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 6)
        self.assertTrue(all(x['stand'] is None and x['status'] == 'voorraad onbekend' and x['tellen_nodig'] for x in r.json()))

    def test_staff_cannot_set_computed_columns(self):
        r = requests.post(URL + 'voorraad_telling', headers=H, json={'voorraad_artikel_id': A, 'datum': '2026-10-29', 'moment': 'voor_opening', 'per_plek': {'Test losse flessen': 10}, 'totaal': 10, 'bron_ref': 'TEST-denied-computed', 'betrouwbaar': True}, timeout=30)
        self.assertIn(r.status_code, [401, 403])

    def test_staff_cannot_change_settings(self):
        r = requests.patch(URL + 'voorraad_artikel', headers={**H, 'Prefer': 'return=representation'}, params={'id': 'eq.' + A}, json={'bestelbuffer': 999}, timeout=30)
        self.assertIn(r.status_code, [200, 401, 403])
        if r.status_code == 200:
            self.assertEqual(r.json(), [])

    def test_staff_cannot_read_raw_till(self):
        r = requests.get(URL + 'kassa_verkoop_dag', headers=H, params={'select': 'id', 'limit': 1}, timeout=30)
        self.assertIn(r.status_code, [200, 401, 403])
        if r.status_code == 200:
            self.assertEqual(r.json(), [])

    def test_staff_cannot_run_learning_or_wrapper(self):
        for name, body in [('leercurve_bijwerken', {}), ('bestelbot_advies_loggen', {'p_vestiging': 'West', 'p_datum': '2026-10-29', 'p_leverdag': '2026-10-30', 'p_regels': []})]:
            r = requests.post(URL + 'rpc/' + name, headers=H, json=body, timeout=30)
            self.assertIn(r.status_code, [401, 403])

    def test_unauthorised_location_function_denied(self):
        r = requests.post(URL + 'rpc/voorraad_bewegingen_lezen', headers=H, json={'p_vestiging': 'Amsterdam'}, timeout=30)
        self.assertIn(r.status_code, [401, 403])

    def test_anon_denied(self):
        h = {'apikey': config['VITE_SUPABASE_PUBLISHABLE_KEY']}
        for table in ['voorraad_artikel', 'voorraad_telling', 'advies_log', 'leer_voorstel', 'v_voorraad_stand']:
            r = requests.get(URL + table, headers=h, params={'select': '*', 'limit': 1}, timeout=30)
            self.assertIn(r.status_code, [401, 403])

if __name__ == '__main__':
    unittest.main(verbosity=2)