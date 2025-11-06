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
    <div className="bg-[#F5F7DD] py-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex gap-2 justify-start">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "bg-white rounded-lg shadow-sm px-5 py-2.5 font-heading font-bold text-sm min-h-[44px]",
                  isActive
                    ? "border-2 border-[#1B7867] text-[#1B7867]"
                    : "border border-[#1B7867]/10 text-[#282E3A]/50 hover:border-[#1B7867]/30 hover:text-[#282E3A]/70"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
