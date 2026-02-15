import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, PanelLeft, Search } from 'lucide-react';
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
  badge?: number;
}

export interface PolarSidebarProps {
  logo: React.ReactNode;
  items: PolarSidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
  headerSlot?: React.ReactNode;
}

export function PolarSidebar({
  logo,
  items,
  collapsed,
  onToggle,
  headerSlot,
}: PolarSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className="polar-sidebar flex flex-col"
      style={{
        width: collapsed ? '64px' : '240px',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #D5D8E0',
        position: 'sticky',
        top: 0,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 12px' : '0 16px',
          borderBottom: '1px solid #D5D8E0',
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
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#E27726',
              fontFamily: "'Instrument Sans', 'Inter', sans-serif",
            }}
          >
            PV
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!collapsed && headerSlot}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            {collapsed ? (
              <Menu className="h-4 w-4" style={{ color: '#636878' }} />
            ) : (
              <PanelLeft className="h-4 w-4" style={{ color: '#636878' }} />
            )}
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#F8F9FA',
              border: '1px solid #D5D8E0',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            <Search size={14} style={{ color: '#8D93A0' }} />
            <span style={{
              fontSize: '13px',
              color: '#8D93A0',
              fontFamily: 'Inter, sans-serif',
              flex: 1,
            }}>
              Zoeken...
            </span>
            <span style={{
              fontSize: '11px',
              fontFamily: "'Geist Mono', monospace",
              color: '#8D93A0',
              backgroundColor: '#F1F3F5',
              border: '1px solid #D5D8E0',
              borderRadius: '6px',
              padding: '1px 6px',
            }}>
              ⌘K
            </span>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '12px 8px' : '4px 12px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                  !item.requiresCode && 'cursor-pointer'
                )}
                style={{
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: collapsed ? '0 12px' : '8px 10px',
                  borderRadius: '12px',
                  backgroundColor: item.active ? '#FFF7ED' : 'transparent',
                  transition: 'background-color 150ms ease',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: item.active ? 500 : 400,
                  color: item.active ? '#A5500D' : '#4A4F5E',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#F8F9FA';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon
                  className="shrink-0"
                  style={{
                    width: collapsed ? '20px' : '18px',
                    height: collapsed ? '20px' : '18px',
                    marginRight: collapsed ? '0' : '10px',
                    color: item.active ? '#E27726' : '#636878',
                    strokeWidth: item.active ? 2 : 1.5,
                    transition: 'color 150ms ease',
                  }}
                />
                {!collapsed && (
                  <span style={{ flex: 1 }}>{item.title}</span>
                )}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#E27726',
                    color: '#FFFFFF',
                    borderRadius: '9999px',
                    padding: '1px 6px',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}>
                    {item.badge}
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
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        backgroundColor: '#1A1F28',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '6px 12px',
                      }}
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
    </aside>
  );
}
