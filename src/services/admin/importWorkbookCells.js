import JSZip from 'jszip';
import { validateXlsxArchive } from '@/lib/xlsxArchive';
import { validateImportFile } from './fileService';

const spreadsheetNS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const officeRelNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const packageRelNS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const elements = (node, name, namespace = spreadsheetNS) => [...node.getElementsByTagNameNS(namespace, name)];
const children = (node, name) => [...node.children].filter((child) => child.namespaceURI === spreadsheetNS && child.localName === name);
const columnNumber = (name) => [...name].reduce((number, char) => number * 26 + char.charCodeAt(0) - 64, 0);

function xmlDocument(source) {
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('Không nhận file Excel có khai báo thực thể XML.');
  const document = new DOMParser().parseFromString(source, 'application/xml');
  if (document.getElementsByTagNameNS('*', 'parsererror').length) throw new Error('Cấu trúc XML trong file Excel bị lỗi.');
  return document;
}

function partPath(target) {
  if (!target || /[\\?#]/.test(target) || /^[a-z][a-z0-9+.-]*:/i.test(target)) throw new Error('Đường dẫn trang Excel không hợp lệ.');
  const segments = [];
  for (const segment of (target.startsWith('/') ? target.slice(1) : `xl/${target}`).split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!segments.length) throw new Error('Đường dẫn trang Excel không hợp lệ.');
      segments.pop();
    } else segments.push(segment);
  }
  return segments.join('/');
}

// Work with OOXML namespaces rather than literal tag names such as "worksheet".
// Only the Data worksheet XML is replaced; dates, styles, other sheets and
// workbook relationships remain in their original ZIP entries.
export async function openImportWorkbookCells(file, headers, maxRows) {
  validateImportFile(file);
  const buffer = await file.arrayBuffer();
  validateXlsxArchive(buffer);
  let zip;
  try { zip = await JSZip.loadAsync(buffer, { checkCRC32: true }); }
  catch { throw new Error('Không mở được cấu trúc nén của file .xlsx. Hãy lưu lại file bằng Excel rồi chọn lại.'); }
  async function readXml(path) {
    const entry = zip.file(path);
    if (!entry) throw new Error(`File Excel thiếu thành phần ${path}. Hãy dùng file mẫu của backend.`);
    return xmlDocument(await entry.async('string'));
  }
  const workbook = await readXml('xl/workbook.xml');
  const sheetInfo = elements(workbook, 'sheet').find((sheet) => sheet.getAttribute('name') === 'Data');
  if (!sheetInfo) throw new Error('Không tìm thấy sheet Data. Hãy dùng đúng file Excel mẫu của backend.');
  const relationshipId = sheetInfo.getAttributeNS(officeRelNS, 'id');
  const relationships = await readXml('xl/_rels/workbook.xml.rels');
  const relations = elements(relationships, 'Relationship', packageRelNS);
  const sheetRelation = relations.find((relation) => relation.getAttribute('Id') === relationshipId);
  if (!sheetRelation || !sheetRelation.getAttribute('Type').endsWith('/worksheet') || sheetRelation.getAttribute('TargetMode') === 'External') throw new Error('Liên kết sheet Data trong file Excel không hợp lệ.');
  const sheetPath = partPath(sheetRelation.getAttribute('Target'));
  const sheet = await readXml(sheetPath);
  if (sheet.documentElement.namespaceURI !== spreadsheetNS || sheet.documentElement.localName !== 'worksheet') throw new Error('Sheet Data không đúng cấu trúc Excel được hỗ trợ.');
  const data = children(sheet.documentElement, 'sheetData')[0];
  if (!data) throw new Error('Sheet Data chưa có dữ liệu.');
  const rows = new Map(), cells = new Map();
  for (const row of children(data, 'row')) {
    const number = Number(row.getAttribute('r'));
    if (!Number.isInteger(number) || number < 1 || number > maxRows + 1 || rows.has(number)) throw new Error('Sheet Data vượt số dòng cho phép hoặc có số dòng không hợp lệ.');
    rows.set(number, row);
    for (const cell of children(row, 'c')) {
      const address = cell.getAttribute('r');
      const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(address || '');
      if (!match || Number(match[2]) !== number || columnNumber(match[1]) > headers.length || cells.has(address)) throw new Error('Sheet Data có địa chỉ ô không hợp lệ hoặc vượt cấu trúc mẫu.');
      cells.set(address, cell);
    }
  }
  let strings = [];
  const stringsRelation = relations.find((relation) => relation.getAttribute('Type').endsWith('/sharedStrings'));
  const stringsPath = stringsRelation && stringsRelation.getAttribute('TargetMode') !== 'External' ? partPath(stringsRelation.getAttribute('Target')) : 'xl/sharedStrings.xml';
  const richText = (node) => [...node.children].map((child) => child.localName === 't' ? child.textContent : child.localName === 'r' ? children(child, 't').map((text) => text.textContent).join('') : '').join('');
  if (zip.file(stringsPath)) strings = elements(await readXml(stringsPath), 'si').map(richText);
  function text(address) {
    const cell = cells.get(address);
    if (!cell) return '';
    if (children(cell, 'f').length) throw new Error(`Ô ${address} là công thức. Hãy dán giá trị rồi kiểm tra lại file.`);
    const type = cell.getAttribute('t');
    const value = children(cell, 'v')[0]?.textContent ?? '';
    if (type === 's') {
      if (!/^\d+$/.test(value) || strings[Number(value)] == null) throw new Error(`Ô ${address} có tham chiếu văn bản không hợp lệ.`);
      return strings[Number(value)];
    }
    if (type === 'inlineStr') return children(cell, 'is').map(richText).join('');
    return value;
  }
  // The supported import templates have fewer than 26 columns.
  if (headers.some((header, index) => text(`${String.fromCharCode(65 + index)}1`).trim() !== header)) throw new Error('Tên hoặc thứ tự cột trong sheet Data khác file mẫu của backend.');
  const makeElement = (name) => sheet.createElementNS(spreadsheetNS, sheet.documentElement.prefix ? `${sheet.documentElement.prefix}:${name}` : name);
  return {
    text,
    fillBlank(address, value) {
      const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(address);
      const row = match && rows.get(Number(match[2]));
      if (!row || columnNumber(match[1]) > headers.length) throw new Error('Dòng cần bổ sung không khớp bản xem trước.');
      if (text(address).trim()) throw new Error(`Ô ${address} đang có dữ liệu. Hệ thống chỉ bổ sung ô trống.`);
      let cell = cells.get(address);
      if (!cell) {
        cell = makeElement('c'); cell.setAttribute('r', address);
        const next = children(row, 'c').find((item) => columnNumber(/^([A-Z]+)/.exec(item.getAttribute('r'))[1]) > columnNumber(match[1]));
        row.insertBefore(cell, next || null); cells.set(address, cell);
      }
      for (const child of [...children(cell, 'v'), ...children(cell, 'is')]) child.remove();
      cell.setAttribute('t', 'inlineStr');
      const inline = makeElement('is'), content = makeElement('t');
      content.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      content.textContent = String(value); inline.append(content); cell.insertBefore(inline, cell.firstChild);
    },
    async save(suffix) {
      zip.file(sheetPath, new XMLSerializer().serializeToString(sheet));
      const output = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
      const name = file.name.replace(/\.xlsx$/i, '').replace(new RegExp(`${suffix}$`), '') + suffix + '.xlsx';
      const prepared = new File([output], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      validateImportFile(prepared);
      return prepared;
    },
  };
}
