import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  ["Dashboard", "/"],
  ["New Sale", "/new-sale"],
  ["Sales Records", "/sales"],
  ["Customers", "/customers"],
  ["Reports", "/reports"],
  ["Settings", "/settings"],
];

export function Nav() {
  return (
    <aside className="no-print border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/company-logo.png" alt="Premium Machine Enterprise" className="h-12 w-auto object-contain" />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
            {label}
          </Link>
        ))}
      </nav>
      <div className="hidden border-t border-slate-200 px-3 py-4 lg:block">
        <LogoutButton />
      </div>
    </aside>
  );
}
