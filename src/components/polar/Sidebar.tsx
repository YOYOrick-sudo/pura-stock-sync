import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface PolarSidebarItem {
  title: string;
  icon: React.ComponentType<any>;
  url: string;
  active: boolean;
  requiresCode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export interface PolarSidebarProps {
  logo: React.ReactNode;
  items: PolarSidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export function PolarSidebar({
  logo,
  items,
  collapsed,
  onToggle,
  headerSlot,
  footerSlot,
}: PolarSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className="polar-sidebar flex flex-col bg-[hsl(var(--sidebar-bg))] border-r border-border h-screen sticky top-0 transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ width: collapsed ? '64px' : '280px' }}
    >
      {/* Header - 84px */}
      <div
        className={cn(
          'border-b border-border h-[84px] flex items-center justify-between',
          collapsed ? 'px-3' : 'px-6'
        )}
      >
        <div
          className={cn(
            'transition-opacity duration-200 overflow-hidden',
            collapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          {!collapsed && logo}
        </div>

        {collapsed && (
          <div className="text-xl font-semibold text-primary">
            PV
          </div>
        )}

        <div className="flex items-center gap-2">
          {!collapsed && headerSlot}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-10 h-10 rounded-lg"
          >
            {collapsed ? (
              <Menu className="h-5 w-5 text-foreground" />
            ) : (
              <PanelLeft className="h-5 w-5 text-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto pt-7',
          collapsed ? 'px-2' : 'px-4'
        )}
      >
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;

            const itemContent = (
              <div
                key={item.url}
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  } else if (!item.requiresCode) {
                    navigate(item.url);
                  }
                }}
                className={cn(
                  'polar-sidebar-item rounded-lg transition-colors h-12 flex items-center text-[17px]',
                  collapsed ? 'px-3 justify-center' : 'px-4 justify-start',
                  item.active && 'bg-[hsl(var(--sidebar-active))] border border-border shadow-soft font-medium',
                  !item.active && 'border border-transparent hover:bg-[hsl(var(--sidebar-hover))] font-normal',
                  !item.requiresCode && 'cursor-pointer'
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-colors',
                    collapsed ? 'w-[22px] h-[22px]' : 'w-5 h-5 mr-3.5',
                    item.active ? 'text-primary' : 'text-muted-foreground'
                  )}
                  style={{ strokeWidth: 1.5 }}
                />
                {!collapsed && (
                  <span className={item.active ? 'text-foreground' : 'text-muted-foreground'}>
                    {item.title}
                  </span>
                )}
              </div>
            );

            if (collapsed) {
              return (
                <TooltipProvider key={item.url}>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      {itemContent}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-foreground text-background rounded-lg px-3 py-2 text-sm"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return itemContent;
          })}
        </div>
      </nav>

      {/* Footer slot for theme toggle */}
      {footerSlot && (
        <div className="border-t border-border p-3">
          {footerSlot}
        </div>
      )}
    </aside>
  );
}
