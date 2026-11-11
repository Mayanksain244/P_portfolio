import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:py-24">
      {/* Barrier sign */}
      <div aria-hidden="true" className="w-full max-w-md">
        <div className="mx-auto flex justify-between px-8">
          <span className="h-10 w-3 bg-navy dark:bg-paper" />
          <span className="h-10 w-3 bg-navy dark:bg-paper" />
        </div>
        <div className="barrier-stripes h-8 border-2 border-navy dark:border-paper" />
        <div className="mx-auto -mt-px w-[85%] border-2 border-navy bg-marigold px-4 py-5 dark:border-paper">
          <p className="font-heading text-2xl font-bold tracking-[0.18em] text-navy sm:text-4xl">
            {t("sign")}
          </p>
        </div>
        <div className="barrier-stripes mt-1 h-8 border-2 border-navy dark:border-paper" />
        <div className="mx-auto flex justify-between px-8">
          <span className="h-10 w-3 bg-navy dark:bg-paper" />
          <span className="h-10 w-3 bg-navy dark:bg-paper" />
        </div>
      </div>

      <p className="mt-10 font-heading text-6xl font-semibold text-navy dark:text-marigold">
        404
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-3 max-w-md text-muted">{t("text")}</p>
      <Link href="/" className="btn btn-primary mt-8">
        {t("home")}
      </Link>
    </div>
  );
}
