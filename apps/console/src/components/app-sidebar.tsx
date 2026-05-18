"use client"

import * as React from "react"
import {
  LayoutPanelLeft,
  LayoutDashboard,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  Shield,
  AlertTriangle,
  Settings,
  HelpCircle,
  CreditCard,
  LayoutTemplate,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { PERMISSIONS, Permission } from "@guidora/contracts"
import { Logo } from "@/components/logo"
import { SidebarNotification } from "@/components/sidebar-notification"
import { useSession } from "@/lib/session"
import { filterNavGroupsByPermissions } from "@/lib/rbac"

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

const data = {
  navGroups: [
    {
      label: "Dashboards",
      items: [
        {
          title: "Dashboard 1",
          url: "/dashboard",
          icon: LayoutDashboard,
          requiredPermission: PERMISSIONS.DASHBOARD_READ,
        },
        {
          title: "Dashboard 2",
          url: "/dashboard-2",
          icon: LayoutPanelLeft,
          requiredPermission: PERMISSIONS.DASHBOARD_READ,
        },
      ],
    },
    {
      label: "Apps",
      items: [
        {
          title: "Mail",
          url: "/mail",
          icon: Mail,
        },
        {
          title: "Tasks",
          url: "/tasks",
          icon: CheckSquare,
        },
        {
          title: "Chat",
          url: "/chat",
          icon: MessageCircle,
        },
        {
          title: "Calendar",
          url: "/calendar",
          icon: Calendar,
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
          requiredPermission: PERMISSIONS.USERS_READ,
        },
      ],
    },
    {
      label: "Pages",
      items: [
        {
          title: "Landing",
          url: "/landing",
          target: "_blank",
          icon: LayoutTemplate,
        },
        {
          title: "Auth Pages",
          url: "#",
          icon: Shield,
          items: [
            {
              title: "Sign In 1",
              url: "/sign-in",
            },
            {
              title: "Sign In 2",
              url: "/sign-in-2",
            },
            {
              title: "Sign In 3",
              url: "/sign-in-3",
            },
            {
              title: "Sign Up 1",
              url: "/sign-up",
            },
            {
              title: "Sign Up 2",
              url: "/sign-up-2",
            },
            {
              title: "Sign Up 3",
              url: "/sign-up-3",
            },
            {
              title: "Forgot Password 1",
              url: "/forgot-password",
            },
            {
              title: "Forgot Password 2",
              url: "/forgot-password-2",
            },
            {
              title: "Forgot Password 3",
              url: "/forgot-password-3",
            }
          ],
        },
        {
          title: "Errors",
          url: "#",
          icon: AlertTriangle,
          items: [
            {
              title: "Unauthorized",
              url: "/errors/unauthorized",
            },
            {
              title: "Forbidden",
              url: "/errors/forbidden",
            },
            {
              title: "Not Found",
              url: "/errors/not-found",
            },
            {
              title: "Internal Server Error",
              url: "/errors/internal-server-error",
            },
            {
              title: "Under Maintenance",
              url: "/errors/under-maintenance",
            },
          ],
        },
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "User Settings",
              url: "/settings/user",
              requiredPermission: PERMISSIONS.SETTINGS_READ,
            },
            {
              title: "Account Settings",
              url: "/settings/account",
              requiredPermission: PERMISSIONS.SETTINGS_READ,
            },
            {
              title: "Plans & Billing",
              url: "/settings/billing",
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
            },
            {
              title: "Connections",
              url: "/settings/connections",
            },
          ],
        },
        {
          title: "FAQs",
          url: "/faqs",
          icon: HelpCircle,
        },
        {
          title: "Pricing",
          url: "/pricing",
          icon: CreditCard,
        },
      ],
    },
  ],
} 

type SidebarNavItem = {
  title: string
  url: string
  icon?: LucideIcon
  target?: string
  requiredPermission?: Permission
  items?: SidebarNavItem[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useSession()
  const navGroups = filterNavGroupsByPermissions(
    data.navGroups as { label: string; items: SidebarNavItem[] }[],
    user?.permissions ?? []
  )

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Guidora</span>
                  <span className="truncate text-xs">Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser user={{ name: user?.name ?? "Guidora", email: user?.email ?? "", avatar: "" }} onLogout={() => void logout()} />
      </SidebarFooter>
    </Sidebar>
  )
}
