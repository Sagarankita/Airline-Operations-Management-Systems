import { ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.href ? (
            <a href={item.href} className="text-gray-600 hover:text-gray-900 transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900" style={{ fontWeight: 500 }}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
