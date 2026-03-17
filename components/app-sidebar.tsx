"use client"

import * as React from "react"

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
import { CarFrontIcon, CommandIcon, ImageIcon } from "lucide-react"
import { useAppSelector } from "@/store/hooks"

function getRoleMenus(role?: string) {
  const normalizedRole = role?.toUpperCase()

  if (normalizedRole === "ADMIN") {
    return [
      {
        title: "Banners",
        url: "/banners",
        icon: <ImageIcon />,
      },
      {
        title: "Cars",
        url: "/dashboard",
        icon: <CarFrontIcon />,
      },
    ]
  }

  return [
    {
      title: "Cars",
      url: "/dashboard",
      icon: <CarFrontIcon />,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector((state) => state.auth.user)
  const navItems = getRoleMenus(user?.role)

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
