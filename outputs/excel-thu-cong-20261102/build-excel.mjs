import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const dir = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(await fs.readFile(path.join(dir, 'source-data.json'), 'utf8'));
const green = '#1B4D2E', pale = '#EAF2E5', ink = '#234039', muted = '#64756B';
const headers = {
  products: ['Tên sản phẩm','Loại sản phẩm (tên hoặc mã)','Quy cách đóng gói','Khối lượng','Đơn vị tính','Giá bán','Giá trước giảm','Mô tả','Xuất xứ (tên hoặc mã)','Mã vạch'],
  purchase: ['Mã hàng','Tên sản phẩm','Quy cách đóng gói','Số lượng đặt','Giá nhập'],
  receipt: ['Mã hàng','Tên sản phẩm','Quy cách đóng gói','Còn được nhận (tham khảo)','Số lượng đạt','Số lượng bị loại','Lý do chênh lệch','Mã lô','Ngày sản xuất','Hạn sử dụng','Thông tin nguồn gốc'],
};
const newProducts = [
  ['Củ dền đỏ','LSP04','Gói 500 g',500,'g',35000,40000,'Củ dền đỏ đóng gói tiện dùng. Bảo quản ngăn mát, rửa sạch trước khi chế biến.','XX01',''],
  ['Củ dền đỏ','LSP04','Gói 1 kg',1,'kg',65000,75000,'Củ dền đỏ đóng gói tiện dùng. Bảo quản ngăn mát, rửa sạch trước khi chế biến.','XX01',''],
  ['Bắp cải tím','LSP03','Gói 500 g',500,'g',30000,35000,'Bắp cải tím dùng cho salad và các món xào. Bảo quản ngăn mát.','XX01',''],
  ['Khoai lang Nhật','LSP04','Túi 1 kg',1,'kg',40000,45000,'Khoai lang Nhật dùng để hấp, nướng hoặc nấu chè. Bảo quản nơi khô thoáng.','XX01',''],
  ['Cam sành','LSP05','Túi 1 kg',1,'kg',45000,50000,'Cam sành dùng ăn tươi hoặc ép nước. Rửa sạch trước khi sử dụng.','XX01',''],
  ['Đậu đen xanh lòng','LSP09','Túi 500 g',500,'g',38000,42000,'Đậu đen xanh lòng dùng nấu chè và chế biến món ăn. Bảo quản kín, khô ráo.','XX01',''],
];
const requested = [['SP03-01',10],['SP05-01',10],['SP07-01',10],['SP09-01',6],['SP14-01',6],['SP22-01',6]];
const selected = requested.map(([sku, qty]) => {
  const p = source.products.find(p => p.sku === sku);
  if (!p || p.supplier_code !== 'NCC01' || !(p.last_purchase_price > 0)) throw new Error(`Nguồn cung hoặc giá nhập không hợp lệ: ${sku}`);
  return {...p, quantity: qty};
});
const supplierName = selected[0].supplier_name;
const total = selected.reduce((s,p) => s + p.quantity * p.last_purchase_price,0);
const money = n => new Intl.NumberFormat('vi-VN').format(n) + ' đồng';
// Numeric Excel dates preserve compatibility with the existing import reader.
const excelDate = iso => (Date.parse(iso) - Date.UTC(1899,11,30)) / 86400000;
const production = excelDate('2026-11-02T00:00:00.000Z');
const expiry = excelDate('2026-11-12T00:00:00.000Z');
const purchaseRows = selected.map(p => [p.sku,p.product_name,p.variant_name,p.quantity,p.last_purchase_price]);
const receiptRows = selected.map(p => [p.sku,p.product_name,p.variant_name,p.quantity,p.quantity,0,'',`LO-02112026-${p.sku}-01`,production,expiry,[p.origin_name,p.producer_name].filter(Boolean).join(' - ')]);
for (const row of newProducts) {
  if (source.existingNames.some(n => n.trim().toLocaleLowerCase('vi') === row[0].toLocaleLowerCase('vi'))) throw new Error(`Tên sản phẩm đã có: ${row[0]}`);
  if (!source.categories.some(c => c.code === row[1]) || !source.origins.some(o => o.code === row[8])) throw new Error('Loại hoặc xuất xứ chưa có trong hệ thống');
}
for (const row of receiptRows) if (source.existingBatches.includes(row[7])) throw new Error(`Mã lô đã tồn tại: ${row[7]}`);
if (new Set(selected.map(p => p.sku)).size !== selected.length) throw new Error('Mã hàng bị trùng');

function table(wb, name, labels, rows, widths, {numbers=[], dates=[], text=[], height=42}={}) {
  const sheet = wb.worksheets.add(name);
  sheet.showGridLines = false;
  sheet.tabColor = name === 'Data' ? green : '#A3C1AD';
  const matrix = [labels,...rows];
  const area = sheet.getRangeByIndexes(0,0,matrix.length,labels.length);
  area.values = matrix;
  area.format.font = {name:'Arial',size:11,color:ink};
  area.format.verticalAlignment = 'center';
  area.format.wrapText = true;
  area.format.rowHeight = height;
  area.format.borders = {insideHorizontal:{style:'thin',color:'#DEE6DD'}};
  const top = sheet.getRangeByIndexes(0,0,1,labels.length);
  top.format.fill = green;
  top.format.font = {name:'Arial',size:11,bold:true,color:'#FFFFFF'};
  top.format.rowHeight = 48;
  widths.forEach((width,c) => sheet.getRangeByIndexes(0,c,matrix.length,1).format.columnWidth = width);
  rows.forEach((_,r) => { if (r % 2 === 0) sheet.getRangeByIndexes(r+1,0,1,labels.length).format.fill = pale; });
  for (const c of numbers) {
    const range=sheet.getRangeByIndexes(1,c,rows.length,1);
      range.setNumberFormat('#,##0');
    range.format.horizontalAlignment='right';
  }
  for (const c of text) sheet.getRangeByIndexes(1,c,rows.length,1).setNumberFormat('@');
  for (const c of dates) {
    const range=sheet.getRangeByIndexes(1,c,rows.length,1);
    range.setNumberFormat('dd-mm-yyyy');
    range.format.horizontalAlignment='center';
  }
  sheet.freezePanes.freezeRows(1);
  return {sheet,rows:matrix.length,cols:labels.length};
}
function guide(wb, rows) {
  return table(wb,'HuongDan',['Thao tác','Nội dung'],rows,[28,100],{height:72});
}
function info(wb,rows) {
  return table(wb,'ThongTin',['Thông tin','Giá trị'],rows,[27,74],{height:44});
}
function packing(wb) {
  return table(wb,'QuyCach',['Mã hàng','Tên sản phẩm','Đóng gói','Khối lượng','Đơn vị'],selected.map(p=>[p.sku,p.product_name,p.variant_name,p.net_quantity,p.unit_id]),[16,43,18,17,12],{numbers:[3],text:[0],height:39});
}
const files=[];
async function finish(wb,name,sheets) {
  wb.recalculate();
  const check=await wb.inspect({kind:'table',range:`Data!A1:${String.fromCharCode(64+headers[name === '01-san-pham-moi.xlsx'?'products':name === '02-don-mua-NCC01.xlsx'?'purchase':'receipt'].length)}3`,include:'values,formulas',tableMaxRows:3,tableMaxCols:11,maxChars:1800});
  console.log(name,check.ndjson);
  console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:10},maxChars:500})).ndjson);
  for (const {sheet,rows,cols} of sheets) {
    const blocks = sheet.name==='Data' && cols>6 ? [[0,6],[6,cols-6]] : [[0,cols]];
    for (const [start,count] of blocks) {
      const from=String.fromCharCode(65+start),to=String.fromCharCode(64+start+count);
      const image=await wb.render({sheetName:sheet.name,range:`${from}1:${to}${rows}`,scale:1,format:'png'});
      await fs.writeFile(path.join(dir,`${name.slice(0,-5)}-${sheet.name}-${from}.png`),new Uint8Array(await image.arrayBuffer()));
    }
  }
  await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(dir,name));
  files.push(name);
}

{
 const wb=Workbook.create();
 const sheets=[table(wb,'Data',headers.products,newProducts,[29,27,23,15,16,18,20,62,27,18],{numbers:[3,5,6],text:[1,4,8,9],height:62})];
 sheets.push(guide(wb,[
  ['1. Chọn chức năng','Quản trị > Sản phẩm > Nhập Excel. Chọn file 01-san-pham-moi.xlsx.'],
  ['2. Kiểm tra và nhập','File có 5 sản phẩm mới, 6 quy cách. Loại sản phẩm và xuất xứ đã điền đủ. Kiểm tra danh sách rồi xác nhận nhập.'],
  ['3. Kết quả cần thấy','5 sản phẩm được tạo ở trạng thái Bản nháp, có mã sản phẩm và mã hàng tự động. Chưa có tồn kho hoặc hình ảnh. Không nhập lại file sau khi đã thành công.'],
  ['4. Kiểm tra quy cách','Củ dền đỏ có 2 quy cách: Gói 500 g và Gói 1 kg. Các dòng cùng tên thuộc một sản phẩm.'],
  ['5. Nguồn cung','XX01 là Nông sản Việt Nam, đang liên kết với ' + supplierName + ' (NCC01). Không gán chứng nhận cho sản phẩm mới.'],
  ['6. Giá và thông tin','Tên, mô tả, quy cách và giá trong file là dữ liệu nhập mới được chuẩn bị cho lần kiểm tra thủ công này. Giá trước giảm lớn hơn giá bán. Mã vạch để trống vì chưa có mã thực tế.'],
  ['7. Đơn mua đi kèm','File 02 dùng các sản phẩm đã có sẵn để kiểm tra ngay. Không phụ thuộc mã vừa được cấp cho 5 sản phẩm mới.'],
  ['Nguồn đối chiếu','Danh mục, xuất xứ và tên sản phẩm hiện có được đọc từ dữ liệu cửa hàng ngày 02-11-2026. Giữ nguyên tiêu đề, thứ tự cột và tên sheet Data.'],
 ]));
 sheets.push(table(wb,'LoaiSanPham',['Mã loại sản phẩm','Tên loại sản phẩm'],source.categories.map(c=>[c.code,c.name]),[25,40],{text:[0],height:32}));
 sheets.push(table(wb,'XuatXu',['Mã xuất xứ','Tên xuất xứ','Nhà cung cấp'],source.origins.map(o=>[o.code,o.name,`${o.supplier_code} - ${o.supplier_name}`]),[21,35,65],{text:[0],height:43}));
 await finish(wb,'01-san-pham-moi.xlsx',sheets);
}
{
 const wb=Workbook.create();
 const sheets=[table(wb,'Data',headers.purchase,purchaseRows,[17,43,25,19,22],{numbers:[3,4],text:[0],height:48})];
 sheets.push(info(wb,[['Mã nhà cung cấp','NCC01'],['Nhà cung cấp',supplierName]]));
 sheets.push(guide(wb,[
  ['1. Chọn nhà cung cấp','Quản trị > Kho vận & Mua hàng > Đơn mua > Lập đơn > Nhập từ Excel. Chọn NCC01 - '+supplierName+'.'],
  ['2. Ngày giao dự kiến','Chọn ngày giao dự kiến trên màn hình. Dùng ngày hôm nay hoặc ngày tương lai. Không cần thêm ngày vào Excel.'],
  ['3. Chọn file','Chọn 02-don-mua-NCC01.xlsx. File đã điền 6 mã hàng, tên sản phẩm, quy cách, số lượng và giá nhập.'],
  ['4. Đối chiếu','Tổng số lượng: 48 đơn vị đóng gói. Tổng tiền mua dự kiến: '+money(total)+'. Khối lượng mỗi đơn vị nằm trong sheet QuyCach.'],
  ['5. Tạo và duyệt','Xác nhận tạo đơn chờ duyệt. Ghi nhận mã đơn vừa tạo, sau đó vào danh sách đơn mua để duyệt. Tạo và duyệt đơn mua chưa làm tăng tồn kho.'],
  ['6. Nhập hàng','Sau khi đơn được duyệt, dùng file 03-phieu-nhap-NCC01.xlsx cho chính đơn này. Giữ nguyên 6 dòng và số lượng để hai file khớp nhau.'],
  ['Nguồn đối chiếu','Sản phẩm, nhà cung cấp và giá nhập được lấy từ dữ liệu cửa hàng ngày 02-11-2026. Giá nhập là giá của đơn mua gần nhất đang lưu.'],
 ]));
 sheets.push(packing(wb));
 await finish(wb,'02-don-mua-NCC01.xlsx',sheets);
}
{
 const wb=Workbook.create();
 const sheets=[table(wb,'Data',headers.receipt,receiptRows,[17,43,24,24,17,19,33,35,21,21,53],{numbers:[3,4,5],dates:[8,9],text:[0,7],height:58})];
 sheets.push(info(wb,[['Nhà cung cấp',supplierName],['Dùng với','Đơn mới tạo từ file 02-don-mua-NCC01.xlsx, sau khi đã duyệt'],['Ngày chuẩn bị','02-11-2026']]));
 sheets.push(guide(wb,[
  ['1. Điều kiện','Tạo và duyệt đơn mua bằng file 02 trước. Hai đơn mua cũ hiện có đã nhập kho xong nên không dùng lại cho phiếu này.'],
  ['2. Chọn đơn mua','Quản trị > Kho vận & Mua hàng > Phiếu nhập > Lập phiếu > Nhập từ Excel. Chọn đúng đơn NCC01 vừa tạo từ file 02. Mã đơn được lấy theo lựa chọn của bạn, không cần nhập vào Excel.'],
  ['3. Chọn file','Chọn 03-phieu-nhap-NCC01.xlsx. File có đủ 6 mặt hàng và số lượng đúng bằng đơn mua đi kèm: 48 đơn vị đóng gói, tất cả đạt, không có hàng bị loại.'],
  ['4. Kiểm tra ngày','Ngày sản xuất 02-11-2026, hạn dùng 12-11-2026 là dữ liệu điền sẵn để kiểm tra thao tác, không phải hạn dùng do nhà cung cấp công bố. Nếu kiểm tra sau ngày 12-11-2026, cập nhật ngày hợp lệ trước khi nhập.'],
  ['5. Lưu và gửi duyệt','Xác nhận nhập để lưu phiếu nháp. Mở phiếu, kiểm tra rồi gửi duyệt. Tồn kho chưa tăng ở các bước này.'],
  ['6. Duyệt phiếu','Dùng tài khoản có quyền duyệt phiếu nhập để duyệt. Khi duyệt thành công, tồn của từng mã hàng tăng đúng số lượng đạt: 10, 10, 10, 6, 6 và 6.'],
  ['7. Tránh nhập nhầm','File này dùng cho một phiếu nhập mới, chưa có phiếu nào trên đơn mua vừa tạo. Không dùng cho đơn khác, không nhập lại sau khi đã thành công.'],
  ['Nguồn đối chiếu','Tên, mã hàng, quy cách và nguồn gốc lấy từ dữ liệu cửa hàng ngày 02-11-2026. Mã lô trong file là mã mới, đã đối chiếu không trùng tại thời điểm tạo file.'],
 ]));
 sheets.push(packing(wb));
 await finish(wb,'03-phieu-nhap-NCC01.xlsx',sheets);
}

await fs.writeFile(path.join(dir,'HUONG-DAN.txt'),[
 'BỘ EXCEL KIỂM TRA THỦ CÔNG NGÀY 02-11-2026',
 '',
 '01-san-pham-moi.xlsx: 5 sản phẩm mới, 6 quy cách. Nhập tại Sản phẩm > Nhập Excel.',
 '02-don-mua-NCC01.xlsx: 6 sản phẩm đã có, 48 đơn vị đóng gói, tổng '+money(total)+'. Chọn NCC01 và tạo đơn mua, sau đó duyệt.',
 '03-phieu-nhap-NCC01.xlsx: chọn chính đơn vừa tạo và đã duyệt từ file 02, sau đó nhập file, gửi duyệt và duyệt phiếu.',
 '',
 'Không cần gõ mã đơn mua vào Excel. Chọn đúng đơn trên màn hình trước khi tải file 03 lên.',
 'Sheet Data là dữ liệu để nhập; HuongDan là hướng dẫn. Sheet QuyCach ghi rõ khối lượng từng mã hàng.',
 'File 01 kiểm tra thêm mới độc lập. File 02 và 03 dùng sản phẩm hiện có để không phải đoán mã mới của file 01.',
 'Ngày sản xuất 02-11-2026, hạn sử dụng 12-11-2026 trong file 03 là giá trị dùng kiểm tra thao tác. Đối chiếu ngày thực tế nếu nhập hàng thật.',
 'Chưa nhập, tạo đơn, tạo phiếu, duyệt hoặc thay đổi dữ liệu nào trên hệ thống.',
 '',
 'Tên và mã hàng được đối chiếu tại thời điểm tạo file. Nếu bạn đã sửa sản phẩm hoặc đổi nhà cung cấp sau đó, cần đối chiếu lại.',
].join('\r\n'),'utf8');
console.log(JSON.stringify({files,total,units:48,eligibleOrders:source.eligibleOrderCount}));
