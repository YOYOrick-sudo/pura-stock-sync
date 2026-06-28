import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
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
  footerSlot?: React.ReactNode;
}

export function PolarSidebar({
  logo,
  items,
  collapsed,
  onToggle,
  footerSlot,
}: PolarSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className="polar-sidebar flex flex-col bg-background"
      style={{
        width: collapsed ? '68px' : '280px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'inset -1px 0 0 hsl(var(--border) / 0.6)',
      }}
    >
      {/* Header - 72px */}
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 10px' : '0 24px',
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-10 h-10 rounded-lg hover:bg-muted/60"
          >
            <PanelLeft
              className="h-5 w-5 text-muted-foreground"
              style={{ strokeWidth: 1.5 }}
            />
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{
          padding: collapsed ? '24px 10px' : '12px 16px 24px',
        }}
      >
        {!collapsed && (
          <div
            className="text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase"
            style={{ marginBottom: '12px', paddingLeft: '4px' }}
          >
            Menu
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  'polar-sidebar-item rounded-lg transition-colors relative',
                  item.active && 'bg-primary/[0.08]',
                  !item.active && 'hover:bg-muted/50',
                  !item.requiresCode && 'cursor-pointer'
                )}
                style={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: collapsed ? '0 12px' : '0 16px',
                  fontSize: '15px',
                  fontWeight: item.active ? 500 : 400,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'background-color 150ms ease',
                }}
              >
                {item.active && (
                  <span
                    className="bg-primary rounded-full"
                    style={{
                      position: 'absolute',
                      left: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '2px',
                      height: '18px',
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    'shrink-0 transition-colors',
                    item.active ? 'text-primary' : 'text-muted-foreground'
                  )}
                  style={{
                    width: collapsed ? '22px' : '20px',
                    height: collapsed ? '22px' : '20px',
                    marginRight: collapsed ? '0' : '14px',
                    strokeWidth: 1.75,
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
                      className="bg-card text-foreground border border-border rounded-lg px-3 py-2 text-sm shadow-md"
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
        <div style={{ padding: '16px 16px' }}>
          {footerSlot}
        </div>
      )}
    </aside>
  );
}
