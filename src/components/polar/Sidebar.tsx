import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
}

/**
 * PolarSidebar - Exact sidebar from PolarBaseUI
 * 
 * Specifications:
 * - Width: 280px (expanded), 64px (collapsed)
 * - Background: #FFFFFF
 * - Border: 1px solid #ECEDED (right)
 * - Header: 72px height
 * - Navigation items: 48px height, 12px gap
 * - Active state: rgba(27, 120, 103, 0.08) + 3px solid #1B7867 left border
 * - Hover state: #F4F5F6
 * - Font: Inter, 15px, 500 weight
 * - Transitions: 200ms ease
 */
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
        width: collapsed ? '64px' : '280px',
        height: '100vh',
        backgroundColor: '#F6F7DD',
        borderRight: '1px solid rgba(197, 197, 202, 0.5)',
        position: 'sticky',
        top: 0,
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header - 72px */}
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 12px' : '0 24px',
          borderBottom: '1px solid rgba(197, 197, 202, 0.5)',
        }}
      >
        {/* Logo */}
        <div
          className="polar-sidebar-logo"
          style={{
            transition: 'opacity 200ms ease',
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
          }}
        >
          {!collapsed && logo}
        </div>

        {/* Compact logo when collapsed */}
        {collapsed && (
          <div
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1B7867',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            PV
          </div>
        )}

        {/* Header actions (notifications, toggle) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!collapsed && headerSlot}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              transition: 'background-color 150ms',
            }}
          >
            {collapsed ? (
              <Menu className="h-5 w-5" style={{ color: '#36373A' }} />
            ) : (
              <X className="h-5 w-5" style={{ color: '#36373A' }} />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav
        style={{
          flex: 1,
          padding: collapsed ? '24px 8px' : '24px 16px',
          overflowY: 'auto',
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
                  'polar-sidebar-item',
                  item.active && 'polar-sidebar-item-active',
                  !item.requiresCode && 'cursor-pointer'
                )}
                style={{
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: collapsed ? '0 12px' : '0 16px',
                  borderRadius: '8px',
                  backgroundColor: item.active
                    ? '#FEFFF1'
                    : 'transparent',
                  border: item.active ? '1px solid rgba(197, 197, 202, 0.5)' : '1px solid transparent',
                  transition: 'background-color 150ms ease',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: item.active ? 500 : 400,
                  color: item.active ? '#282E3A' : '#73747B',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#FEFFF1';
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
                    width: collapsed ? '22px' : '20px',
                    height: collapsed ? '22px' : '20px',
                    marginRight: collapsed ? '0' : '12px',
                    color: item.active ? '#282E3A' : '#73747B',
                  }}
                />
                {!collapsed && <span>{item.title}</span>}
              </div>
            );

            // Wrap with tooltip when collapsed
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
                        fontSize: '14px',
                        backgroundColor: '#17171C',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '8px 12px',
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
