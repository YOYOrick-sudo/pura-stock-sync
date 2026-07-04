import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelLeft, PanelLeftClose, Lock } from 'lucide-react';
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
  group?: 'overzicht' | 'keuken' | 'beheer';
  onClick?: (e: React.MouseEvent) => void;
}

export interface PolarSidebarProps {
  logo: React.ReactNode;
  collapsedLogo?: React.ReactNode;
  items: PolarSidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
  footerSlot?: React.ReactNode;
  logoutSlot?: React.ReactNode;
}

function groupItems(items: PolarSidebarItem[]) {
  const overzicht: PolarSidebarItem[] = [];
  const keuken: PolarSidebarItem[] = [];
  const beheer: PolarSidebarItem[] = [];
  for (const item of items) {
    const g = item.group ?? 'beheer';
    if (g === 'overzicht') overzicht.push(item);
    else if (g === 'keuken') keuken.push(item);
    else beheer.push(item);
  }
  return { overzicht, keuken, beheer };
}

export function PolarSidebar({
  logo,
  collapsedLogo,
  items,
  collapsed,
  onToggle,
  footerSlot,
  logoutSlot,
}: PolarSidebarProps) {
  const navigate = useNavigate();
  const { overzicht, keuken, beheer } = groupItems(items);

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
          'group relative flex items-center transition-colors duration-200 cursor-pointer select-none',
          collapsed
            ? 'justify-center h-12 w-12 mx-auto rounded-[14px]'
            : 'h-[42px] px-3 gap-3 rounded-[14px]',
          item.active
            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
            : 'text-foreground/70 hover:bg-background hover:text-foreground'
        )}
      >
        <Icon
          className={cn(
            'shrink-0 transition-colors',
            item.active ? 'text-primary' : 'text-foreground/50 group-hover:text-foreground'
          )}
          style={{
            width: collapsed ? 22 : 20,
            height: collapsed ? 22 : 20,
            strokeWidth: 1.75,
          }}
        />
        {!collapsed && (
          <>
            <span
              className={cn(
                'text-[14px] font-medium leading-none truncate',
                item.active ? 'text-primary' : ''
              )}
            >
              {item.title}
            </span>
            {item.requiresCode && (
              <Lock
                className="ml-auto h-3.5 w-3.5 text-muted-foreground/50"
                strokeWidth={1.75}
              />
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
              sideOffset={12}
              className="bg-card text-foreground border border-border rounded-md px-3 py-2 text-[13px] font-medium shadow-md"
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return content;
  };

  const groups = [
    { key: 'overzicht', items: overzicht, label: 'Overzicht' },
    { key: 'keuken', items: keuken, label: 'Keuken' },
    { key: 'beheer', items: beheer, label: 'Beheer' },
  ].filter((g) => g.items.length > 0);

  return (
    <aside
      className="polar-sidebar flex flex-col bg-card border border-border/60 rounded-[20px] overflow-hidden"
      style={{
        width: collapsed ? '76px' : '230px',
        height: 'calc(100vh - 24px)',
        position: 'sticky',
        top: '12px',
        margin: '12px',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between pt-6 pb-3"
        style={{
          height: '84px',
          paddingLeft: collapsed ? '10px' : '16px',
          paddingRight: collapsed ? '10px' : '16px',
        }}
      >
        {!collapsed ? (
          <>
            <div className="overflow-hidden flex items-center">{logo}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="Sidebar inklappen"
              className="h-10 w-10 rounded-md hover:bg-muted shrink-0"
            >
              <PanelLeftClose className="h-5 w-5 text-foreground/50" strokeWidth={1.75} />
            </Button>
          </>
        ) : collapsedLogo ? (
          <div className="mx-auto flex items-center justify-center">
            <div className="h-11 w-11 rounded-lg flex items-center justify-center overflow-hidden p-1">
              {collapsedLogo}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center">
              <span className="text-[13px] font-bold text-primary tracking-tight">PV</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((g, idx) => (
          <div
            key={g.key}
            className={cn(
              collapsed ? 'px-2' : 'px-2',
              idx > 0 && collapsed && 'mt-2 pt-2 border-t border-border/40',
              idx > 0 && !collapsed && 'mt-4'
            )}
          >
            {!collapsed && (
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/45 px-2.5 mb-2">
                {g.label}
              </h3>
            )}
            <div className="flex flex-col gap-0.5">{g.items.map(renderItem)}</div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 px-2.5 py-2.5">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {logoutSlot}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="Sidebar uitklappen"
              className="h-10 w-10 rounded-md hover:bg-muted"
            >
              <PanelLeft className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {footerSlot && <div className="flex items-center">{footerSlot}</div>}
            {logoutSlot}
          </div>
        )}
      </div>
    </aside>
  );
}
