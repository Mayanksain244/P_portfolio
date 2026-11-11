import { useTranslations } from "next-intl";
import BlueprintGrid from "./BlueprintGrid";

export default function DiaryEmpty() {
  const t = useTranslations("gallery");
  return (
    <BlueprintGrid className="border-2 border-navy p-1 text-navy dark:border-paper dark:text-paper">
      <section
        aria-labelledby="diary-empty-title"
        className="flex min-h-72 flex-col items-center justify-center gap-3 border border-current/40 bg-background/85 px-6 py-12 text-center text-foreground"
      >
        <p className="dim-title text-xs font-semibold text-pine dark:text-marigold">
          {t("emptyLabel")}
        </p>
        <h2 id="diary-empty-title" className="font-heading text-3xl font-semibold">
          {t("emptyTitle")}
        </h2>
        <p className="max-w-md text-muted">{t("emptyText")}</p>
      </section>
    </BlueprintGrid>
  );
}
