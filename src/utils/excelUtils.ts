import * as XLSX from 'xlsx';
import { CaseItem, ColumnDefinition, User } from '../types/schema.ts';

export interface ExcelExportOptions {
  data: CaseItem[];
  columns: ColumnDefinition[];
  isRtl: boolean;
  users?: User[];
  sheetName?: string;
  fileName?: string;
}

export interface ParsedExcelResult {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

/**
 * Evaluates the display value of a cell for export, including computed columns and assignee names.
 */
export const getExportCellValue = (
  caseItem: CaseItem,
  column: ColumnDefinition,
  users?: User[],
  isRtl: boolean = true
): string | number => {
  // 1. Computed formula column
  if (column.type === 'computed' || column.isComputed) {
    if (column.id === 'remainingAmount') {
      const execAmount = Number(caseItem.customFields?.executionAmount ?? caseItem.claimAmount ?? 0);
      const transAmount = Number(caseItem.customFields?.transferredAmount ?? 0);
      return execAmount - transAmount;
    }
    return '';
  }

  // 2. Assignee / Responsible Person column
  const isAssignee =
    column.id === 'assigneeId' ||
    column.id === 'assignee' ||
    column.nameAr.includes('المسؤول') ||
    column.nameAr.includes('المحامي') ||
    column.nameAr.includes('المكلف') ||
    column.nameEn.toLowerCase().includes('assignee') ||
    column.nameEn.toLowerCase().includes('lawyer');

  if (isAssignee) {
    const rawAssignee =
      caseItem.customFields?.[column.id] ||
      caseItem.assigneeId ||
      caseItem.customFields?.assigneeId ||
      caseItem.customFields?.['الشخص المسؤول'] ||
      caseItem.customFields?.assignee;

    if (users && users.length > 0) {
      const target = String(rawAssignee || '').trim().toLowerCase();
      const foundUser = users.find((u) => {
        if (!target) return false;
        if (u.id.toLowerCase() === target) return true;
        if (u.email.toLowerCase() === target) return true;
        if (u.name.toLowerCase() === target) return true;
        if (u.nameEn?.toLowerCase() === target) return true;
        const cleanName = u.name.replace(/^(المستشار|أستاذ|أ\.|\/|\s)+/g, '').trim().toLowerCase();
        const cleanTarget = target.replace(/^(المستشار|أستاذ|أ\.|\/|\s)+/g, '').trim().toLowerCase();
        if (cleanName && cleanTarget && (cleanName === cleanTarget || cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName))) return true;
        return false;
      });

      if (foundUser) {
        return isRtl ? foundUser.name : (foundUser.nameEn || foundUser.name);
      }
    }

    if (rawAssignee) return String(rawAssignee);
    const defaultUser = users?.[0];
    return defaultUser ? (isRtl ? defaultUser.name : defaultUser.nameEn) : (isRtl ? 'المستشار / محمد العتيبي' : 'Adv. Mohammed Al-Otaibi');
  }

  // 3. Direct property on caseItem
  if (column.id in caseItem) {
    const val = (caseItem as any)[column.id];
    if (val === undefined || val === null) return '';
    return typeof val === 'number' ? val : String(val);
  }

  // 4. Custom field on caseItem
  const customVal = caseItem.customFields?.[column.id];
  if (customVal === undefined || customVal === null) return '';
  return typeof customVal === 'number' ? customVal : String(customVal);
};

/**
 * Export table data to an XLSX file using SheetJS (xlsx).
 * Strictly preserves current column order, headers, and filtered rows.
 */
export const exportTableToExcel = ({
  data,
  columns,
  isRtl,
  users,
  sheetName = 'Elite_Cases',
  fileName,
}: ExcelExportOptions) => {
  // 1. Prepare header row
  const headers = columns.map((col) => (isRtl ? col.nameAr : col.nameEn));

  // 2. Prepare data rows
  const rows = data.map((item) => {
    return columns.map((col) => getExportCellValue(item, col, users, isRtl));
  });

  // 3. Combine headers + rows
  const aoaData = [headers, ...rows];

  // 4. Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Set RTL view on worksheet if Arabic
  if (isRtl) {
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });
  }

  // Calculate column widths based on contents and column def
  const colWidths = columns.map((col, idx) => {
    const headerLen = String(headers[idx] || '').length;
    const maxDataLen = rows.reduce((max, row) => Math.max(max, String(row[idx] ?? '').length), 0);
    const charWidth = Math.max(headerLen * 1.5, maxDataLen, 12);
    return { wch: Math.min(Math.max(charWidth, 14), 45) };
  });
  worksheet['!cols'] = colWidths;

  // 5. Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  const safeSheetName = sheetName.replace(/[:\\/?*[\]]/g, '').slice(0, 31) || 'Cases';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // 6. Generate filename and trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFileName = fileName || `Elite_${safeSheetName}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, finalFileName);
};

/**
 * Parse an uploaded .xlsx, .xls, or .csv file.
 */
export const parseExcelFile = async (file: File): Promise<ParsedExcelResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('الملف فارغ أو لا يحتوي على أوراق عمل (Sheet is empty)');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse as Array of Arrays
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

  if (!rawData || rawData.length === 0) {
    throw new Error('لم يتم العثور على بيانات داخل الملف');
  }

  // Find first non-empty row as headers
  let headerRowIndex = 0;
  while (headerRowIndex < rawData.length && rawData[headerRowIndex].every((c) => !c || String(c).trim() === '')) {
    headerRowIndex++;
  }

  if (headerRowIndex >= rawData.length) {
    throw new Error('الملف لا يحتوي على رؤوس أعمدة صالحة');
  }

  const rawHeaders = rawData[headerRowIndex].map((h) => String(h || '').trim());
  const dataRows = rawData
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell !== '' && cell !== null && cell !== undefined));

  return {
    headers: rawHeaders,
    rows: dataRows,
    totalRows: dataRows.length,
  };
};

/**
 * Automatically map system columns to Excel headers using fuzzy matching.
 */
export const autoMapColumns = (
  excelHeaders: string[],
  systemColumns: ColumnDefinition[]
): Record<string, string> => {
  const mapping: Record<string, string> = {};

  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF]/g, '')
      .trim();

  systemColumns.forEach((sysCol) => {
    // Skip computed columns from direct input mapping
    if (sysCol.type === 'computed' || sysCol.isComputed) return;

    const sysArClean = clean(sysCol.nameAr);
    const sysEnClean = clean(sysCol.nameEn);
    const sysIdClean = clean(sysCol.id);

    // Exact or best match
    const foundHeader = excelHeaders.find((excelCol) => {
      const excelClean = clean(excelCol);
      if (!excelClean) return false;
      return (
        excelClean === sysArClean ||
        excelClean === sysEnClean ||
        excelClean === sysIdClean ||
        excelClean.includes(sysArClean) ||
        sysArClean.includes(excelClean) ||
        excelClean.includes(sysEnClean) ||
        sysEnClean.includes(excelClean)
      );
    });

    if (foundHeader) {
      mapping[sysCol.id] = foundHeader;
    }
  });

  return mapping;
};
