"use client"
// Add missing ImageIcon import
import {
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ImageIcon,
  InfoIcon,
  SettingsIcon,
} from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  createBannerApi,
  deleteBannerApi,
  getBannersApi,
  updateBannerApi,
  type Banner,
  type BannerFormPayload,
} from "@/lib/api/banners-api"
import { useAppSelector } from "@/store/hooks"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type BannerFormState = {
  title: string
  description: string
  altText: string
  type: string
  keywords: string
  isActive: boolean
  startDate: string
  endDate: string
  image: File | null
}

const initialFormState: BannerFormState = {
  title: "",
  description: "",
  altText: "",
  type: "HOME",
  keywords: "",
  isActive: true,
  startDate: "",
  endDate: "",
  image: null,
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function truncateText(value: string | undefined, maxChars: number) {
  const text = (value || "").trim()
  if (!text) return "-"

  if (text.length <= maxChars) return text

  return `${text.slice(0, maxChars)}...`
}

function downloadCsv(rows: Banner[]) {
  const header = [
    "Title",
    "Type",
    "Active",
    "Start Date",
    "End Date",
    "Keywords",
  ]
  const lines = rows.map((row) => {
    return [
      row.title,
      row.type || "",
      row.isActive ? "Yes" : "No",
      row.startDate || "",
      row.endDate || "",
      row.keywords || "",
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  })

  const content = [header.join(","), ...lines].join("\n")
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "banners.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export function BannerSection() {
  const { tokens } = useAppSelector((state) => state.auth)
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000"

  const [rows, setRows] = useState<Banner[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState<BannerFormState>(initialFormState)
  const [previewImageUrl, setPreviewImageUrl] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [statusBanner, setStatusBanner] = useState<Banner | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, totalItems)
  const allRowsSelected = rows.length > 0 && selectedIds.size === rows.length
  const someRowsSelected = selectedIds.size > 0 && !allRowsSelected

  const refreshBanners = useCallback(
    async (page: number, options?: { silent?: boolean; search?: string }) => {
      if (!tokens?.accessToken) {
        if (!options?.silent) {
          toast.error("Please login again")
        }
        return
      }

      try {
        setLoading(true)
        const searchValue = options?.search ?? appliedSearch
        const result = await getBannersApi(
          { page, limit: pageSize, search: searchValue },
          tokens
        )
        setRows(result.banners)
        setCurrentPage(
          Math.min(Math.max(result.page, 1), Math.max(result.totalPages, 1))
        )
        setTotalItems(result.totalItems)
        setSelectedIds(new Set())

        if (!options?.silent) {
          toast.success("Banners refreshed")
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load banners"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [appliedSearch, pageSize, tokens]
  )

  useEffect(() => {
    if (!tokens?.accessToken) {
      return
    }

    void refreshBanners(1, { silent: true })
  }, [refreshBanners, tokens?.accessToken])

  useEffect(() => {
    if (form.image) {
      const objectUrl = URL.createObjectURL(form.image)
      setPreviewImageUrl(objectUrl)

      return () => {
        URL.revokeObjectURL(objectUrl)
      }
    }

    if (editing?.image) {
      setPreviewImageUrl(resolveBannerImage(editing.image))
      return
    }

    setPreviewImageUrl("")
  }, [editing?.image, form.image])

  async function handleDelete(bannerId: string) {
    if (!tokens?.accessToken) {
      toast.error("Please login again")
      return
    }

    if (!window.confirm("Delete this banner?")) {
      return
    }

    try {
      await deleteBannerApi(bannerId, tokens)
      toast.success("Banner deleted")
      await refreshBanners(currentPage, { silent: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete banner"
      toast.error(message)
    }
  }

  async function handleBulkDelete() {
    if (!tokens?.accessToken) {
      toast.error("Please login again")
      return
    }

    if (selectedIds.size === 0) return

    try {
      setBulkDeleting(true)
      const deletePromises = Array.from(selectedIds).map((id) =>
        deleteBannerApi(id, tokens)
      )
      await Promise.all(deletePromises)
      toast.success(`${selectedIds.size} banner(s) deleted successfully`)
      setShowBulkDeleteDialog(false)
      await refreshBanners(currentPage, { silent: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete banners"
      toast.error(message)
    } finally {
      setBulkDeleting(false)
    }
  }

  function openStatusDialog(banner: Banner) {
    setStatusBanner(banner)
  }

  async function handleStatusToggle() {
    if (!tokens?.accessToken || !statusBanner?.id) {
      toast.error("Please login again")
      return
    }

    try {
      setStatusUpdating(true)
      const nextStatus = !(statusBanner.isActive ?? true)

      await updateBannerApi(
        statusBanner.id,
        {
          isActive: nextStatus,
        },
        tokens
      )

      setRows((prev) =>
        prev.map((row) =>
          row.id === statusBanner.id ? { ...row, isActive: nextStatus } : row
        )
      )
      setStatusBanner(null)
      toast.success(
        `Banner ${nextStatus ? "activated" : "deactivated"} successfully`
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update banner status"
      toast.error(message)
    } finally {
      setStatusUpdating(false)
    }
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function openCreateDrawer() {
    setEditing(null)
    setForm(initialFormState)
    setPreviewImageUrl("")
    setOpenDrawer(true)
  }

  function openEditDrawer(banner: Banner) {
    setEditing(banner)
    setForm({
      title: banner.title || "",
      description: banner.description || "",
      altText: banner.altText || "",
      type: banner.type || "HOME",
      keywords: banner.keywords || "",
      isActive: banner.isActive ?? true,
      startDate: banner.startDate ? banner.startDate.slice(0, 16) : "",
      endDate: banner.endDate ? banner.endDate.slice(0, 16) : "",
      image: null,
    })
    setPreviewImageUrl(resolveBannerImage(banner.image))
    setOpenDrawer(true)
  }

  function handleViewBanner(banner: Banner) {
    const imageUrl = resolveBannerImage(banner.image)

    if (!imageUrl) {
      toast.error("No image available for this banner")
      return
    }

    window.open(imageUrl, "_blank", "noopener,noreferrer")
  }

  function handleSearchSubmit() {
    const nextSearch = searchInput.trim()
    setAppliedSearch(nextSearch)
    void refreshBanners(1, { silent: true, search: nextSearch })
  }

  function handleClearSearch() {
    setSearchInput("")
    setAppliedSearch("")
    void refreshBanners(1, { silent: true, search: "" })
  }

  async function submitForm() {
    if (!tokens?.accessToken) {
      toast.error("Please login again")
      return
    }

    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }

    const payload: BannerFormPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      altText: form.altText.trim(),
      type: form.type.trim() || "HOME",
      keywords: form.keywords.trim(),
      isActive: form.isActive,
      startDate: form.startDate
        ? new Date(form.startDate).toISOString()
        : new Date().toISOString(),
      endDate: form.endDate
        ? new Date(form.endDate).toISOString()
        : new Date().toISOString(),
      image: form.image,
    }

    try {
      setSubmitting(true)

      if (editing?.id) {
        await updateBannerApi(editing.id, payload, tokens)
        toast.success("Banner updated")
      } else {
        await createBannerApi(payload, tokens)
        toast.success("Banner created")
      }

      setOpenDrawer(false)
      setForm(initialFormState)
      setEditing(null)
      await refreshBanners(currentPage, { silent: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save banner"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function resolveBannerImage(image?: string) {
    if (!image) return ""
    if (image.startsWith("http://") || image.startsWith("https://"))
      return image
    if (image.startsWith("/")) return `${baseUrl}${image}`
    return `${baseUrl}/${image}`
  }

  function toggleRowSelection(bannerId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(bannerId)
      } else {
        next.delete(bannerId)
      }
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set())
      return
    }

    setSelectedIds(new Set(rows.map((row) => row.id)))
  }

  const getStatusBadge = (banner: Banner) => {
    const active = banner.isActive ?? true

    return active ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-full border-green-200 bg-green-50 px-3 text-green-700 hover:border-green-300 hover:bg-green-100"
        onClick={() => openStatusDialog(banner)}
        disabled={statusUpdating}
      >
        Active
      </Button>
    ) : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-full border-red-200 bg-red-50 px-3 text-red-700 hover:border-red-300 hover:bg-red-100"
        onClick={() => openStatusDialog(banner)}
        disabled={statusUpdating}
      >
        Inactive
      </Button>
    )
  }

  const columns: ColumnDef<Banner>[] = [
    {
      id: "select",
      header: () => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allRowsSelected || (someRowsSelected && "indeterminate")}
            onCheckedChange={(value) => toggleSelectAll(Boolean(value))}
            aria-label="Select all rows"
            className="border-2"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(value) =>
              toggleRowSelection(row.original.id, Boolean(value))
            }
            aria-label={`Select ${row.original.title}`}
            className="border-2"
          />
        </div>
      ),
    },
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const imageSrc = resolveBannerImage(row.original.image)

        if (!imageSrc) {
          return (
            <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
              No image
            </div>
          )
        }

        return (
          <div className="relative h-14 w-24 overflow-hidden rounded-lg border bg-muted/30 shadow-sm transition-all hover:shadow-md">
            <Image
              src={imageSrc}
              alt={row.original.altText || row.original.title || "Banner image"}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        )
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium" title={row.original.title || ""}>
          {truncateText(row.original.title, 20)}
          {row.original.description && (
            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.type || "HOME"}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.startDate)}
        </span>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.endDate)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground hover:bg-muted data-[state=open]:bg-muted"
                size="icon"
              >
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => openEditDrawer(row.original)}
                className="cursor-pointer"
              >
                <PencilIcon className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleViewBanner(row.original)}
                className="cursor-pointer"
              >
                <EyeIcon className="mr-2 size-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDelete(row.original.id)}
                className="cursor-pointer"
              >
                <Trash2Icon className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
      {/* Header Section */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/30 shadow-sm">
        <div className="space-y-2 px-6 py-8 sm:px-8">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Banner Management
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Create, update, and manage homepage banners from one central
            location.
          </p>
        </div>
      </section>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Banner Section</CardTitle>
            <CardDescription>
              Manage banner records with create, update, export, and refresh
              actions.
            </CardDescription>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void refreshBanners(1)}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCwIcon
                className={loading ? "size-4 animate-spin" : "size-4"}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadCsv(rows)}
              className="gap-2"
              disabled={rows.length === 0}
            >
              <DownloadIcon className="size-4" />
              Export
            </Button>
            <Button
              onClick={openCreateDrawer}
              className="gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <PlusIcon className="size-4" />
              Add Banner
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Bulk Actions Bar - Redesigned */}
          {selectedIds.size > 0 && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-red-700">
                    {selectedIds.size} banner(s) selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-7 gap-1 text-xs text-red-600 hover:bg-red-100 hover:text-red-700"
                  >
                    <XIcon className="size-3" />
                    Clear selection
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="gap-2 bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2Icon className="size-4" />
                  Delete Selected ({selectedIds.size})
                </Button>
              </div>
            </div>
          )}

          {/* Search Section - No border */}
          <div className="mb-6 flex flex-col gap-3 rounded-xl bg-muted/20 p-4 md:flex-row md:items-center">
            <div className="relative w-full max-w-md">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    handleSearchSubmit()
                  }
                }}
                placeholder="Search by banner title, type, or keyword..."
                className="h-10 bg-background pr-10 pl-9"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="default"
                onClick={handleSearchSubmit}
                disabled={loading}
                className="gap-2 bg-primary text-white hover:bg-primary/90"
              >
                <SearchIcon className="size-4" />
                Search
              </Button>
              {appliedSearch && (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  Results for "{appliedSearch}"
                  <button
                    onClick={handleClearSearch}
                    className="ml-1 hover:text-foreground"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>

          {/* Table Section - No border */}
          <div className="overflow-hidden rounded-xl bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="font-semibold"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="rounded-full bg-muted p-3">
                          <SearchIcon className="size-6" />
                        </div>
                        <p>No banners found.</p>
                        <p className="text-sm">
                          Click refresh or add a new banner to get started.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={
                        selectedIds.has(row.original.id) && "selected"
                      }
                      className="group hover:bg-muted/30 data-[state=selected]:bg-primary/5"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Section */}
          <div className="mt-5 flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
            <div className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? (
                <span className="font-medium text-foreground">
                  {selectedIds.size}
                </span>
              ) : (
                <span>0</span>
              )}{" "}
              of <span className="font-medium">{rows.length}</span> row(s)
              selected.{" "}
              <span className="hidden sm:inline">
                Showing <span className="font-medium">{showingFrom}</span> to{" "}
                <span className="font-medium">{showingTo}</span> of{" "}
                <span className="font-medium">{totalItems}</span> items.
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="banner-rows-per-page"
                  className="text-sm whitespace-nowrap"
                >
                  Rows per page
                </Label>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setCurrentPage(1)
                    setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-9 w-20">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm font-medium whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      void refreshBanners(1, {
                        silent: true,
                        search: appliedSearch,
                      })
                    }
                    disabled={loading || currentPage <= 1}
                  >
                    <ChevronsLeftIcon className="size-4" />
                    <span className="sr-only">First page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      void refreshBanners(currentPage - 1, {
                        silent: true,
                        search: appliedSearch,
                      })
                    }
                    disabled={loading || currentPage <= 1}
                  >
                    <ChevronLeftIcon className="size-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      void refreshBanners(currentPage + 1, {
                        silent: true,
                        search: appliedSearch,
                      })
                    }
                    disabled={loading || currentPage >= totalPages}
                  >
                    <ChevronRightIcon className="size-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      void refreshBanners(totalPages, {
                        silent: true,
                        search: appliedSearch,
                      })
                    }
                    disabled={loading || currentPage >= totalPages}
                  >
                    <ChevronsRightIcon className="size-4" />
                    <span className="sr-only">Last page</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(statusBanner)}
        onOpenChange={(open) => {
          if (!open && !statusUpdating) {
            setStatusBanner(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {statusBanner?.isActive ?? true ? (
                <ClockIcon className="size-5 text-amber-600" />
              ) : (
                <CheckCircleIcon className="size-5 text-green-600" />
              )}
              {(statusBanner?.isActive ?? true)
                ? "Deactivate Banner"
                : "Activate Banner"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {(statusBanner?.isActive ?? true)
                  ? "Do you want to mark this banner as inactive?"
                  : "Do you want to mark this banner as active?"}
              </span>
              <span className="block text-sm text-muted-foreground">
                Banner: {statusBanner?.title || "Untitled banner"}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusUpdating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusToggle}
              disabled={statusUpdating}
              className="gap-2"
            >
              {statusUpdating ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {(statusBanner?.isActive ?? true) ? (
                    <ClockIcon className="size-4" />
                  ) : (
                    <CheckCircleIcon className="size-4" />
                  )}
                  {(statusBanner?.isActive ?? true)
                    ? "Deactivate"
                    : "Activate"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2Icon className="size-5" />
              Delete {selectedIds.size} Banner{selectedIds.size > 1 ? "s" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
                <span className="block">
                Are you sure you want to delete {selectedIds.size} selected
                banner{selectedIds.size > 1 ? "s" : ""}?
                </span>
                <span className="block text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the
                selected banners and remove them from your servers.
                </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="gap-2 bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDeleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2Icon className="size-4" />
                  Delete {selectedIds.size} Banner
                  {selectedIds.size > 1 ? "s" : ""}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Drawer */}
      <Drawer open={openDrawer} onOpenChange={setOpenDrawer} direction="right">
        <DrawerContent className="sm:max-w-2xl">
          <DrawerHeader className="border-b px-6 py-4">
            <DrawerTitle className="text-xl font-semibold">
              {editing ? "Edit Banner" : "Create New Banner"}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Fill in the banner details below. Fields marked with * are
              required.
            </DrawerDescription>
          </DrawerHeader>

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Image Upload with Drag & Drop */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Banner Image <span className="text-destructive">*</span>
                </Label>

                <div
                  className={`group relative rounded-xl border-2 border-dashed transition-all ${
                    previewImageUrl
                      ? "border-primary/30 bg-primary/5"
                      : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const file = e.dataTransfer.files?.[0]
                    if (file && file.type.startsWith("image/")) {
                      setForm((prev) => ({ ...prev, image: file }))
                    }
                  }}
                >
                  {previewImageUrl ? (
                    <>
                      {/* Image Preview */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                        <Image
                          src={previewImageUrl}
                          alt={form.altText || "Banner preview"}
                          fill
                          className="object-cover"
                        />

                        {/* Hover Overlay with Actions */}
                        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-2 bg-white text-black shadow-lg hover:bg-white/90"
                            onClick={() =>
                              document.getElementById("banner-image")?.click()
                            }
                          >
                            <ImageIcon className="size-4" />
                            Replace
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-2 bg-destructive text-white shadow-lg hover:bg-destructive/90"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, image: null }))
                              // Clear the file input
                              const fileInput =
                                document.getElementById("banner-image")
                              if (fileInput instanceof HTMLInputElement) {
                                fileInput.value = ""
                              }
                            }}
                          >
                            <Trash2Icon className="size-4" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Image Info Bar */}
                      <div className="flex items-center justify-between rounded-b-xl border-t bg-muted/50 px-4 py-2">
                        <span className="text-xs text-muted-foreground">
                          {form.image?.name || "Image uploaded"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {form.image
                            ? `${(form.image.size / 1024 / 1024).toFixed(2)} MB`
                            : "Preview"}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    /* Upload Area */
                    <label
                      htmlFor="banner-image"
                      className="flex cursor-pointer flex-col items-center justify-center gap-3 p-8"
                    >
                      <div className="rounded-full bg-muted p-4">
                        <ImageIcon className="size-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-sm font-medium">
                          Drag & drop or{" "}
                          <span className="text-primary">browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supported formats: JPG, PNG, GIF (Max 5MB)
                        </p>
                      </div>
                    </label>
                  )}

                  <Input
                    id="banner-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        setForm((prev) => ({ ...prev, image: file }))
                      }
                    }}
                  />
                </div>
              </div>

              {/* Form Fields - No boxes, just fields */}
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="banner-title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="banner-title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Enter banner title"
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="banner-description"
                    className="text-sm font-medium"
                  >
                    Description
                  </Label>
                  <textarea
                    id="banner-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Enter banner description..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  />
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                  <Label htmlFor="banner-alt" className="text-sm font-medium">
                    Alt Text
                  </Label>
                  <Input
                    id="banner-alt"
                    value={form.altText}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        altText: event.target.value,
                      }))
                    }
                    placeholder="Alternative text for accessibility"
                    className="h-11"
                  />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="banner-type"
                      className="text-sm font-medium"
                    >
                      Type
                    </Label>
                    <Input
                      id="banner-type"
                      value={form.type}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          type: event.target.value,
                        }))
                      }
                      placeholder="e.g., HOME, PROMO"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="banner-keywords"
                      className="text-sm font-medium"
                    >
                      Keywords
                    </Label>
                    <Input
                      id="banner-keywords"
                      value={form.keywords}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          keywords: event.target.value,
                        }))
                      }
                      placeholder="sale, discount, offer"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="banner-start"
                      className="text-sm font-medium"
                    >
                      Start Date
                    </Label>
                    <Input
                      id="banner-start"
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner-end" className="text-sm font-medium">
                      End Date
                    </Label>
                    <Input
                      id="banner-end"
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label
                    htmlFor="banner-active"
                    className="text-sm font-medium"
                  >
                    Status
                  </Label>
                  <select
                    id="banner-active"
                    value={String(form.isActive)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: event.target.value === "true",
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Show current image info if editing */}
                {editing?.image && !form.image && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    <InfoIcon className="size-4" />
                    <span>Current image: {editing.image}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t px-6 py-4">
            <div className="flex justify-end gap-3">
              <DrawerClose asChild>
                <Button variant="outline" className="h-11 gap-2 px-6">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={submitForm}
                disabled={submitting || !form.title || !previewImageUrl}
                className="h-11 min-w-[140px] gap-2 bg-primary text-white hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    {editing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editing ? (
                      <PencilIcon className="size-4" />
                    ) : (
                      <PlusIcon className="size-4" />
                    )}
                    {editing ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}