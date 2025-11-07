import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const KassaTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'overdag', label: 'Overdag', path: '/kassa-overdag' },
    { id: 'avond', label: 'Avond', path: '/kassa' },
  ];

  // Determine the current page type
  const currentTab = tabs.find(tab => location.pathname === tab.path);
  const pageType = currentTab?.label || 'Overdag';

  return (
    <div className="bg-[#F5F7DD] border-b border-[#1B7867]/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-6">
          {/* Left: Title and Badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#282E3A]">
              Kassatelling
            </h1>
            <span className="px-2.5 py-0.5 bg-[#1B7867]/10 text-[#1B7867] rounded-md text-xs font-heading font-semibold uppercase tracking-wide">
              {pageType}
            </span>
          </div>

          {/* Right: Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "relative px-6 py-3 font-heading font-medium text-sm transition-colors",
                    isActive
                      ? "text-[#1B7867]"
                      : "text-[#282E3A]/50 hover:text-[#282E3A]/70"
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B7867]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
