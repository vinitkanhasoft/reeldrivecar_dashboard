"use client"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

function downloadCsv(rows: Banner[]) {
  const header = ["Title", "Type", "Active", "Start Date", "End Date", "Keywords"]
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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000"

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

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const showingTo = Math.min(currentPage * pageSize, totalItems)
  const allRowsSelected = rows.length > 0 && selectedIds.size === rows.length
  const someRowsSelected = selectedIds.size > 0 && !allRowsSelected

  const refreshBanners = useCallback(async (
    page: number,
    options?: { silent?: boolean; search?: string }
  ) => {
    if (!tokens?.accessToken) {
      if (!options?.silent) {
        toast.error("Please login again")
      }
      return
    }

    try {
      setLoading(true)
      const searchValue = options?.search ?? appliedSearch
      const result = await getBannersApi({ page, limit: pageSize, search: searchValue }, tokens)
      setRows(result.banners)
      setCurrentPage(Math.min(Math.max(result.page, 1), Math.max(result.totalPages, 1)))
      setTotalItems(result.totalItems)
      setSelectedIds(new Set())

      if (!options?.silent) {
        toast.success("Banners refreshed")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load banners"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, pageSize, tokens])

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
      const message = error instanceof Error ? error.message : "Failed to delete banner"
      toast.error(message)
    }
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
      startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),
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
      const message = error instanceof Error ? error.message : "Failed to save banner"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function resolveBannerImage(image?: string) {
    if (!image) return ""
    if (image.startsWith("http://") || image.startsWith("https://")) return image
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

  const columns: ColumnDef<Banner>[] = [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={allRowsSelected || (someRowsSelected && "indeterminate")}
              onCheckedChange={(value) => toggleSelectAll(Boolean(value))}
              aria-label="Select all rows"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={(value) => toggleRowSelection(row.original.id, Boolean(value))}
              aria-label={`Select ${row.original.title}`}
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
              <div className="flex h-12 w-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                No image
              </div>
            )
          }

          return (
            <div className="relative h-14 w-24 overflow-hidden rounded-lg border bg-muted/30">
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
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => row.original.type || "-",
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (row.original.isActive ? "Active" : "Inactive"),
      },
      {
        accessorKey: "startDate",
        header: "Start",
        cell: ({ row }) => formatDate(row.original.startDate),
      },
      {
        accessorKey: "endDate",
        header: "End",
        cell: ({ row }) => formatDate(row.original.endDate),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                  size="icon"
                >
                  <EllipsisVerticalIcon className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openEditDrawer(row.original)}>
                  <PencilIcon className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewBanner(row.original)}>
                  <EyeIcon className="size-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(row.original.id)}>
                  <Trash2Icon className="size-4" />
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="space-y-2 px-6 py-6 sm:px-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Banner management</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Create, update, and manage homepage banners from one place.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Banner Section</CardTitle>
            <CardDescription>Manage banner records with create, update, export, and refresh actions.</CardDescription>
          </div>
          <div className="flex flex-row  items-center gap-2">
            <Button variant="outline" onClick={() => void refreshBanners(1)} disabled={loading}>
              <RefreshCwIcon className={loading ? "size-4 animate-spin" : "size-4"} />
              
            </Button>
            <Button variant="outline" onClick={() => downloadCsv(rows)}>
              <DownloadIcon className="size-4" />
              
            </Button>
            <Button onClick={openCreateDrawer}>
              <PlusIcon className="size-4" />
              Add Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    handleSearchSubmit()
                  }
                }}
                placeholder="Search by banner title, type, or keyword"
                className="pr-10 pl-9"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <XIcon className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSearchSubmit} disabled={loading}>
                <SearchIcon className="size-4" />
                Search
              </Button>
              {appliedSearch ? (
                <p className="text-sm text-muted-foreground">
                  Results for "{appliedSearch}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground"></p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No banners found. Click refresh or add a new banner.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={selectedIds.has(row.original.id) && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between px-4">
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              {selectedIds.size} of {rows.length} row(s) selected. Showing {showingFrom}-{showingTo} of {totalItems} items.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="banner-rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setCurrentPage(1)
                    setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="banner-rows-per-page">
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
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                size="icon"
                onClick={() => void refreshBanners(1, { silent: true, search: appliedSearch })}
                disabled={loading || currentPage <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => void refreshBanners(currentPage - 1, { silent: true, search: appliedSearch })}
                disabled={loading || currentPage <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => void refreshBanners(currentPage + 1, { silent: true, search: appliedSearch })}
                disabled={loading || currentPage >= totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => void refreshBanners(totalPages, { silent: true, search: appliedSearch })}
                disabled={loading || currentPage >= totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon className="size-4" />
              </Button>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      <Drawer open={openDrawer} onOpenChange={setOpenDrawer} direction="right">
        <DrawerContent className="sm:max-w-xl">
          <DrawerHeader className="border-b px-6 py-5">
            <DrawerTitle>{editing ? "Edit Banner" : "Create Banner"}</DrawerTitle>
            <DrawerDescription className="max-w-md text-sm leading-6">
              Fill the banner details and save. Image upload uses form-data.
            </DrawerDescription>
          </DrawerHeader>

          <div className="max-h-[calc(100vh-11rem)] space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5 rounded-2xl border bg-card p-5">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">Title</Label>
                  <Input
                    id="banner-title"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-description">Description</Label>
                  <textarea
                    id="banner-description"
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="flex min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-alt">Alt Text</Label>
                  <Input
                    id="banner-alt"
                    value={form.altText}
                    onChange={(event) => setForm((prev) => ({ ...prev, altText: event.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banner-type">Type</Label>
                    <Input
                      id="banner-type"
                      value={form.type}
                      onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                      placeholder="HOME"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner-keywords">Keywords</Label>
                    <Input
                      id="banner-keywords"
                      value={form.keywords}
                      onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
                      placeholder="sale, discount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banner-start">Start Date</Label>
                    <Input
                      id="banner-start"
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner-end">End Date</Label>
                    <Input
                      id="banner-end"
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-active">Active Status</Label>
                  <select
                    id="banner-active"
                    value={String(form.isActive)}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))}
                    className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border bg-card p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Banner Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Cloudinary and uploaded images will appear here before saving.
                  </p>
                </div>

                <div className="relative aspect-4/3 overflow-hidden rounded-2xl border bg-muted/30">
                  {previewImageUrl ? (
                    <Image
                      src={previewImageUrl}
                      alt={form.altText || form.title || "Banner preview"}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Banner image preview will appear here.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-image">Banner Image</Label>
                  <Input
                    id="banner-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        image: event.target.files?.[0] || null,
                      }))
                    }
                  />
                </div>

                {editing?.image ? (
                  <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Current image is loaded from the saved banner record.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t px-6 py-4">
            <Button onClick={submitForm} disabled={submitting}>
              {submitting ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              {editing ? "Update Banner" : "Create Banner"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
