"""Refresh only demo lot expiration dates in the modified backup and import patches."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

assets = Path(__file__).resolve().parents[1] / 'src' / 'assets'
backup_path = assets / 'intellimenu-firestore-modified.json'
patch_path = assets / 'firestore-formula-patches.json'
backup = json.loads(backup_path.read_text(encoding='utf-8'))
migration = json.loads(patch_path.read_text(encoding='utf-8'))
anchor = datetime.now(timezone.utc).replace(microsecond=0)
summary = []
for index, document in enumerate(backup['collections']['inventory_lots']):
    days = [7, 6, 4][index % 3]
    expiration = anchor + timedelta(days=days)
    timestamp = {'__firestoreType': 'Timestamp', 'seconds': int(expiration.timestamp()), 'nanoseconds': 0}
    document['data']['expiration_date'] = timestamp
    # Existing receipt dates are preserved, so actual total shelf life remains available.
    assert document['data']['received_at']['seconds'] < timestamp['seconds']
    patch = next((item for item in migration['patches']
                  if item['collection'] == 'inventory_lots' and item['id'] == document['id']), None)
    if patch is None:
        patch = {'collection': 'inventory_lots', 'id': document['id'], 'fields': {}}
        migration['patches'].append(patch)
    patch['replace_fields'] = {'expiration_date': timestamp}
    summary.append({'id': document['id'], 'category': document['data']['category'],
                    'days_until_expiration': days, 'expiration_utc': expiration.isoformat()})

backup['demo_expiration_schedule'] = {
    'generated_at_utc': anchor.isoformat(),
    'note': 'Synthetic demo dates. Only expiration_date is explicitly overwritten on import.',
    'lots': summary,
}
for path, value in [(backup_path, backup), (patch_path, migration)]:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(summary)} lot expiration dates relative to {anchor.isoformat()}. No live writes.')
for days in [7, 6, 4]:
    print(f'{days} days: {sum(row["days_until_expiration"] == days for row in summary)} lots')
