"""Create a modified backup and an additive migration; keep the source untouched."""
import copy
import json
from pathlib import Path

assets = Path(__file__).resolve().parents[1] / 'src' / 'assets'
source = assets / 'intellimenu-firestore-2026-10-18T07-19-16-713Z.json'
original = json.loads(source.read_text(encoding='utf-8'))
updated = copy.deepcopy(original)
patches = []
previous_path = assets / 'intellimenu-firestore-modified.json'
previous = json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.exists() else {}

identity = {
    'stores': lambda d: d['name'],
    'inventory_lots': lambda d: (d['category'], d['expiration_date']['seconds'], d['quantity']),
    'partners': lambda d: d['name'],
    'claims': lambda d: (d['status'], d['claimed_quantity'], d['claimed_at']['seconds']),
}

for collection, documents in updated['collections'].items():
    for document in documents:
        data = document['data']
        defaults = {}
        if collection == 'stores':
            defaults = {
                'esg_waste_penalty_per_kg': 2.5,
                'retail_discount_pct': 0.5,
                'promo_demand_multiplier': 1.35,
                'demo_assumption_fields': ['retail_discount_pct', 'promo_demand_multiplier'],
            }
        elif collection == 'inventory_lots':
            defaults = {'environmental_impact_factor': {
                'dairy': 1.2, 'meat': 4.5, 'bakery': 0.6, 'produce': 0.8,
            }[data['category']]}
            if data['unit_of_measure'] == 'kg':
                defaults['weight_per_unit_kg'] = 1
            else:
                # Illustrative packaging only; replace with the actual net weight.
                weights = {'dairy': 1.0, 'bakery': 0.5}
                if data['category'] not in weights:
                    raise ValueError(f'No demo package weight for {data["category"]}')
                defaults['weight_per_unit_kg'] = weights[data['category']]
                defaults['demo_assumption_fields'] = ['weight_per_unit_kg']
        elif collection == 'partners':
            defaults = {'pickup_sla_hours': 6 if data['type'] == 'ngo' else 4}
        elif collection == 'sales_history':
            # Receipt/first-discount events cannot be reconstructed from daily sales.
            defaults = {'time_to_first_discount_hours': None}

        # Reuse recorded values from equivalent demo entities instead of inventing them.
        fields = {
            'stores': ['avg_daily_sales_by_category'],
            'inventory_lots': ['received_at', 'holding_cost_per_day'],
            'partners': ['offered_price_pct'] if data.get('type') == 'bulk_buyer' else [],
            'claims': ['avg_processing_time_hours'],
            'sales_history': [],
        }[collection]
        for field in fields:
            if field in data:
                continue
            matches = [d['data'][field] for d in original['collections'][collection]
                       if field in d['data'] and identity[collection](d['data']) == identity[collection](data)]
            if not matches or any(value != matches[0] for value in matches):
                raise ValueError(f'No unambiguous existing value for {collection}/{document["id"]}/{field}')
            defaults[field] = copy.deepcopy(matches[0])
        additions = {key: value for key, value in defaults.items() if key not in data}
        if additions:
            data.update(additions)
            patches.append({'collection': collection, 'id': document['id'], 'fields': additions})

updated['migration'] = {
    'id': 'formula-parameters-v2',
    'source': source.name,
    'notes': [
        'Existing values are preserved; missing values copied from equivalent demo entities where available.',
        'ESG penalty, environmental factors and pickup SLA are demo assumptions, not measured values.',
        'New demo assumptions: retail_discount_pct=0.5 (50%), promo_demand_multiplier=1.35.',
        'Package weights are illustrative: dairy=1 kg/unit, bakery=0.5 kg/unit; kg lots use 1 kg/unit by definition.',
        'demo_assumption_fields identifies the new unmeasured values in each affected document.',
        'Missing first-discount history is null (unknown), not a fabricated duration.',
        'No duplicate documents are removed.',
    ],
}
# Preserve the explicitly refreshed demo dates when rebuilding additive patches.
if 'demo_expiration_schedule' in previous:
    updated['demo_expiration_schedule'] = previous['demo_expiration_schedule']
    previous_lots = {document['id']: document['data'] for document in previous['collections']['inventory_lots']}
    for document in updated['collections']['inventory_lots']:
        expiration = previous_lots[document['id']]['expiration_date']
        document['data']['expiration_date'] = copy.deepcopy(expiration)
        patch = next(item for item in patches if item['collection'] == 'inventory_lots' and item['id'] == document['id'])
        patch['replace_fields'] = {'expiration_date': copy.deepcopy(expiration)}
        if 'demo_stock_scenarios' in previous:
            for field in ['quantity', 'received_at']:
                value = copy.deepcopy(previous_lots[document['id']][field])
                document['data'][field] = value
                patch['replace_fields'][field] = value
    if 'demo_stock_scenarios' in previous:
        updated['demo_stock_scenarios'] = previous['demo_stock_scenarios']

for name, value in [
    ('intellimenu-firestore-modified.json', updated),
    ('firestore-formula-patches.json', {'projectId': original['projectId'], 'patches': patches}),
]:
    (assets / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(patches)} document patches; original backup unchanged.')
