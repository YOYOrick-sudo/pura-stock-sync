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
      className="polar-sidebar flex flex-col bg-card border-r border-border"
      style={{
        width: collapsed ? '64px' : '280px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header - 84px */}
      <div
        className="border-b border-border"
        style={{
          height: '84px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 12px' : '0 24px',
        }}
      >
        <div
          style={{
            transition: 'opacity 200ms ease',
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
          }}
        >
          {!collapsed && logo}
        </div>

        {collapsed && (
          <div className="text-xl font-semibold text-primary">
            PV
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        className="flex-1 overflow-y-auto"
        style={{
          padding: collapsed ? '28px 8px' : '28px 16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  'polar-sidebar-item rounded-lg transition-colors',
                  item.active && 'bg-secondary border border-border shadow-soft',
                  !item.active && 'border border-transparent hover:bg-muted',
                  !item.requiresCode && 'cursor-pointer'
                )}
                style={{
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: collapsed ? '0 12px' : '0 16px',
                  fontSize: '17px',
                  fontWeight: item.active ? 500 : 400,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-colors',
                    item.active ? 'text-primary' : 'text-muted-foreground'
                  )}
                  style={{
                    width: collapsed ? '22px' : '20px',
                    height: collapsed ? '22px' : '20px',
                    marginRight: collapsed ? '0' : '14px',
                    strokeWidth: 1.5,
                  }}
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
