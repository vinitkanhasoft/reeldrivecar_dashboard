"use client"

import {
  Building2Icon,
  GlobeIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SaveIcon,
  UserRoundIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountField } from "@/components/account/account-field"
import { cn } from "@/lib/utils"

type AccountFormState = {
  name: string
  email: string
  phone: string
  companyName: string
  country: string
  city: string
}

type AccountTabsProps = {
  form: AccountFormState
  isSaving: boolean
  onFieldChange: (field: keyof AccountFormState, value: string) => void
  onSave: () => void
}

export function AccountTabs({
  form,
  isSaving,
  onFieldChange,
  onSave,
}: AccountTabsProps) {
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList
        variant="line"
        className="w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/60 bg-card p-2"
      >
        <TabsTrigger
          value="personal"
          className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:shadow-sm"
        >
          <UserRoundIcon className="size-4" />
          Personal Info
        </TabsTrigger>
        <TabsTrigger
          value="dealer"
          className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:shadow-sm"
        >
          <Building2Icon className="size-4" />
          Dealer Info
        </TabsTrigger>
        <TabsTrigger
          value="contact"
          className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:shadow-sm"
        >
          <PhoneIcon className="size-4" />
          Contact
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="mt-5">
        <Card className="overflow-hidden border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRoundIcon className="size-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your identity and primary email.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 md:grid-cols-2">
            <AccountField
              id="name"
              label="Full Name"
              value={form.name}
              onChange={(value) => onFieldChange("name", value)}
              placeholder="Test Dealer"
            />
            <AccountField
              id="email"
              label="Email Address"
              value={form.email}
              onChange={(value) => onFieldChange("email", value)}
              type="email"
              placeholder="dealer@test.com"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dealer" className="mt-5">
        <Card className="overflow-hidden border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2Icon className="size-5" />
              Dealer Information
            </CardTitle>
            <CardDescription>Manage how your dealership appears across the system.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 md:grid-cols-2">
            <AccountField
              id="companyName"
              label="Dealer Name"
              value={form.companyName}
              onChange={(value) => onFieldChange("companyName", value)}
              placeholder="Dealer Pvt Ltd"
            />
            <AccountField
              id="city"
              label="City"
              value={form.city}
              onChange={(value) => onFieldChange("city", value)}
              placeholder="Ahmedabad"
            />
            <AccountField
              id="country"
              label="Country"
              value={form.country}
              onChange={(value) => onFieldChange("country", value)}
              placeholder="India"
            />
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <GlobeIcon className="size-4" />
                Dealer note
              </div>
              Keep your location and company name accurate so your listings and profile stay consistent.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="mt-5">
        <Card className="overflow-hidden border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PhoneIcon className="size-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Keep your business contact details current.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 md:grid-cols-2">
            <AccountField
              id="phone"
              label="Contact Number"
              value={form.phone}
              onChange={(value) => onFieldChange("phone", value)}
              placeholder="+919876543210"
            />
            <AccountField
              id="contact-email"
              label="Contact Email"
              value={form.email}
              onChange={(value) => onFieldChange("email", value)}
              type="email"
              placeholder="dealer@test.com"
            />
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <MapPinIcon className="size-4" />
                Contact visibility
              </div>
              These details can be used for dealer communication, support coordination, and account recovery.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="mt-5 flex items-center justify-end rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className={cn("min-w-36 rounded-xl", isSaving && "cursor-not-allowed")}
        >
          {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Tabs>
  )
}
