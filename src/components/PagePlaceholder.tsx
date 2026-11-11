import DimensionDivider from "./DimensionDivider";
import Reveal from "./Reveal";

/** Styled "coming soon" page used by Works, Gallery and Contact until built. */
export default function PagePlaceholder({
  title,
  intro,
  panelLabel,
  panelTitle,
  panelText,
}: {
  title: string;
  intro: string;
  panelLabel: string;
  panelTitle: string;
  panelText: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-4xl font-semibold sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{intro}</p>
      <DimensionDivider title={title} as="p" className="mt-10" />

      <Reveal className="mt-10">
        <section
          aria-labelledby="coming-soon-title"
          className="bg-blueprint border-2 border-navy p-1 text-navy dark:border-paper dark:text-paper"
        >
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-current/40 bg-background/80 px-6 py-12 text-center">
            <p className="dim-title text-xs font-semibold text-pine dark:text-marigold">
              {panelLabel}
            </p>
            <h2
              id="coming-soon-title"
              className="font-heading text-3xl font-semibold text-foreground"
            >
              {panelTitle}
            </h2>
            <p className="max-w-md text-muted">{panelText}</p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
