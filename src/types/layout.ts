export type NavState = 'Default' | 'Hover' | 'Clicked'

export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  children?: NavItem[]
}

export interface SidebarProps {
  itemsTop: NavItem[]
  itemsBottom?: NavItem[]
  cta?: {
    label: string
    onClick?: () => void
  }
  ctaMenuItems?: { id: string; label: string; onClick?: () => void }[]
  collapsed?: boolean
  onToggleCollapsed?: (next: boolean) => void
  isHydrated?: boolean
}

export interface TopBarProps {
  userName: string
  userAvatarUrl?: string
  onAccountClick?: () => void
}

export interface LayoutProps {
  children: React.ReactNode
  ctaMenuItems?: { id: string; label: string; onClick?: () => void }[]
}
