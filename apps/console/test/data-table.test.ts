import { describe, expect, it } from "vitest"

import {
  type ColumnDef,
  createDataTable,
  flexRender,
} from "../src/components/data-table"

type Row = {
  id: string
  title: string
  status: "open" | "done"
  priority: number
  owner: string
}

const rows: Row[] = [
  { id: "a", title: "Write report", status: "open", priority: 2, owner: "Mina" },
  { id: "b", title: "Fix billing", status: "done", priority: 1, owner: "Rafi" },
  { id: "c", title: "Review launch", status: "open", priority: 3, owner: "Mina" },
]

const columns: ColumnDef<Row>[] = [
  {
    id: "select",
    header: ({ table }) => table.getIsAllPageRowsSelected(),
    cell: ({ row }) => row.getIsSelected(),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => column.id,
    cell: ({ row }) => row.getValue("title"),
  },
  {
    accessorKey: "status",
    filterFn: (row, id, value) => {
      return Array.isArray(value)
        ? value.includes(row.getValue(id))
        : row.getValue(id) === value
    },
  },
  {
    accessorKey: "priority",
  },
  {
    accessorKey: "owner",
  },
]

describe("local data table", () => {
  it("builds headers, rows, visible cells, and render contexts", () => {
    const table = createDataTable({
      data: rows,
      columns,
      state: {
        pagination: { pageIndex: 0, pageSize: 10 },
      },
    })

    expect(table.getHeaderGroups()[0]?.headers.map((header) => header.id)).toEqual([
      "select",
      "title",
      "status",
      "priority",
      "owner",
    ])
    expect(table.getRowModel().rows[0]?.getValue("title")).toBe("Write report")
    expect(table.getRowModel().rows[0]?.getVisibleCells()).toHaveLength(5)
    expect(
      flexRender(
        table.getAllColumns()[1]?.columnDef.header,
        table.getHeaderGroups()[0]?.headers[1]?.getContext()
      )
    ).toBe("title")
  })

  it("sorts values and toggles sort direction through a column", () => {
    let sorting = [{ id: "priority", desc: false }]
    const table = createDataTable({
      data: rows,
      columns,
      state: {
        sorting,
        pagination: { pageIndex: 0, pageSize: 10 },
      },
      onSortingChange: (updater) => {
        sorting = typeof updater === "function" ? updater(sorting) : updater
      },
    })

    expect(table.getRowModel().rows.map((row) => row.original.id)).toEqual([
      "b",
      "a",
      "c",
    ])

    table.getColumn("priority")?.toggleSorting(true)
    expect(sorting).toEqual([{ id: "priority", desc: true }])
  })

  it("filters column values, global text, and computes facets", () => {
    const table = createDataTable({
      data: rows,
      columns,
      state: {
        columnFilters: [{ id: "status", value: ["open"] }],
        globalFilter: "launch",
        pagination: { pageIndex: 0, pageSize: 10 },
      },
    })

    expect(table.getFilteredRowModel().rows.map((row) => row.original.id)).toEqual([
      "c",
    ])
    expect(table.getColumn("owner")?.getFacetedUniqueValues()).toEqual(
      new Map([
        ["Mina", 2],
        ["Rafi", 1],
      ])
    )
  })

  it("tracks page selection, column visibility, and pagination", () => {
    let rowSelection: Record<string, boolean> = { a: true }
    let columnVisibility: Record<string, boolean> = { owner: false }
    let pagination = { pageIndex: 0, pageSize: 2 }
    const table = createDataTable({
      data: rows,
      columns,
      getRowId: (row) => row.id,
      state: {
        rowSelection,
        columnVisibility,
        pagination,
      },
      onRowSelectionChange: (updater) => {
        rowSelection =
          typeof updater === "function" ? updater(rowSelection) : updater
      },
      onColumnVisibilityChange: (updater) => {
        columnVisibility =
          typeof updater === "function" ? updater(columnVisibility) : updater
      },
      onPaginationChange: (updater) => {
        pagination = typeof updater === "function" ? updater(pagination) : updater
      },
    })

    expect(table.getRowModel().rows.map((row) => row.original.id)).toEqual([
      "a",
      "b",
    ])
    expect(table.getFilteredSelectedRowModel().rows.map((row) => row.id)).toEqual([
      "a",
    ])
    expect(table.getRowModel().rows[0]?.getVisibleCells().map((cell) => cell.column.id)).not.toContain(
      "owner"
    )

    table.toggleAllPageRowsSelected(true)
    expect(rowSelection).toEqual({ a: true, b: true })

    table.getColumn("title")?.toggleVisibility(false)
    expect(columnVisibility).toEqual({ owner: false, title: false })

    table.nextPage()
    expect(pagination).toEqual({ pageIndex: 1, pageSize: 2 })
    expect(table.getPageCount()).toBe(2)
    expect(table.getCanNextPage()).toBe(true)
  })
})
