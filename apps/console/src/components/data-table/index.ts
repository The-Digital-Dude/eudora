"use client"

import * as React from "react"

type Updater<T> = T | ((old: T) => T)
type OnChangeFn<T> = (updater: Updater<T>) => void

export type SortingState = { id: string; desc: boolean }[]
export type ColumnFiltersState = { id: string; value: unknown }[]
export type VisibilityState = Record<string, boolean>
export type RowSelectionState = Record<string, boolean>
export type PaginationState = { pageIndex: number; pageSize: number }

export type FilterFn<TData> = (
  row: Row<TData>,
  columnId: string,
  value: any
) => boolean

export type ColumnDef<TData, TValue = unknown> = {
  id?: string
  accessorKey?: string
  accessorFn?: (row: TData, index: number) => TValue
  header?: React.ReactNode | ((context: HeaderContext<TData, TValue>) => React.ReactNode)
  cell?: (context: CellContext<TData, TValue>) => React.ReactNode
  filterFn?: FilterFn<TData>
  enableSorting?: boolean
  enableHiding?: boolean
  size?: number
}

export type DataTableState = {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: RowSelectionState
  pagination: PaginationState
  globalFilter?: any
}

export type DataTableOptions<TData> = {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  state?: Partial<DataTableState>
  getRowId?: (row: TData, index: number) => string
  enableRowSelection?: boolean
  onSortingChange?: OnChangeFn<SortingState>
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  onPaginationChange?: OnChangeFn<PaginationState>
  onGlobalFilterChange?: OnChangeFn<any>
  getCoreRowModel?: unknown
  getFilteredRowModel?: unknown
  getPaginationRowModel?: unknown
  getSortedRowModel?: unknown
  getFacetedRowModel?: unknown
  getFacetedUniqueValues?: unknown
}

export type HeaderContext<TData, TValue = unknown> = {
  table: Table<TData>
  column: Column<TData, TValue>
  header: Header<TData, TValue>
}

export type CellContext<TData, TValue = unknown> = {
  table: Table<TData>
  row: Row<TData>
  column: Column<TData, TValue>
  cell: Cell<TData, TValue>
  getValue: () => TValue
  renderValue: () => TValue
}

export type Column<TData, TValue = unknown> = {
  id: string
  columnDef: ColumnDef<TData, TValue>
  accessorFn?: (row: TData, index: number) => TValue
  getCanHide: () => boolean
  getCanSort: () => boolean
  getFilterValue: () => unknown
  getFacetedUniqueValues: () => Map<unknown, number>
  getIsSorted: () => false | "asc" | "desc"
  getIsVisible: () => boolean
  setFilterValue: (value: unknown) => void
  toggleSorting: (desc?: boolean) => void
  toggleVisibility: (value?: boolean) => void
}

export type Header<TData, TValue = unknown> = {
  id: string
  colSpan: number
  isPlaceholder: boolean
  column: Column<TData, TValue>
  getContext: () => HeaderContext<TData, TValue>
}

export type HeaderGroup<TData> = {
  id: string
  headers: Header<TData>[]
}

export type Cell<TData, TValue = unknown> = {
  id: string
  row: Row<TData>
  column: Column<TData, TValue>
  getContext: () => CellContext<TData, TValue>
  getValue: () => TValue
  renderValue: () => TValue
}

export type Row<TData> = {
  id: string
  index: number
  original: TData
  getIsSelected: () => boolean
  getValue: <TValue = unknown>(columnId: string) => TValue
  getVisibleCells: () => Cell<TData>[]
  toggleSelected: (value?: boolean) => void
}

export type RowModel<TData> = {
  rows: Row<TData>[]
}

export type Table<TData> = {
  getAllColumns: () => Column<TData>[]
  getCanNextPage: () => boolean
  getCanPreviousPage: () => boolean
  getColumn: (columnId: string) => Column<TData> | undefined
  getFilteredRowModel: () => RowModel<TData>
  getFilteredSelectedRowModel: () => RowModel<TData>
  getHeaderGroups: () => HeaderGroup<TData>[]
  getIsAllPageRowsSelected: () => boolean
  getIsSomePageRowsSelected: () => boolean
  getPageCount: () => number
  getRowModel: () => RowModel<TData>
  getState: () => DataTableState
  nextPage: () => void
  previousPage: () => void
  resetColumnFilters: () => void
  setPageIndex: (pageIndex: number) => void
  setPageSize: (pageSize: number) => void
  toggleAllPageRowsSelected: (value?: boolean) => void
}

const defaultState: DataTableState = {
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
  rowSelection: {},
  pagination: { pageIndex: 0, pageSize: 10 },
  globalFilter: undefined,
}

export function flexRender<TContext>(
  renderer: React.ReactNode | ((context: TContext) => React.ReactNode),
  context: TContext
) {
  if (typeof renderer === "function") {
    return renderer(context)
  }

  return renderer ?? null
}

export function useDataTable<TData>(options: DataTableOptions<TData>) {
  return React.useMemo(() => createDataTable(options), [options])
}

export const useReactTable = useDataTable

export const getCoreRowModel = () => undefined
export const getFilteredRowModel = () => undefined
export const getPaginationRowModel = () => undefined
export const getSortedRowModel = () => undefined
export const getFacetedRowModel = () => undefined
export const getFacetedUniqueValues = () => undefined

export function createDataTable<TData>(
  options: DataTableOptions<TData>
): Table<TData> {
  const state: DataTableState = {
    ...defaultState,
    ...options.state,
    pagination: {
      ...defaultState.pagination,
      ...options.state?.pagination,
    },
  }

  const updateSorting = (updater: Updater<SortingState>) => {
    options.onSortingChange?.(updater)
  }

  const updateColumnFilters = (updater: Updater<ColumnFiltersState>) => {
    options.onColumnFiltersChange?.(updater)
  }

  const updateColumnVisibility = (updater: Updater<VisibilityState>) => {
    options.onColumnVisibilityChange?.(updater)
  }

  const updateRowSelection = (updater: Updater<RowSelectionState>) => {
    options.onRowSelectionChange?.(updater)
  }

  const updatePagination = (updater: Updater<PaginationState>) => {
    options.onPaginationChange?.(updater)
  }

  const columns = options.columns.map((columnDef, index) => {
    const id = getColumnId(columnDef, index)
    const accessorFn = getAccessorFn(columnDef)

    const column: Column<TData> = {
      id,
      columnDef,
      accessorFn,
      getCanHide: () => columnDef.enableHiding !== false,
      getCanSort: () => columnDef.enableSorting !== false && Boolean(accessorFn),
      getFilterValue: () =>
        state.columnFilters.find((filter) => filter.id === id)?.value,
      getFacetedUniqueValues: () => buildFacetedUniqueValues(coreRows, id),
      getIsSorted: () => {
        const sort = state.sorting.find((entry) => entry.id === id)
        if (!sort) {
          return false
        }

        return sort.desc ? "desc" : "asc"
      },
      getIsVisible: () => state.columnVisibility[id] !== false,
      setFilterValue: (value) => {
        updateColumnFilters((old) => {
          const next = old.filter((filter) => filter.id !== id)
          if (isActiveFilterValue(value)) {
            next.push({ id, value })
          }
          return next
        })
      },
      toggleSorting: (desc) => {
        updateSorting((old) => {
          if (typeof desc === "boolean") {
            return [{ id, desc }]
          }

          const current = old.find((entry) => entry.id === id)
          if (!current) {
            return [{ id, desc: false }]
          }
          if (!current.desc) {
            return [{ id, desc: true }]
          }
          return []
        })
      },
      toggleVisibility: (value) => {
        updateColumnVisibility((old) => ({
          ...old,
          [id]: typeof value === "boolean" ? value : old[id] === false,
        }))
      },
    }

    return column
  })

  const columnById = new Map(columns.map((column) => [column.id, column]))
  const coreRows = options.data.map((item, index) =>
    createRow({
      table: () => table,
      columns: () => columns,
      rowSelection: () => state.rowSelection,
      updateRowSelection,
      id: options.getRowId?.(item, index) ?? String(index),
      index,
      original: item,
    })
  )

  const filteredRows = applyGlobalFilter(
    applyColumnFilters(coreRows, columns, state.columnFilters),
    columns,
    state.globalFilter
  )
  const sortedRows = applySorting(filteredRows, state.sorting)
  const paginatedRows = paginateRows(sortedRows, state.pagination)
  const headerGroups = createHeaderGroups(() => table, columns)

  const table: Table<TData> = {
    getAllColumns: () => columns,
    getCanNextPage: () =>
      state.pagination.pageIndex < table.getPageCount() - 1,
    getCanPreviousPage: () => state.pagination.pageIndex > 0,
    getColumn: (columnId) => columnById.get(columnId),
    getFilteredRowModel: () => ({ rows: filteredRows }),
    getFilteredSelectedRowModel: () => ({
      rows: filteredRows.filter((row) => row.getIsSelected()),
    }),
    getHeaderGroups: () => headerGroups,
    getIsAllPageRowsSelected: () =>
      paginatedRows.length > 0 && paginatedRows.every((row) => row.getIsSelected()),
    getIsSomePageRowsSelected: () => {
      const selectedCount = paginatedRows.filter((row) => row.getIsSelected()).length
      return selectedCount > 0 && selectedCount < paginatedRows.length
    },
    getPageCount: () =>
      Math.max(1, Math.ceil(sortedRows.length / state.pagination.pageSize)),
    getRowModel: () => ({ rows: paginatedRows }),
    getState: () => state,
    nextPage: () => {
      if (!table.getCanNextPage()) {
        return
      }
      table.setPageIndex(state.pagination.pageIndex + 1)
    },
    previousPage: () => {
      if (!table.getCanPreviousPage()) {
        return
      }
      table.setPageIndex(state.pagination.pageIndex - 1)
    },
    resetColumnFilters: () => updateColumnFilters([]),
    setPageIndex: (pageIndex) => {
      const lastPageIndex = table.getPageCount() - 1
      updatePagination((old) => ({
        ...old,
        pageIndex: Math.min(Math.max(pageIndex, 0), lastPageIndex),
      }))
    },
    setPageSize: (pageSize) => {
      updatePagination((old) => ({
        ...old,
        pageIndex: 0,
        pageSize,
      }))
    },
    toggleAllPageRowsSelected: (value) => {
      const shouldSelect = typeof value === "boolean" ? value : !table.getIsAllPageRowsSelected()
      updateRowSelection((old) => {
        const next = { ...old }
        for (const row of paginatedRows) {
          if (shouldSelect) {
            next[row.id] = true
          } else {
            delete next[row.id]
          }
        }
        return next
      })
    },
  }

  return table
}

function getColumnId<TData>(columnDef: ColumnDef<TData>, index: number) {
  return columnDef.id ?? columnDef.accessorKey ?? String(index)
}

function getAccessorFn<TData, TValue>(columnDef: ColumnDef<TData, TValue>) {
  if (columnDef.accessorFn) {
    return columnDef.accessorFn
  }

  if (!columnDef.accessorKey) {
    return undefined
  }

  return (row: TData) => {
    return (row as Record<string, TValue>)[columnDef.accessorKey as string]
  }
}

function createHeaderGroups<TData>(
  getTable: () => Table<TData>,
  columns: Column<TData>[]
): HeaderGroup<TData>[] {
  const headers = columns.map((column) => {
    const header: Header<TData> = {
      id: column.id,
      colSpan: 1,
      isPlaceholder: false,
      column,
      getContext: () => ({
        table: getTable(),
        column,
        header,
      }),
    }
    return header
  })

  return [{ id: "header", headers }]
}

function createRow<TData>({
  table,
  columns,
  rowSelection,
  updateRowSelection,
  id,
  index,
  original,
}: {
  table: () => Table<TData>
  columns: () => Column<TData>[]
  rowSelection: () => RowSelectionState
  updateRowSelection: (updater: Updater<RowSelectionState>) => void
  id: string
  index: number
  original: TData
}): Row<TData> {
  const valueCache = new Map<string, unknown>()

  const row: Row<TData> = {
    id,
    index,
    original,
    getIsSelected: () => Boolean(rowSelection()[id]),
    getValue: (columnId) => {
      if (valueCache.has(columnId)) {
        return valueCache.get(columnId) as never
      }

      const column = columns().find((item) => item.id === columnId)
      const value = column?.accessorFn?.(original, index)
      valueCache.set(columnId, value)
      return value as never
    },
    getVisibleCells: () =>
      columns()
        .filter((column) => column.getIsVisible())
        .map((column) => createCell(table, row, column)),
    toggleSelected: (value) => {
      const shouldSelect = typeof value === "boolean" ? value : !row.getIsSelected()
      updateRowSelection((old) => {
        const next = { ...old }
        if (shouldSelect) {
          next[id] = true
        } else {
          delete next[id]
        }
        return next
      })
    },
  }

  return row
}

function createCell<TData>(
  table: () => Table<TData>,
  row: Row<TData>,
  column: Column<TData>
): Cell<TData> {
  const cell: Cell<TData> = {
    id: `${row.id}_${column.id}`,
    row,
    column,
    getContext: () => ({
      table: table(),
      row,
      column,
      cell,
      getValue: () => cell.getValue(),
      renderValue: () => cell.renderValue(),
    }),
    getValue: () => row.getValue(column.id),
    renderValue: () => row.getValue(column.id),
  }

  return cell
}

function applyColumnFilters<TData>(
  rows: Row<TData>[],
  columns: Column<TData>[],
  filters: ColumnFiltersState
) {
  const activeFilters = filters.filter((filter) => isActiveFilterValue(filter.value))
  if (activeFilters.length === 0) {
    return rows
  }

  return rows.filter((row) =>
    activeFilters.every((filter) => {
      const column = columns.find((item) => item.id === filter.id)
      if (!column) {
        return true
      }

      if (column.columnDef.filterFn) {
        return column.columnDef.filterFn(row, filter.id, filter.value)
      }

      return defaultFilter(row.getValue(filter.id), filter.value)
    })
  )
}

function applyGlobalFilter<TData>(
  rows: Row<TData>[],
  columns: Column<TData>[],
  globalFilter: unknown
) {
  if (!isActiveFilterValue(globalFilter)) {
    return rows
  }

  const needle = String(globalFilter).toLowerCase()

  return rows.filter((row) =>
    columns
      .filter((column) => column.accessorFn)
      .some((column) => {
        const value = row.getValue(column.id)
        return value != null && String(value).toLowerCase().includes(needle)
      })
  )
}

function applySorting<TData>(rows: Row<TData>[], sorting: SortingState) {
  const sort = sorting[0]
  if (!sort) {
    return rows
  }

  return [...rows].sort((left, right) => {
    const result = compareValues(left.getValue(sort.id), right.getValue(sort.id))
    return sort.desc ? -result : result
  })
}

function paginateRows<TData>(rows: Row<TData>[], pagination: PaginationState) {
  const start = pagination.pageIndex * pagination.pageSize
  return rows.slice(start, start + pagination.pageSize)
}

function buildFacetedUniqueValues<TData>(rows: Row<TData>[], columnId: string) {
  const values = new Map<unknown, number>()

  for (const row of rows) {
    const value = row.getValue(columnId)
    values.set(value, (values.get(value) ?? 0) + 1)
  }

  return values
}

function defaultFilter(value: unknown, filterValue: unknown) {
  if (Array.isArray(filterValue)) {
    return filterValue.includes(value)
  }

  return String(value ?? "")
    .toLowerCase()
    .includes(String(filterValue).toLowerCase())
}

function isActiveFilterValue(value: unknown) {
  if (value == null) {
    return false
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (typeof value === "string") {
    return value.length > 0
  }
  return true
}

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) {
    return 0
  }
  if (left == null) {
    return 1
  }
  if (right == null) {
    return -1
  }
  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}
