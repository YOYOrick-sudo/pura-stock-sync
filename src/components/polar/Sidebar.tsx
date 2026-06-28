import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelLeft, Lock } from 'lucide-react';
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

const OVERVIEW_URLS = new Set(['/dashboard', '/taken-bediening']);

function groupItems(items: PolarSidebarItem[]) {
  const overzicht: PolarSidebarItem[] = [];
  const beheer: PolarSidebarItem[] = [];
  for (const item of items) {
    if (OVERVIEW_URLS.has(item.url)) overzicht.push(item);
    else beheer.push(item);
  }
  return { overzicht, beheer };
}

export function PolarSidebar({
  logo,
  items,
  collapsed,
  onToggle,
  footerSlot,
}: PolarSidebarProps) {
  const navigate = useNavigate();
  const { overzicht, beheer } = groupItems(items);

  const renderItem = (item: PolarSidebarItem) => {
    const Icon = item.icon;
    const content = (
      <div
        key={item.url}
        onClick={(e) => {
          if (item.onClick) item.onClick(e);
          else if (!item.requiresCode) navigate(item.url);
        }}
        className={cn(
          'group flex items-center rounded-md transition-colors cursor-pointer select-none',
          collapsed ? 'justify-center h-9 w-9 mx-auto' : 'h-7 px-2 gap-2',
          item.active
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <Icon
          className={cn(
            'shrink-0 transition-colors',
            item.active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'
          )}
          style={{ width: 16, height: 16, strokeWidth: 2 }}
        />
        {!collapsed && (
          <>
            <span className="text-[12px] font-medium leading-none truncate">
              {item.title}
            </span>
            {item.requiresCode && (
              <Lock className="ml-auto h-3 w-3 text-muted-foreground/50" strokeWidth={2} />
            )}
          </>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <TooltipProvider key={item.url}>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-card text-foreground border border-border rounded-md px-2.5 py-1.5 text-xs shadow-md"
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return content;
  };

  return (
    <aside
      className="polar-sidebar flex flex-col bg-card border border-border rounded-lg shadow-sm overflow-hidden"
      style={{
        width: collapsed ? '64px' : '230px',
        height: 'calc(100vh - 24px)',
        position: 'sticky',
        top: '12px',
        margin: '12px 0 12px 12px',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-border bg-muted/30"
        style={{
          height: '44px',
          padding: collapsed ? '0 8px' : '0 10px',
        }}
      >
        <div
          className="overflow-hidden flex items-center"
          style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 150ms' }}
        >
          {!collapsed && logo}
        </div>
        {collapsed && (
          <div className="text-sm font-semibold text-primary mx-auto">PV</div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 rounded-md hover:bg-muted shrink-0"
          >
            <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          </Button>
        )}
      </div>

      {/* Collapsed toggle (separate row) */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 rounded-md hover:bg-muted"
          >
            <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {overzicht.length > 0 && (
          <div className={cn(collapsed ? 'px-1' : 'px-2', 'mb-3')}>
            {!collapsed && (
              <h3 className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase px-2 mb-1.5">
                Overzicht
              </h3>
            )}
            <div className="flex flex-col gap-0.5">
              {overzicht.map(renderItem)}
            </div>
          </div>
        )}

        {beheer.length > 0 && (
          <div className={cn(collapsed ? 'px-1' : 'px-2', 'mb-3')}>
            {!collapsed && (
              <h3 className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase px-2 mb-1.5">
                Beheer
              </h3>
            )}
            <div className="flex flex-col gap-0.5">
              {beheer.map(renderItem)}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      {footerSlot && !collapsed && (
        <div className="border-t border-border bg-muted/30 p-2">
          {footerSlot}
        </div>
      )}
    </aside>
  );
}
