import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Calendar,
  AlertCircle,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  Download,
  Filter,
  Plus,
  Lock,
  CheckCircle,
  Clock,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Users,
  Building,
  Check,
  GripVertical,
  Pencil,
  FileSpreadsheet,
  PlusCircle,
  Calculator,
  RefreshCw,
  X,
  Upload,
  Bell,
  Mail,
  FileDown,
  UserCheck,
  RotateCcw,
  Copy,
  ClipboardPaste,
  Sliders,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  flexRender,
} from '@tanstack/react-table';
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { useApp } from '../context/AppContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CATEGORY_MAP } from '../data/categories.ts';
import { CaseItem, CaseStatus, ColumnDefinition } from '../types/schema.ts';
import { exportTableToExcel, parseExcelFile, ParsedExcelResult } from '../utils/excelUtils.ts';
import { ExcelImportModal } from './ExcelImportModal.tsx';
import { EditColumnModal } from './EditColumnModal.tsx';
import { AgencyFileCell } from './AgencyFileCell.tsx';
import { FileCell } from './FileCell.tsx';
import { dispatchEmailAlert, DEFAULT_USER_EMAIL } from '../utils/reminderService.ts';

type SortDirection = 'asc' | 'desc';

interface DraggableHeaderCellProps {
  col: ColumnDefinition;
  width?: number;
  onResizeStart?: (colId: string, initialWidth: number, e: React.MouseEvent | React.TouchEvent) => void;
  isAdmin: boolean;
  isEditingThis: boolean;
  editingColName: string;
  setEditingColName: (val: string) => void;
  handleStartRename: (col: ColumnDefinition, e: React.MouseEvent) => void;
  handleSaveRename: (colId: string) => void;
  setEditingColId: (id: string | null) => void;
  onOpenEditModal: (col: ColumnDefinition) => void;
  onCopyColumn: (col: ColumnDefinition) => void;
  onDeleteColumn: (colId: string) => void;
  deleteColumn: (catId: string, colId: string) => void;
  currentCategoryKey: string;
  isRtl: boolean;
  sortField: string;
  sortDirection: SortDirection;
  handleSort: (colId: string) => void;
}

const DraggableHeaderCell: React.FC<DraggableHeaderCellProps> = ({
  col,
  width,
  onResizeStart,
  isAdmin,
  isEditingThis,
  editingColName,
  setEditingColName,
  handleStartRename,
  handleSaveRename,
  setEditingColId,
  onOpenEditModal,
  onCopyColumn,
  onDeleteColumn,
  deleteColumn,
  currentCategoryKey,
  isRtl,
  sortField,
  sortDirection,
  handleSort,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: col.id,
    disabled: false,
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const effectiveWidth = width || col.width;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 30 : 1,
    width: effectiveWidth ? `${effectiveWidth}px` : undefined,
    minWidth: effectiveWidth ? `${effectiveWidth}px` : undefined,
    maxWidth: effectiveWidth ? `${effectiveWidth}px` : undefined,
    boxSizing: 'border-box',
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`py-3 px-3.5 text-start transition-all relative group select-none hover:bg-slate-100 dark:hover:bg-slate-800 ${
        isDragging ? 'bg-indigo-100 dark:bg-indigo-950 border-2 border-indigo-500 rounded-lg shadow-lg' : ''
      } whitespace-nowrap`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div
          className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-slate-900 dark:hover:text-white flex-1"
          onClick={() => handleSort(col.id)}
        >
          {/* dnd-kit Drag Handle for All Users */}
          <span
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 -ms-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title={isRtl ? 'اسحب لإعادة ترتيب العمود' : 'Drag to reorder column'}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>

          {/* Editable Header Input or Title */}
          {isEditingThis ? (
            <input
              type="text"
              autoFocus
              value={editingColName}
              onChange={(e) => setEditingColName(e.target.value)}
              onBlur={() => handleSaveRename(col.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(col.id);
                if (e.key === 'Escape') setEditingColId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-xs bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded text-slate-900 dark:text-white focus:outline-none w-full shadow-xs"
            />
          ) : (
            <span
              className="truncate font-semibold text-xs tracking-tight"
              title={isRtl ? col.nameAr : col.nameEn}
            >
              {isRtl ? col.nameAr : col.nameEn}
            </span>
          )}

          {col.type === 'computed' && (
            <span title="Computed Formula (مبلغ التنفيذ - المبالغ المحولة)">
              <Calculator className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </span>
          )}

          {col.hasEmailReminder && (
            <span
              className="inline-flex items-center text-indigo-500 hover:text-indigo-700"
              title={
                isRtl
                  ? `تنبيه بريدي نشط: قبل ${col.reminderMinutesBefore || 30} دقيقة إلى ${col.reminderEmail || DEFAULT_USER_EMAIL}`
                  : `Email Alert: ${col.reminderMinutesBefore || 30}m before to ${col.reminderEmail || DEFAULT_USER_EMAIL}`
              }
            >
              <Bell className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            </span>
          )}

          {/* Sort Indicator */}
          {sortField === col.id && (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            )
          )}
        </div>

        {/* Column Settings Menu (Three Dots: Edit, Rename, Copy, Delete) */}
        {!isEditingThis && (
          <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isMenuOpen
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
              title={isRtl ? 'خيارات العمود (تعديل، حذف)' : 'Column Options (Edit, Delete)'}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Settings Dropdown Popover */}
            {isMenuOpen && (
              <div
                className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-full mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs font-normal animate-in fade-in zoom-in-95 duration-100`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-semibold truncate flex items-center justify-between">
                  <span className="truncate">{isRtl ? col.nameAr : col.nameEn}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {col.type}
                  </span>
                </div>

                {/* 1. Edit Column / Change Type (تعديل العمود) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenEditModal(col);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{isRtl ? 'تعديل العمود' : 'Edit Column'}</span>
                </button>

                {/* 2. Quick Rename (إعادة تسمية) */}
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    handleStartRename(col, e);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{isRtl ? 'إعادة تسمية' : 'Rename'}</span>
                </button>

                {/* 3. Copy Column (نسخ العامود) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCopyColumn(col);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 cursor-pointer border-t border-slate-100 dark:border-slate-800/80 font-medium"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isRtl ? 'نسخ العامود' : 'Copy Column'}</span>
                </button>

                {/* 4. Delete Column (حذف العامود) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDeleteColumn(col.id);
                  }}
                  className="w-full text-start px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer border-t border-slate-100 dark:border-slate-800/80 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isRtl ? 'حذف العامود' : 'Delete Column'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column Resize Handle */}
      <div
        onMouseDown={(e) => onResizeStart?.(col.id, effectiveWidth || 150, e)}
        onTouchStart={(e) => onResizeStart?.(col.id, effectiveWidth || 150, e)}
        className={`absolute ${
          isRtl ? 'left-0' : 'right-0'
        } top-0 h-full w-2 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors z-30 select-none touch-none bg-transparent`}
        style={{ userSelect: 'none', touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
        title={isRtl ? 'اسحب لتغيير عرض العامود' : 'Drag to resize column'}
      >
        <div className={`h-full w-[2px] mx-auto ${isRtl ? 'ml-0' : 'mr-0'} bg-slate-300 dark:bg-slate-700 hover:bg-blue-500`} />
      </div>
    </th>
  );
};

export const CaseTableView: React.FC = () => {
  const {
    cases,
    categories,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    searchQuery,
    statusFilter,
    setStatusFilter,
    courtFilter,
    setCourtFilter,
    assigneeFilter,
    setAssigneeFilter,
    filterAssignedToMe,
    filterUrgentOnly,
    filterExpertOnly,
    setSelectedCaseId,
    setIsCreateModalOpen,
    setIsEditModalOpen,
    setIsAddColumnModalOpen,
    setIsGoogleSheetsModalOpen,
    googleSheetsConfig,
    syncToGoogleSheets,
    getActiveColumns,
    reorderColumns,
    renameColumn,
    deleteColumn,
    revertToDefaultColumns,
    resetToInitialData,
    copiedColumn,
    copyColumn,
    pasteColumn,
    insertRow,
    updateCase,
    updateCaseField,
    deleteCase,
    showToast,
    isRtl,
    t,
    pageColumns,
  } = useApp();

  const { currentUser, users, canEditCase, canDeleteCase, canCreateCase, isAdmin } = useAuth();

  // 1. Column Deletion State & Schema Management (React useState for explicit instant state mutation)
  const [columns, setColumns] = useState<ColumnDefinition[]>(() => getActiveColumns());
  const activeColumns = columns;
  const currentCategoryKey = selectedCategory || 'all';

  // Synchronize columns when active category or context pageColumns updates
  useEffect(() => {
    setColumns(getActiveColumns());
  }, [selectedCategory, pageColumns]);

  // Explicit functional state mutation for instant UI removal of deleted column
  const handleDeleteColumn = (columnIdToRemove: string) => {
    setColumns((cols) =>
      cols.filter(
        (c) =>
          c.id !== columnIdToRemove &&
          (c as any).accessorKey !== columnIdToRemove
      )
    );
    deleteColumn(currentCategoryKey, columnIdToRemove);
  };

  // 2. Interactive Column Resizing State & Handlers
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const handleResizeStart = (
    colId: string,
    initialWidth: number,
    startEvent: React.MouseEvent | React.TouchEvent
  ) => {
    startEvent.preventDefault();
    startEvent.stopPropagation();

    const clientX = 'touches' in startEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startW = columnWidths[colId] || initialWidth || 150;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const delta = isRtl ? (clientX - currentX) : (currentX - clientX);
      const newWidth = Math.max(70, startW + delta);
      setColumnWidths((prev) => ({
        ...prev,
        [colId]: newWidth,
      }));
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  // Drag and Drop Header sensors (available to all users via dnd-kit)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex((col) => col.id === active.id);
    const newIndex = columns.findIndex((col) => col.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setColumns((prev) => {
        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
        return next;
      });
      reorderColumns(currentCategoryKey, oldIndex, newIndex);
      showToast(
        isRtl ? 'تم تحديث ترتيب الأعمدة بنجاح' : 'Column order updated successfully',
        'info'
      );
    }
  };

  // Editable Header state (Restricted to Admin only)
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState<string>('');
  const [editingColumnTarget, setEditingColumnTarget] = useState<ColumnDefinition | null>(null);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string>('sessionDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Multi-select bulk actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Density state: comfortable vs compact
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Inline editing cell state: { rowId, colId }
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

  // Excel Import / Export state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedExcelResult, setParsedExcelResult] = useState<ParsedExcelResult | null>(null);
  const [importedFileName, setImportedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active category info
  const activeCategoryInfo = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Editable Header Handlers (Admin only)
  const handleStartRename = (col: ColumnDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingColId(col.id);
    setEditingColName(isRtl ? col.nameAr : col.nameEn);
  };

  const handleSaveRename = (colId: string) => {
    if (editingColName.trim()) {
      renameColumn(currentCategoryKey, colId, editingColName.trim(), editingColName.trim());
    }
    setEditingColId(null);
  };

  // Filter cases logic
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Category filter
      if (selectedCategory && c.categoryId !== selectedCategory) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const baseMatch =
          c.caseNumber.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          c.opponentName.toLowerCase().includes(q) ||
          (c.court && c.court.toLowerCase().includes(q)) ||
          (c.caseType && c.caseType.toLowerCase().includes(q)) ||
          (c.nextStep && c.nextStep.toLowerCase().includes(q));

        if (baseMatch) return true;

        // Also check custom fields
        if (c.customFields) {
          const customValues = Object.values(c.customFields).join(' ').toLowerCase();
          if (customValues.includes(q)) return true;
        }

        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Court filter
      if (courtFilter !== 'all' && c.court && !c.court.includes(courtFilter)) return false;

      // Assignee filter (Filter by Lawyer)
      if (assigneeFilter !== 'all') {
        const rowAssignee =
          c.assigneeId ||
          c.customFields?.assigneeId ||
          c.customFields?.['الشخص المسؤول'] ||
          c.customFields?.['المحامي المسؤول'] ||
          c.customFields?.['المحامي'] ||
          c.customFields?.assignee;

        const target = String(rowAssignee || '').trim().toLowerCase();
        const selectedUser = users.find((u) => u.id === assigneeFilter);
        const match =
          target === assigneeFilter.toLowerCase() ||
          (selectedUser && (
            target === selectedUser.id.toLowerCase() ||
            target === selectedUser.email.toLowerCase() ||
            target === selectedUser.name.toLowerCase() ||
            (selectedUser.nameEn && target === selectedUser.nameEn.toLowerCase()) ||
            selectedUser.name.toLowerCase().includes(target) ||
            target.includes(selectedUser.name.toLowerCase())
          ));

        if (!match) return false;
      }

      // Assigned to me filter
      if (filterAssignedToMe && currentUser && c.assigneeId !== currentUser.id) {
        return false;
      }

      // Urgent only
      if (filterUrgentOnly && c.priority !== 'urgent') return false;

      // Expert report only
      if (filterExpertOnly && !c.isExpertReport) return false;

      return true;
    });
  }, [
    cases,
    selectedCategory,
    searchQuery,
    statusFilter,
    courtFilter,
    assigneeFilter,
    filterAssignedToMe,
    currentUser,
    filterUrgentOnly,
    filterExpertOnly,
  ]);

  // Evaluates cell value including real-time computed columns like remainingAmount and assignee names
  const getCellValue = (caseItem: CaseItem, column: ColumnDefinition) => {
    // 1. Computed formula column
    if (column.type === 'computed' || column.isComputed) {
      if (column.id === 'remainingAmount') {
        const execAmount = Number(
          caseItem.customFields?.executionAmount ?? caseItem.claimAmount ?? 0
        );
        const transAmount = Number(caseItem.customFields?.transferredAmount ?? 0);
        return execAmount - transAmount;
      }
      return '-';
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
        caseItem.customFields?.['المحامي المسؤول'] ||
        caseItem.customFields?.['المحامي'] ||
        caseItem.customFields?.assignee;

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
      if (rawAssignee) return String(rawAssignee);
      const defaultUser = users[0];
      return defaultUser ? (isRtl ? defaultUser.name : defaultUser.nameEn) : (isRtl ? 'المستشار / محمد العتيبي' : 'Adv. Mohammed Al-Otaibi');
    }

    // 3. Direct property on caseItem
    if (column.id in caseItem) {
      return (caseItem as any)[column.id];
    }

    // 4. Custom field on caseItem
    return caseItem.customFields?.[column.id] ?? '';
  };

  // Sorted cases
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      const colDef = activeColumns.find((c) => c.id === sortField);
      if (!colDef) return 0;

      const valA = getCellValue(a, colDef);
      const valB = getCellValue(b, colDef);

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA || '');
      const strB = String(valB || '');
      const comp = strA.localeCompare(strB);
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredCases, sortField, sortDirection, activeColumns]);

  // TanStack Table Instance
  const tableColumns = useMemo<LegacyColumnDef<CaseItem, any>[]>(() => {
    return activeColumns.map((col) => ({
      id: col.id,
      header: () => (isRtl ? col.nameAr : col.nameEn),
      accessorFn: (row: CaseItem) => getCellValue(row, col),
    }));
  }, [activeColumns, isRtl, users]);

  const table = useReactTable({
    data: sortedCases,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Bulk actions handlers
  const handleSelectAll = () => {
    if (selectedIds.size === sortedCases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCases.map((c) => c.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkStatusChange = (newStatus: CaseStatus) => {
    selectedIds.forEach((id) => {
      const c = cases.find((item) => item.id === id);
      if (c && canEditCase(c)) {
        updateCase(id, { status: newStatus });
      }
    });
    setSelectedIds(new Set());
    showToast(
      isRtl
        ? `تم تحديث حالة ${selectedIds.size} سجل بنجاح`
        : `Updated status for ${selectedIds.size} rows`,
      'success'
    );
  };

  // Generate & Download Empty Bulk Import Template matching active page schema (.xlsx)
  const handleDownloadTemplate = () => {
    // Exactly ONE row: the dynamic header row matching current page's active columns
    const headers = activeColumns.map((col) => (isRtl ? col.nameAr : col.nameEn));
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Set RTL view on worksheet if Arabic
    if (isRtl) {
      if (!worksheet['!views']) worksheet['!views'] = [];
      worksheet['!views'].push({ rightToLeft: true });
    }

    // Set generous column widths
    worksheet['!cols'] = activeColumns.map((col) => {
      const headerText = isRtl ? col.nameAr : col.nameEn;
      return { wch: Math.max(headerText.length * 2, 18) };
    });

    const currentCatTitle = activeCategoryInfo
      ? (isRtl ? activeCategoryInfo.nameAr : activeCategoryInfo.nameEn)
      : (isRtl ? 'نموذج_إدخال_البيانات' : 'Data_Import_Template');
    const safeSheetName = currentCatTitle.replace(/[:\\/?*[\]]/g, '').slice(0, 31) || 'Template';

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    const fileName = `Template_${safeSheetName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast(
      isRtl
        ? `تم تحميل نموذج الإدخال الفارغ لـ (${safeSheetName}) بنجاح بصيغة Excel`
        : `Downloaded empty Excel template for (${safeSheetName}) successfully`,
      'success'
    );
  };

  // Export table data strictly to XLSX using SheetJS
  const handleExportExcel = (exportSelectedOnly = false) => {
    const dataToExport = exportSelectedOnly
      ? sortedCases.filter((c) => selectedIds.has(c.id))
      : sortedCases;

    const currentCatTitle = activeCategoryInfo
      ? (isRtl ? activeCategoryInfo.nameAr : activeCategoryInfo.nameEn)
      : (isRtl ? 'كافة_القضايا' : 'All_Cases');

    exportTableToExcel({
      data: dataToExport,
      columns: activeColumns,
      isRtl,
      users,
      sheetName: currentCatTitle,
    });

    showToast(
      isRtl
        ? `تم تصدير ${dataToExport.length} سجل إلى ملف Excel (.xlsx) بنجاح`
        : `Exported ${dataToExport.length} rows to Excel (.xlsx) successfully`,
      'success'
    );
  };

  // Trigger file selection & parse Excel/CSV for import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseExcelFile(file);
      setParsedExcelResult(result);
      setImportedFileName(file.name);
      setImportModalOpen(true);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || (isRtl ? 'فشل قراءة ملف Excel' : 'Failed to parse Excel file'), 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusTabs: { id: CaseStatus | 'all'; label: string }[] = [
    { id: 'all', label: isRtl ? 'الكل' : 'All' },
    { id: 'hearing_scheduled', label: t('status_hearing_scheduled') },
    { id: 'expert_report', label: t('status_expert_report') },
    { id: 'under_review', label: t('status_under_review') },
    { id: 'reserved_judgment', label: t('status_reserved_judgment') },
    { id: 'executed', label: t('status_executed') },
    { id: 'closed', label: t('status_closed') },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Control Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {activeCategoryInfo && (
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeCategoryInfo.color || '#2563EB' }}
                />
              )}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeCategoryInfo
                  ? isRtl
                    ? activeCategoryInfo.nameAr
                    : activeCategoryInfo.nameEn
                  : t('allCases')}
              </h2>
              <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {sortedCases.length} {isRtl ? 'سجل' : 'rows'}
              </span>

              {/* Real-time Google Sheets Sync Badge */}
              <div
                onClick={() => setIsGoogleSheetsModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold cursor-pointer hover:bg-emerald-500/20 transition-colors"
                title={isRtl ? 'فتح إعدادات Google Sheets' : 'Open Google Sheets settings'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Google Sheets</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {activeCategoryInfo && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl ? activeCategoryInfo.descriptionAr : activeCategoryInfo.descriptionEn}
              </p>
            )}
          </div>

          {/* Quick Table Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Density Selector */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  density === 'comfortable'
                    ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs text-slate-900 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                {isRtl ? 'مريح' : 'Comfortable'}
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs text-slate-900 dark:text-white'
                    : 'text-slate-500'
                }`}
              >
                {isRtl ? 'مكثف' : 'Compact'}
              </button>
            </div>

            {/* Google Sheets Sync Button */}
            <button
              onClick={() => syncToGoogleSheets()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
              title="Sync to Google Sheets"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مزامنة Sheets' : 'Sync Sheets'}</span>
            </button>

            {/* Export to Excel (.xlsx) */}
            <button
              onClick={() => handleExportExcel(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700/80 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={isRtl ? 'تصدير الجدول إلى ملف إكسيل (.xlsx)' : 'Export current table to Excel (.xlsx)'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isRtl ? 'تصدير إكسيل' : 'Export Excel'}</span>
            </button>

            {/* Download Bulk Import Template (.xlsx) */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title={isRtl ? 'تحميل نموذج إكسيل فارغ بمطابقة أعمدة هذا القسم' : 'Download empty Excel import template matching current schema'}
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isRtl ? 'تحميل نموذج الإدخال' : 'Download Template'}</span>
            </button>

            {/* Bulk Import from Excel */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title={isRtl ? 'استيراد بيانات مجمعة من ملف Excel مع مطابقة الأعمدة' : 'Bulk import from Excel (.xlsx) with column mapping'}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isRtl ? 'استيراد بيانات' : 'Import Data'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Admin Add Column Button */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-300 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer"
                  title={isRtl ? 'إضافة عمود جديد للجدول' : 'Add Column'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إضافة عمود' : 'Add Column'}</span>
                </button>

                {/* Paste Column Button (لصق العامود) */}
                <button
                  onClick={() => pasteColumn(selectedCategory || 'all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs border ${
                    copiedColumn
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 ring-1 ring-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={
                    copiedColumn
                      ? isRtl
                        ? `لصق العامود المنسوخ: "${copiedColumn.nameAr}" في هذا الجدول`
                        : `Paste copied column: "${copiedColumn.nameEn || copiedColumn.nameAr}"`
                      : isRtl
                      ? 'انسخ عاموداً أولاً من قائمة إعدادات أي عامود'
                      : 'Copy a column first from any column settings menu'
                  }
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {isRtl ? 'لصق العامود' : 'Paste Column'}
                    {copiedColumn && (
                      <span className="ms-1 px-1.5 py-0.2 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 text-[10px]">
                        {isRtl ? copiedColumn.nameAr : (copiedColumn.nameEn || copiedColumn.nameAr)}
                      </span>
                    )}
                  </span>
                </button>
              </>
            )}

            {/* Add New Case Modal */}
            {canCreateCase() && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('newCase')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Bar with Status Tabs & Lawyer Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Pipeline Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs w-full sm:w-auto">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feature 1: Lawyer / Assignee Filter (تصفية بالمحامي) */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {isRtl ? 'تصفية بالمحامي:' : 'Filter by Lawyer:'}
              </span>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs"
                title={isRtl ? 'تصفية الجدول بحسب المحامي المسؤول' : 'Filter table by assigned lawyer'}
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {isRtl ? 'كافة المحامين والمكلفين (الكل)' : 'All Lawyers / Assignees'}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {isRtl ? u.name : u.nameEn} ({u.role === 'admin' ? t('role_admin') : u.role === 'lawyer' ? t('role_lawyer') : t('role_viewer')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Select Floating Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {selectedIds.size} {isRtl ? 'سجلات محددة' : 'rows selected'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusChange(e.target.value as CaseStatus);
                }}
                defaultValue=""
                className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  {isRtl ? 'تحديث الحالة للمحددة...' : 'Update Status...'}
                </option>
                <option value="hearing_scheduled">{t('status_hearing_scheduled')}</option>
                <option value="expert_report">{t('status_expert_report')}</option>
                <option value="under_review">{t('status_under_review')}</option>
                <option value="reserved_judgment">{t('status_reserved_judgment')}</option>
                <option value="executed">{t('status_executed')}</option>
                <option value="closed">{t('status_closed')}</option>
              </select>

              <button
                onClick={() => handleExportExcel(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تصدير المحددة (Excel .xlsx)' : 'Export Selected (Excel .xlsx)'}</span>
              </button>

              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main View Area: Dynamic Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto w-full">
        {sortedCases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-semibold">
              {isRtl ? 'لا توجد سجلات في هذا القسم' : 'No rows in this section'}
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-xs text-start border-collapse min-w-[950px] whitespace-nowrap">
              {/* Dynamic Headers with TanStack Table & dnd-kit Drag-and-Drop and Inline Editing */}
              <thead>
                <SortableContext
                  items={activeColumns.map((col) => col.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold select-none whitespace-nowrap">
                    {/* Select All Checkbox */}
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {selectedIds.size > 0 && selectedIds.size === sortedCases.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>

                    {/* Dynamic Columns Headers using TanStack Table & dnd-kit */}
                    {activeColumns.map((col) => (
                      <DraggableHeaderCell
                        key={col.id}
                        col={col}
                        width={columnWidths[col.id] || col.width}
                        onResizeStart={handleResizeStart}
                        isAdmin={isAdmin}
                        isEditingThis={editingColId === col.id}
                        editingColName={editingColName}
                        setEditingColName={setEditingColName}
                        handleStartRename={handleStartRename}
                        handleSaveRename={handleSaveRename}
                        setEditingColId={setEditingColId}
                        onOpenEditModal={(targetCol) => {
                          setEditingColumnTarget(targetCol);
                          setIsEditColumnModalOpen(true);
                        }}
                        onCopyColumn={copyColumn}
                        onDeleteColumn={handleDeleteColumn}
                        deleteColumn={deleteColumn}
                        currentCategoryKey={currentCategoryKey}
                        isRtl={isRtl}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                      />
                    ))}

                    <th className="py-3 px-3 text-center w-20 whitespace-nowrap">{t('colActions')}</th>
                  </tr>
                </SortableContext>
              </thead>

            {/* Table Rows with Dynamic Cells & Inline Editing */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedCases.map((row) => {
                const isSelected = selectedIds.has(row.id);
                const canEdit = canEditCase(row);
                const canDelete = canDeleteCase();
                const rowPadding = density === 'compact' ? 'py-2 px-3' : 'py-3 px-3.5';

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors group cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                    }`}
                    onClick={() => setSelectedCaseId(row.id)}
                  >
                    {/* Row Checkbox */}
                    <td
                      className={`${rowPadding} text-center`}
                      onClick={(e) => toggleSelectOne(row.id, e)}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 inline" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 inline" />
                      )}
                    </td>

                    {/* Dynamic Columns Cell Render */}
                    {activeColumns.map((col) => {
                      const val = getCellValue(row, col);
                      const isEditingCellThis =
                        editingCell?.rowId === row.id && editingCell?.colId === col.id;

                      const isAssigneeCol =
                        col.id === 'assigneeId' ||
                        col.id === 'assignee' ||
                        col.nameAr.includes('المسؤول') ||
                        col.nameAr.includes('المحامي') ||
                        col.nameAr.includes('المكلف') ||
                        col.nameEn.toLowerCase().includes('assignee') ||
                        col.nameEn.toLowerCase().includes('lawyer');

                      const rawAssigneeValue =
                        row.customFields?.[col.id] ||
                        row.assigneeId ||
                        row.customFields?.assigneeId ||
                        row.customFields?.['الشخص المسؤول'] ||
                        val;

                      const assignedUser = isAssigneeCol
                        ? users.find((u) => {
                            const target = String(rawAssigneeValue || val || '').trim().toLowerCase();
                            if (!target) return false;
                            if (u.id.toLowerCase() === target) return true;
                            if (u.email.toLowerCase() === target) return true;
                            if (u.name.toLowerCase() === target) return true;
                            if (u.nameEn?.toLowerCase() === target) return true;
                            const cleanName = u.name.replace(/^(المستشار|أستاذ|أ\.|\/|\s)+/g, '').trim().toLowerCase();
                            const cleanTarget = target.replace(/^(المستشار|أستاذ|أ\.|\/|\s)+/g, '').trim().toLowerCase();
                            if (cleanName && cleanTarget && (cleanName === cleanTarget || cleanName.includes(cleanTarget) || cleanTarget.includes(cleanName))) return true;
                            return false;
                          }) || users[0]
                        : null;

                      return (
                        <td
                          key={col.id}
                          className={`${rowPadding} text-start max-w-[240px] truncate whitespace-nowrap`}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (canEdit && col.type !== 'computed' && col.type !== 'file' && col.id !== 'poaFile' && col.id !== 'licenseFile') {
                              setEditingCell({ rowId: row.id, colId: col.id });
                            }
                          }}
                        >
                          {/* Inline Edit Cell Input if Active */}
                          {isEditingCellThis ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              {isAssigneeCol ? (
                                <select
                                  autoFocus
                                  defaultValue={assignedUser?.id || row.assigneeId || users[0]?.id || ''}
                                  onBlur={(e) => {
                                    updateCaseField(row.id, 'assigneeId', e.target.value);
                                    if (col.id !== 'assigneeId') {
                                      updateCaseField(row.id, col.id, e.target.value);
                                    }
                                    setEditingCell(null);
                                  }}
                                  onChange={(e) => {
                                    updateCaseField(row.id, 'assigneeId', e.target.value);
                                    if (col.id !== 'assigneeId') {
                                      updateCaseField(row.id, col.id, e.target.value);
                                    }
                                    setEditingCell(null);
                                  }}
                                  className="p-1 text-xs bg-white dark:bg-slate-800 border border-indigo-500 rounded text-slate-900 dark:text-white"
                                >
                                  <option value="">{isRtl ? '-- اختر الشخص المسؤول --' : '-- Select Assignee --'}</option>
                                  {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {isRtl ? u.name : u.nameEn} ({u.role})
                                    </option>
                                  ))}
                                </select>
                              ) : col.type === 'select' && col.options ? (
                                <select
                                  autoFocus
                                  defaultValue={String(val)}
                                  onBlur={(e) => {
                                    updateCaseField(row.id, col.id, e.target.value);
                                    setEditingCell(null);
                                  }}
                                  className="p-1 text-xs bg-white dark:bg-slate-800 border border-indigo-500 rounded text-slate-900 dark:text-white"
                                >
                                  {col.options.map((opt: string) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={
                                    col.type === 'number'
                                      ? 'number'
                                      : col.type === 'date'
                                      ? 'date'
                                      : col.type === 'time'
                                      ? 'time'
                                      : col.type === 'datetime'
                                      ? 'datetime-local'
                                      : 'text'
                                  }
                                  autoFocus
                                  defaultValue={String(val ?? '')}
                                  onBlur={(e) => {
                                    const nextVal = col.type === 'number' ? Number(e.target.value) : e.target.value;
                                    updateCaseField(row.id, col.id, nextVal);
                                    setEditingCell(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const nextVal = col.type === 'number' ? Number((e.target as any).value) : (e.target as any).value;
                                      updateCaseField(row.id, col.id, nextVal);
                                      setEditingCell(null);
                                    }
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full p-1 text-xs bg-white dark:bg-slate-800 border border-indigo-500 rounded text-slate-900 dark:text-white"
                                />
                              )}
                            </div>
                          ) : (
                            /* Cell Normal Display */
                            <div>
                              {col.type === 'computed' ? (
                                <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {Number(val).toLocaleString()} {t('aed')}
                                </span>
                              ) : col.type === 'time' ? (
                                <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span>{String(val || '-')}</span>
                                  {col.hasEmailReminder && val && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatchEmailAlert(
                                          row,
                                          col,
                                          String(val),
                                          col.reminderMinutesBefore || 30,
                                          col.reminderEmail || DEFAULT_USER_EMAIL
                                        );
                                        showToast(
                                          isRtl
                                            ? `تم إرسال إشعار التنبيه التجريبي بنجاح إلى (${col.reminderEmail || DEFAULT_USER_EMAIL})`
                                            : `Email reminder dispatched to (${col.reminderEmail || DEFAULT_USER_EMAIL})`,
                                          'success'
                                        );
                                      }}
                                      title={isRtl ? 'إرسال تنبيه تجريبي إلى البريد الآن' : 'Trigger email alert now'}
                                      className="p-0.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      <Bell className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : col.type === 'datetime' ? (
                                <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span>{String(val || '-')}</span>
                                  {col.hasEmailReminder && val && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatchEmailAlert(
                                          row,
                                          col,
                                          String(val),
                                          col.reminderMinutesBefore || 30,
                                          col.reminderEmail || DEFAULT_USER_EMAIL
                                        );
                                        showToast(
                                          isRtl
                                            ? `تم إرسال إشعار التنبيه التجريبي بنجاح إلى (${col.reminderEmail || DEFAULT_USER_EMAIL})`
                                            : `Email reminder dispatched to (${col.reminderEmail || DEFAULT_USER_EMAIL})`,
                                          'success'
                                        );
                                      }}
                                      title={isRtl ? 'إرسال تنبيه تجريبي إلى البريد الآن' : 'Trigger email alert now'}
                                      className="p-0.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      <Bell className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : col.id === 'contractStatus' ? (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  val === 'قيد المراجعة'
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    : val === 'مراجعة وتعديل'
                                    ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                }`}>
                                  {String(val || '-')}
                                </span>
                              ) : col.id === 'depositStatus' ? (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  {String(val || '-')}
                                </span>
                              ) : isAssigneeCol ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {assignedUser ? (
                                    <>
                                      <span
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-2xs"
                                        style={{ backgroundColor: assignedUser.color || '#4F46E5' }}
                                        title={assignedUser.email}
                                      >
                                        {assignedUser.initials}
                                      </span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {isRtl ? assignedUser.name : assignedUser.nameEn}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                                      {val ? String(val) : (isRtl ? 'غير مسند' : 'Unassigned')}
                                    </span>
                                  )}
                                </div>
                              ) : col.cell ? (
                                col.cell({
                                  getValue: () => val,
                                  row: { original: row },
                                })
                              ) : col.type === 'file' || col.id === 'poaFile' || col.id === 'licenseFile' ? (
                                <FileCell
                                  value={val}
                                  defaultFileName={col.id === 'licenseFile' ? 'license_document.pdf' : 'poa_document.pdf'}
                                  onChange={(newFile) => {
                                    updateCaseField(row.id, col.id, newFile);
                                  }}
                                  isRtl={isRtl}
                                />
                              ) : col.type === 'number' ? (
                                <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                                  {typeof val === 'number' ? val.toLocaleString() : val || '-'}
                                </span>
                              ) : col.type === 'date' ? (
                                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                  {String(val || '-')}
                                </span>
                              ) : (
                                <span className="text-slate-800 dark:text-slate-200 font-medium">
                                  {String(val || '-')}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    <td
                      className={`${rowPadding} text-center whitespace-nowrap`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedCaseId(row.id)}
                          title={t('viewDetails')}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => {
                              setSelectedCaseId(row.id);
                              setIsEditModalOpen(true);
                            }}
                            title={t('editCase')}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCase(row.id);
                            }}
                            title={t('deleteCase')}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state indicator inside the table */}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length + 2} className="py-10 px-4 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Plus className="w-5 h-5 text-indigo-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isRtl ? 'الجدول جاهز وفارغ لإدخال بيانات القضايا' : 'Table ready for new data entry'}
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {isRtl
                          ? 'كافة الأعمدة والخيارات مهيأة وثابتة. يمكنك الآن البدء بإدراج صفوف جديدة أو استيراد ملفات Excel مباشرة.'
                          : 'Table columns and schema are preserved. You can start adding rows or import Excel files directly.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Bottom Quick Row Insertion Pin (ClickUp style) */}
              <tr
                onClick={() => insertRow()}
                className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600"
              >
                <td className="py-2.5 px-3 text-center">
                  <Plus className="w-3.5 h-3.5 mx-auto" />
                </td>
                <td colSpan={activeColumns.length + 1} className="py-2.5 px-3.5 font-semibold text-xs">
                  + {isRtl ? 'إدراج سطر جديد في هذا الجدول (انقر للإضافة مباشرة)' : 'Click to add a new row directly'}
                </td>
              </tr>
            </tbody>
          </table>
        </DndContext>
        )}
      </div>

      {/* Bulk Excel Import Preview & Column Mapping Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setParsedExcelResult(null);
        }}
        parsedResult={parsedExcelResult}
        fileName={importedFileName}
        targetCategoryId={selectedCategory || ''}
      />

      {/* Admin Column Settings & Edit Modal */}
      <EditColumnModal
        isOpen={isEditColumnModalOpen}
        onClose={() => {
          setIsEditColumnModalOpen(false);
          setEditingColumnTarget(null);
        }}
        column={editingColumnTarget}
        categoryId={currentCategoryKey}
        onDelete={handleDeleteColumn}
      />
    </div>
  );
};
