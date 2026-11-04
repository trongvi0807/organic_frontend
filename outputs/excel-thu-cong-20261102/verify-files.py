import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path(__file__).parent
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
all_rows = {}
names = ['01-san-pham-moi.xlsx', '02-don-mua-NCC01.xlsx', '03-phieu-nhap-NCC01.xlsx']

for name in names:
    with zipfile.ZipFile(root / name) as archive:
        assert archive.testzip() is None, name
        assert len(archive.namelist()) <= 300
        assert not any('externallinks/' in p.lower() or 'vbaproject' in p.lower() for p in archive.namelist())
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            doc = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            shared = [''.join(si.itertext()) for si in doc]
        def value(cell):
            kind = cell.get('t')
            raw = cell.find('m:v', ns)
            if kind == 's':
                return shared[int(raw.text)]
            if kind == 'inlineStr':
                return ''.join(cell.find('m:is', ns).itertext())
            if raw is None or raw.text is None:
                return ''
            if kind in ('str', 'd'):
                return raw.text
            assert kind != 'e', f'{name}: cell error'
            return float(raw.text)
        for member in archive.namelist():
            if re.match(r'xl/worksheets/sheet\d+\.xml$', member):
                sheet = ET.fromstring(archive.read(member))
                assert not sheet.findall('.//m:f', ns), f'{name}: unexpected formula'
        data = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        assert data.find('m:mergeCells', ns) is None
        rows = []
        for row in data.findall('m:sheetData/m:row', ns):
            cells = {c.get('r'): c for c in row.findall('m:c', ns)}
            rows.append([value(c) for c in cells.values()])
        expected_cols = 10 if name.startswith('01') else 5 if name.startswith('02') else 11
        assert len(rows) == 7, f'{name}: expected six data rows'
        assert all(len(row) == expected_cols for row in rows), f'{name}: column mismatch'
        assert data.find('m:sheetViews/m:sheetView/m:pane', ns) is not None
        all_rows[name] = rows
        if name.startswith('03'):
            for r in rows[1:]:
                assert r[4] == r[3] and r[5] == 0
                assert isinstance(r[8], float) and isinstance(r[9], float)
                assert r[9] - r[8] == 10
        print(json.dumps({'file': name, 'data_rows': len(rows)-1, 'columns': expected_cols, 'bytes': (root/name).stat().st_size}, ensure_ascii=False))

purchase = all_rows[names[1]][1:]
receipts = all_rows[names[2]][1:]
assert [r[0] for r in purchase] == [r[0] for r in receipts]
assert [r[3] for r in purchase] == [r[4] for r in receipts]
assert sum(r[3] for r in purchase) == 48
assert sum(r[3]*r[4] for r in purchase) == 2600000
with zipfile.ZipFile(root / 'Bo-Excel-San-pham-Don-mua-Phieu-nhap.zip', 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for name in [*names, 'HUONG-DAN.txt']:
        bundle.write(root / name, arcname=name)
print('File integrity and purchase/receipt quantities verified; no business action performed.')
