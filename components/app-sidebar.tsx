"use client"

import * as React from "react"
import { useEffect } from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  CarFrontIcon,
  CommandIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  ImageIcon,
  QuoteIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { checkProfile } from "@/store/slices/auth-slice"

function getRoleMenus(role?: string) {
  const normalizedRole = role?.toUpperCase()

  if (normalizedRole === "ADMIN") {
    return [
      { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon className="size-5" /> },
      { title: "Banners", url: "/banners", icon: <ImageIcon className="size-5" /> },
      { title: "Cars", url: "/cars", icon: <CarFrontIcon className="size-5" /> },
      { title: "Insurance", url: "/insurances", icon: <ShieldCheckIcon className="size-5" /> },
      { title: "Quote", url: "/free-quotes", icon: <QuoteIcon className="size-5" /> },
      { title: "Newsletter", url: "/newsletters", icon: <FileTextIcon className="size-5" /> },
      { title: "Blog", url: "/blogs", icon: <FileTextIcon className="size-5" /> },
      { title: "Testimonial", url: "/testimonials", icon: <StarIcon className="size-5" /> },
      { title: "Dealer", url: "/dealers", icon: <UsersIcon className="size-5" /> },
    ]
  }

  if (normalizedRole === "DEALER") {
    return [
      { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon className="size-5" /> },
      { title: "Cars", url: "/cars", icon: <CarFrontIcon className="size-5" /> },
    ]
  }

  return [
    { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon className="size-5" /> },
    { title: "Cars", url: "/cars", icon: <CarFrontIcon className="size-5" /> },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useAppDispatch()
  const { user, tokens } = useAppSelector((state) => state.auth)
  const navItems = getRoleMenus(user?.role)

  useEffect(() => {
    if (!tokens?.accessToken) {
      return
    }

    void dispatch(checkProfile())
  }, [dispatch, tokens?.accessToken])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || "Dealer",
            email: user?.email || "dealer@example.com",
            avatar: user?.avatar || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
