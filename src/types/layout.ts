export type NavState = 'Default' | 'Hover' | 'Clicked'

export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
}

export interface SidebarProps {
  itemsTop: NavItem[]
  itemsBottom?: NavItem[]
  cta?: {
    label: string
    onClick?: () => void
  }
  collapsed?: boolean
  onToggleCollapsed?: (next: boolean) => void
}

export interface TopBarProps {
  userName: string
  userAvatarUrl?: string
}

export interface LayoutProps {
  children: React.ReactNode
}
