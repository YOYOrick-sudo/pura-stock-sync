import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const KassaTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'overdag', label: 'Overdag', path: '/kassa-overdag' },
    { id: 'avond', label: 'Avond', path: '/kassa' },
  ];

  return (
    <div className="bg-white border-b border-[#1B7867]/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "px-6 py-3 font-heading font-bold text-sm sm:text-base transition-colors relative",
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
  );
};
