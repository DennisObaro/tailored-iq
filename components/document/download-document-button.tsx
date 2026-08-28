"use client";

import { useCallback } from "react";
import { Download } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Hands the client a PDF of the document they're reading.
 *
 * There is no server to render one, so this goes through the browser's own
 * print pipeline — which is the higher-fidelity route anyway: the page is
 * already a typeset document, and the print styles in globals.css re-ink it
 * for paper, so what saves out is the real design rather than a re-drawn
 * approximation.
 */
export function DownloadDocumentButton({
  documentTitle,
  className,
}: {
  /** Names the saved file. See the title swap below. */
  documentTitle: string;
  className?: string;
}) {
  const download = useCallback(() => {
    // Browsers name the saved PDF after document.title, which here is the
    // app's own title on every page — so every executive summary would save
    // as the same filename. Borrow the document's name for the duration of
    // the print and put the original back once the dialog closes (afterprint
    // fires on cancel too, so the title is restored either way).
    const previousTitle = document.title;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    document.title = documentTitle;
    window.print();
  }, [documentTitle]);

  return (
    <Button variant="outline" size="sm" onClick={download} className={cn("gap-1.5 print:hidden", className)}>
      <Download className="size-3.5" aria-hidden />
      Download PDF
    </Button>
  );
}
