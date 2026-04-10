"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex overflow-x-auto border-b border-border gap-1 px-4 py-2 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
            activeTab === tab.id
              ? "bg-accent-positive/15 text-accent-positive"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
