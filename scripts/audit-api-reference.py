"""Read the supplied API PDF; emit a searchable frontend contract without changing it."""
import argparse, hashlib, json, re
from pathlib import Path
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('pdf', type=Path)
args = parser.parse_args()
reader = PdfReader(args.pdf)
clean_pages = []
for page in reader.pages:
    lines = page.extract_text().splitlines()
    clean_pages.append('\n'.join(line for line in lines if not re.fullmatch(r'(ORGANIC BACKEND / API REFERENCE|Frontend integration|Đối chiếu controller \+ DTO \| 26/10/2026|Trang \d+)', line.strip())))
text = '\n'.join(clean_pages)
starts = list(re.finditer(r'^API (\d{3})\. (.+)\n(GET|POST|PUT|PATCH|DELETE) (/api/v1/[^\s]+)', text, re.M))
endpoints = []
for index, match in enumerate(starts):
    block = text[match.start():starts[index+1].start() if index+1 < len(starts) else text.index('3. Từ điển cấu trúc dữ liệu')]
    output = re.search(r'Đầu ra: (.+)', block)
    params = []
    input_block = block.split('Đầu ra:')[0]
    for param in re.finditer(r'^(Path|Query / form|Header|Body|Multipart / form|Multipart|Request part|Part)\n([^\n]+)\n(.*?)\n(Có|Không)\n([^\n]+)', input_block, re.M | re.S):
        params.append(dict(location=param[1],name=param[2].strip(),type=' '.join(param[3].split()),required=param[4]=='Có',default=param[5].strip()))
    def example(after):
        segment = block.split(after,1)[1] if after in block else ''
        brace = segment.find('{')
        if brace < 0: return None
        try: return json.JSONDecoder().raw_decode(segment[brace:])[0]
        except json.JSONDecodeError: return None
    body_schema = re.search(r'^Body: (.+)\.$',block,re.M)
    endpoints.append(dict(number=int(match[1]),name=match[2],method=match[3],path=match[4],permission=(re.search(r'^Quyền: (.+)',block,re.M) or ['',''])[1],parameters=params,bodySchema=body_schema[1] if body_schema else None,requestShape=example('Body:'),responseContract=output[1] if output else None,responseShape=example('Đầu ra:'),frontend=not int(match[1])>=153))
assert len(endpoints)==155, f'Unexpected endpoint count: {len(endpoints)}'
schema_text = text.split('3. Từ điển cấu trúc dữ liệu',1)[1].split('4. Hợp đồng callback thanh toán',1)[0]
schema_starts = list(re.finditer(r'^(?:controller|request|response|service)\.[\w.]+\n(?=Field\n)',schema_text,re.M))
schemas = {}
for index, match in enumerate(schema_starts):
    block = schema_text[match.end():schema_starts[index+1].start() if index+1<len(schema_starts) else len(schema_text)]
    schemas[match[0].strip()] = block.strip()
contract = dict(source=args.pdf.name,sha256=hashlib.sha256(args.pdf.read_bytes()).hexdigest(),date='2026-10-26',endpoints=endpoints,schemas=schemas)
Path('docs/api-contract.json').write_text(json.dumps(contract,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
rows=['# Đối chiếu API frontend với tài liệu 26/10/2026','',f'Nguồn: `{args.pdf.name}` · 155 endpoint. File tham chiếu có SHA-256 `{contract["sha256"]}`. Không chỉnh PDF hoặc hợp đồng backend.','', 'Input bao gồm path/query/header/body; output bên dưới là kiểu của `data` trong envelope. JSON cấu trúc request/response và từ điển schema có trong [api-contract.json](api-contract.json). Các giá trị kiểu `string`, UUID mẫu là mô tả, không gửi nguyên văn để chạy API.','', '| API | Chức năng | Method / path | Input / schema | Output | Tích hợp |','|---|---|---|---|---|---|']
for e in endpoints:
    inputs='; '.join(f'{p["location"]}: {p["name"]} ({p["type"]})'+(' *' if p['required'] else '') for p in e['parameters']) or 'Không có tham số khai báo'
    if e['bodySchema']: inputs+='; '+e['bodySchema']
    output=e['responseContract'] or 'Xem callback riêng trong PDF'
    state='Service frontend' if e['frontend'] else 'Nhà cung cấp → backend, frontend không gọi'
    rows.append('| '+ ' | '.join(str(v).replace('|','\\|').replace('\n',' ') for v in [f'{e["number"]:03}',e['name'],f'`{e["method"]} {e["path"]}`',inputs,output,state])+' |')
Path('docs/API_INTEGRATION_AUDIT.md').write_text('\n'.join(rows)+'\n',encoding='utf-8')
print(f'Wrote {len(endpoints)} endpoints and {len(schemas)} distinct schema entries')
