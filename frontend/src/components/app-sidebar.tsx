import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  LogOut,
  ChevronUp,
  ChevronRight,
  Lock,
  Building2,
  Settings,
  Gem,
  Package,
  Warehouse,
  UserCircle,
  PackageSearch,
  ShoppingCart,
  Computer,
  Box,
  Scale,
  FileBarChart,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { usePermission } from '@/hooks/usePermission';
import { getAppName, getAppSubtitle } from '@/lib/page-title';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { path: '/pos', label: 'POS', icon: Computer, permission: 'transactions.view' },
  { 
    path: '/master-data', 
    label: 'Master Data', 
    icon: Package,
    permission: 'gold-categories.view',
    submenu: [
      { path: '/gold-categories', label: 'Kualitas Emas', icon: Gem, permission: 'gold-categories.view' },
      { path: '/products', label: 'Produk', icon: Package, permission: 'products.view' },
      { path: '/locations', label: 'Lokasi', icon: Warehouse, permission: 'locations.view' },
      { path: '/storage-boxes', label: 'Kotak Penyimpanan', icon: Box, permission: 'locations.view' },
    ]
  },
  { 
    path: '/inventory', 
    label: 'Inventori', 
    icon: PackageSearch,
    permission: 'stocks.view',
    submenu: [
      { path: '/stocks', label: 'Stok', icon: PackageSearch, permission: 'stocks.view' },
      { path: '/raw-materials', label: 'Bahan Baku', icon: Scale, permission: 'raw-materials.view' },
    ]
  },
  { path: '/members', label: 'Member', icon: UserCircle, permission: 'members.view' },
  { 
    path: '/transactions', 
    label: 'Transaksi', 
    icon: ShoppingCart,
    permission: 'transactions.view',
  },
  { 
    path: '/reports', 
    label: 'Laporan', 
    icon: FileBarChart,
    permission: 'reports.view',
  },
  { 
    path: '/users', 
    label: 'User Management', 
    icon: Users,
    permission: 'users.view',
    submenu: [
      { path: '/users', label: 'Users', icon: Users, permission: 'users.view' },
      { path: '/roles', label: 'Roles', icon: Shield, permission: 'roles.view' },
      { path: '/permissions', label: 'Permissions', icon: Lock, permission: 'permissions.view' },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { state } = useSidebar();
  const { hasPermission } = usePermission();
  const [appName, setAppName] = useState(getAppName());
  const [appSubtitle, setAppSubtitle] = useState(getAppSubtitle());

  // Listen for storage changes to update app name/subtitle in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      setAppName(getAppName());
      setAppSubtitle(getAppSubtitle());
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }).map(item => {
    if ('submenu' in item && item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter((sub: any) => {
          if (!sub.permission) return true;
          return hasPermission(sub.permission);
        })
      };
    }
    return item;
  });

  return (
    <Sidebar collapsible="icon" className="border-r-0" variant="inset">
      <SidebarHeader className="">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-transparent">
              <a href="/" className="font-semibold">
                <div className="flex aspect-square size-7 items-center justify-center rounded bg-foreground text-background">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">{appName}</span>
                  <span className="text-xs text-muted-foreground">{appSubtitle}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground font-medium">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  ('submenu' in item && item.submenu && item.submenu.some((sub: any) => location.pathname === sub.path));
                
                // Menu with submenu
                if ('submenu' in item && item.submenu) {
                  // If sidebar collapsed, use dropdown menu
                  if (state === 'collapsed') {
                    return (
                      <DropdownMenu key={item.path}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuItem>
                                  <SidebarMenuButton isActive={isActive}>
                                    <Icon />
                                    <span>{item.label}</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent side="right" align="start" className="w-48">
                          {item.submenu.map((subItem: any) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            
                            return (
                              <DropdownMenuItem key={subItem.path} asChild>
                                <Link 
                                  to={subItem.path}
                                  className={isSubActive ? 'bg-accent' : ''}
                                >
                                  <SubIcon className="mr-2 h-4 w-4" />
                                  <span>{subItem.label}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  
                  // If sidebar expanded, use collapsible
                  return (
                    <Collapsible key={item.path} asChild defaultOpen={isActive}>
                      <SidebarMenuItem>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton isActive={isActive}>
                                  <Icon />
                                  <span>{item.label}</span>
                                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="group-data-[state=expanded]/sidebar-wrapper:hidden">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map((subItem: any) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = location.pathname === subItem.path;
                              
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <SidebarMenuSubButton asChild isActive={isSubActive}>
                                          <Link to={subItem.path}>
                                            <SubIcon />
                                            <span>{subItem.label}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="group-data-[state=expanded]/sidebar-wrapper:hidden">
                                        {subItem.label}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                
                // Simple menu item
                return (
                  <SidebarMenuItem key={item.path}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link to={item.path}>
                              <Icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="group-data-[state=expanded]/sidebar-wrapper:hidden">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{user?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
