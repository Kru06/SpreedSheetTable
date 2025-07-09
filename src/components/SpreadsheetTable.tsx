import React, { useState, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  CellContext,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

// Row type
export interface Row {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Invited" | "Inactive";
  role: string;
  avatar: string;
  selected?: boolean;
}

// Status badge color
const statusColor = (status: string) =>
  status === "Active"
    ? "bg-green-100 text-green-800"
    : status === "Invited"
    ? "bg-yellow-100 text-yellow-800"
    : "bg-gray-100 text-gray-600";

// Tabs
const TABS = [
  { label: "All", key: "all" },
  { label: "Active", key: "active" },
  { label: "Archived", key: "archived" },
];

// Editable cell component with keyboard focus support
function EditableCell({
  value: initialValue,
  rowIndex,
  colIndex,
  columnId,
  updateData,
  cellRefs,
}: {
  value: any;
  rowIndex: number;
  colIndex: number;
  columnId: string;
  updateData: (rowIndex: number, columnId: string, value: any) => void;
  cellRefs: React.MutableRefObject<(HTMLDivElement | null)[][]>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initialValue), [initialValue]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    if (!editing) {
      if (["Enter", "Tab", "F2"].includes(e.key)) {
        setEditing(true);
        e.preventDefault();
      }
      if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        let nextRow = rowIndex;
        let nextCol = colIndex;
        if (e.key === "ArrowRight") nextCol += 1;
        if (e.key === "ArrowLeft") nextCol -= 1;
        if (e.key === "ArrowDown") nextRow += 1;
        if (e.key === "ArrowUp") nextRow -= 1;
        cellRefs.current?.[nextRow]?.[nextCol]?.focus();
      }
    } else {
      if (e.key === "Escape") setEditing(false);
      if (e.key === "Enter" || e.key === "Tab") {
        setEditing(false);
        updateData(rowIndex, columnId, value);
        let nextRow = rowIndex;
        let nextCol = colIndex;
        if (e.key === "Tab") nextCol += 1;
        if (e.shiftKey && e.key === "Tab") nextCol -= 1;
        if (e.key === "Enter" && !e.shiftKey) nextRow += 1;
        if (e.key === "Enter" && e.shiftKey) nextRow -= 1;
        setTimeout(() => {
          cellRefs.current?.[nextRow]?.[nextCol]?.focus();
        }, 0);
      }
    }
  };

  return editing ? (
    <input
      ref={inputRef}
      value={value}
      aria-label="Edit cell"
      onChange={e => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        updateData(rowIndex, columnId, value);
      }}
      onKeyDown={handleKeyDown}
      className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring focus:border-blue-400"
    />
  ) : (
    <div
      ref={el => {
        if (!cellRefs.current[rowIndex]) cellRefs.current[rowIndex] = [];
        cellRefs.current[rowIndex][colIndex] = el;
      }}
      tabIndex={0}
      aria-label="Cell value"
      onClick={() => setEditing(true)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer px-2 py-1 w-full text-sm outline-none focus:ring-2 focus:ring-blue-400"
      role="button"
    >
      {value}
    </div>
  );
}

// Type guard to check for accessorKey
function isAccessorColumn(
  col: ColumnDef<Row, unknown>
): col is ColumnDef<Row, unknown> & { accessorKey: string } {
  return typeof (col as any).accessorKey === "string";
}

export default function SpreadsheetTable({
  data,
  setData,
}: {
  data: Row[];
  setData: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<any[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  // Keyboard navigation refs
  const cellRefs = useRef<(HTMLDivElement | null)[][]>([]);

  // Update data function
  const updateData = (rowIndex: number, columnId: string, value: any) => {
    setData(old =>
      old.map((row, index) =>
        index === rowIndex ? { ...row, [columnId]: value } : row
      )
    );
  };

  // Row selection
  const toggleRow = (rowIndex: number) => {
    setData(old =>
      old.map((row, idx) =>
        idx === rowIndex ? { ...row, selected: !row.selected } : row
      )
    );
  };
  const toggleAll = () => {
    const allSelected = data.length > 0 && data.every(row => row.selected);
    setData(old => old.map(row => ({ ...row, selected: !allSelected })));
  };

  // Define columns
  const columnDefs: ColumnDef<Row, unknown>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={data.length > 0 && data.every(row => row.selected)}
          onChange={toggleAll}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.original.selected || false}
          onChange={() => toggleRow(row.index)}
          aria-label="Select row"
        />
      ),
      size: 40,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: (cellProps: CellContext<Row, unknown>) => (
        <div className="flex items-center gap-2">
          <img
            src={cellProps.row.original.avatar}
            alt={cellProps.row.original.name}
            className="w-8 h-8 rounded-full"
          />
          <EditableCell
            value={cellProps.getValue()}
            rowIndex={cellProps.row.index}
            colIndex={1}
            columnId={cellProps.column.id}
            updateData={updateData}
            cellRefs={cellRefs}
          />
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (cellProps: CellContext<Row, unknown>) => (
        <EditableCell
          value={cellProps.getValue()}
          rowIndex={cellProps.row.index}
          colIndex={2}
          columnId={cellProps.column.id}
          updateData={updateData}
          cellRefs={cellRefs}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (cellProps: CellContext<Row, unknown>) => (
        <span
          className={
            "px-2 py-1 rounded-full text-xs font-bold " +
            statusColor(cellProps.getValue() as string)
          }
        >
          {cellProps.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: (cellProps: CellContext<Row, unknown>) => (
        <EditableCell
          value={cellProps.getValue()}
          rowIndex={cellProps.row.index}
          colIndex={4}
          columnId={cellProps.column.id}
          updateData={updateData}
          cellRefs={cellRefs}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <button
          className="p-2 rounded hover:bg-gray-100"
          onClick={() => console.log("Actions menu clicked")}
          aria-label="Actions"
        >
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
        </button>
      ),
      size: 40,
    },
  ];

  // Table instance
  const table = useReactTable<Row>({
    data,
    columns: columnDefs,
    state: {
      globalFilter,
      columnVisibility: Object.fromEntries(
        columnDefs
          .filter(isAccessorColumn)
          .map(col => [
            col.accessorKey,
            !hiddenColumns.includes(col.accessorKey),
          ])
      ),
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      updateData,
    },
  });

  // Toggle column visibility
  const toggleColumn = (colKey: string) => {
    setHiddenColumns(cols =>
      cols.includes(colKey)
        ? cols.filter(c => c !== colKey)
        : [...cols, colKey]
    );
  };

  // Simple CSV export
  const exportCSV = () => {
    const headers = columnDefs
      .filter(isAccessorColumn)
      .filter(col => !hiddenColumns.includes(col.accessorKey))
      .map(col => col.header as string)
      .join(",");
    const rows = data
      .map(row =>
        columnDefs
          .filter(isAccessorColumn)
          .filter(col => !hiddenColumns.includes(col.accessorKey))
          .map(col =>
            JSON.stringify(row[col.accessorKey as keyof Row] ?? "")
          )
          .join(",")
      )
      .join("\n");
    const csv = headers + "\n" + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tab click handler (logs to console)
  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    console.log(`Tab changed to: ${tabKey}`);
  };

  // Columns dropdown
  const columnsDropdown = (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
      {columnDefs
        .filter(isAccessorColumn)
        .map(col => (
          <label
            key={col.accessorKey}
            className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(col.accessorKey)}
              onChange={() => toggleColumn(col.accessorKey)}
              aria-label={`Toggle column ${col.header as string}`}
              className="accent-blue-600"
            />
            {col.header as string}
          </label>
        ))}
    </div>
  );

  // Pagination
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = data.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-6xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                  activeTab === tab.label
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => handleTabClick(tab.label)}
              >
                {tab.label}
                <span className="ml-1 inline-block bg-gray-200 text-xs px-2 py-0.5 rounded-full">
                  {tab.label === "All"
                    ? data.length
                    : tab.label === "Active"
                      ? data.filter(row => row.status === "Active").length
                      : tab.label === "Archived"
                        ? 0
                        : data.filter(row => row.status === tab.label).length}
                </span>
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative ml-4">
            <input
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
              placeholder="Search"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
          </div>
          {/* Invite Button */}
          <button
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
            onClick={() => console.log("Invite clicked")}
          >
            <PlusIcon className="w-5 h-5" />
            Invite
          </button>
          {/* Export Button */}
          <button
            className="ml-2 bg-gray-100 text-gray-700 px-4 py-2 rounded flex items-center gap-1 border border-gray-300"
            onClick={exportCSV}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export
          </button>
          {/* Columns Dropdown */}
          <div className="relative ml-2">
            <button
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded border border-gray-300 flex items-center gap-1"
              onClick={() => setShowColumnsDropdown(s => !s)}
            >
              Columns
              <ChevronDownIcon className="w-4 h-4" />
            </button>
            {showColumnsDropdown && columnsDropdown}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full bg-white text-sm">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="border-b border-gray-200 px-4 py-2 bg-gray-50 text-left font-semibold text-gray-700 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                    tabIndex={0}
                    aria-label={`Sort by ${String(
                      header.column.columnDef.header
                    )}`}
                  >
                    <span className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: (
                          <ChevronDownIcon className="w-3 h-3 ml-1 text-blue-600" />
                        ),
                        desc: (
                          <ChevronUpIcon className="w-3 h-3 ml-1 text-blue-600" />
                        ),
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-blue-50 transition">
                {row.getVisibleCells().map((cell, colIndex) => (
                  <td
                    key={cell.id}
                    className="border-b border-gray-100 px-4 py-2"
                  >
                    {flexRender(cell.column.columnDef.cell, {
                      ...cell.getContext(),
                      rowIndex,
                      colIndex,
                      cellRefs,
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="mt-4 flex gap-2 items-center justify-end">
        <span className="text-sm text-gray-500">Rows per page:</span>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 25, 50].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {startRow}-{endRow} of {totalRows}
        </span>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="p-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
