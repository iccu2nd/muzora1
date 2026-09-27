const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Search", href: "/" },
  { label: "Library", href: "/library" }, // TODO(iteration): wire up
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-4">
      <div className="px-2 pb-6 text-xl font-semibold tracking-tight">Muzora</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-subtext hover:bg-surface2 hover:text-text transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
