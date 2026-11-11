export type Stat = { value: string; label: string };

/** Large Fraunces numerals, a small-caps label and a thin dimension tick above each. */
export default function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col">
          <span
            aria-hidden="true"
            className="flex items-center text-navy dark:text-paper"
          >
            <i className="block h-3 w-px bg-current" />
            <i className="block h-px flex-1 bg-current opacity-80" />
            <i className="block h-3 w-px bg-current" />
          </span>
          <dt className="dim-title order-3 mt-3 text-xs font-semibold text-muted sm:text-sm">
            {s.label}
          </dt>
          <dd className="order-2 m-0 mt-3 font-heading text-5xl font-semibold leading-none text-navy sm:text-6xl dark:text-marigold">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
