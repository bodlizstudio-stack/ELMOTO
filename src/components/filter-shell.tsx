export function FilterShell({ children }: { children: React.ReactNode }) {
  return (
    <details className="filters-details">
      <summary className="filter-toggle mb-3 flex min-h-12 cursor-pointer list-none items-center justify-between bg-ink px-4 text-sm uppercase tracking-[0.14em] text-white">
        Filtri in razvrščanje
      </summary>
      <div className="filters-body">{children}</div>
    </details>
  );
}
