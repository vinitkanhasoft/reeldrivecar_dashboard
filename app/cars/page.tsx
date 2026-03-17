import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CarFrontIcon, DownloadIcon, PlusIcon, RefreshCwIcon } from "lucide-react"

export default function DashboardCarsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/30 shadow-sm">
        <div className="space-y-2 px-6 py-8 sm:px-8">
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Car Management
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Manage inventory, update vehicle records, and keep your listings organized from one place.
          </p>
        </div>
      </section>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Car Section</CardTitle>
            <CardDescription>
              Create, review, and maintain vehicle listings.
            </CardDescription>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCwIcon className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <DownloadIcon className="size-4" />
              Export
            </Button>
            <Button className="gap-2 bg-primary text-white hover:bg-primary/90">
              <PlusIcon className="size-4" />
              Add Car
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CarFrontIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Car inventory overview</p>
                <p className="text-xs text-muted-foreground">
                  Your data table and filters can be added here next.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="font-medium">
              Coming Soon
            </Badge>
          </div>

          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 text-center">
            <h2 className="text-lg font-semibold">Cars Table UI Ready</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              This section is styled and prepared for your car listing table, filters, pagination, and actions to match the banner management experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
