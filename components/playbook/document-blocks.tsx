import type { PlaybookBlock } from "@/lib/types";

/**
 * Renders the constrained block vocabulary. There is deliberately no
 * formatting toolbar anywhere near this — the block kinds are the grammar of
 * a TailoredIQ playbook, and everything an expert can express fits inside
 * them. Reads as a document, not a dashboard.
 */
export function DocumentBlock({ block }: { block: PlaybookBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-sm leading-relaxed text-gray-300">{block.text}</p>;

    case "insight":
      return (
        <p className="text-sm leading-relaxed text-gray-200">
          <span className="font-medium text-gray-50">The insight. </span>
          {block.text}
        </p>
      );

    case "science":
      return (
        <p className="text-sm leading-relaxed text-gray-300">
          <span className="font-medium text-gray-50">The science. </span>
          <span className="text-gray-200">{block.framework}. </span>
          {block.text}
        </p>
      );

    case "phase":
      return (
        <div>
          <p className="text-sm font-medium text-gray-50">{block.label}</p>
          <ol className="mt-1.5 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gray-300">
            {block.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      );

    case "checklist":
      return (
        <ul className="space-y-1.5 text-sm leading-relaxed text-gray-300">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1 size-3.5 shrink-0 rounded-[4px] border border-gray-700" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      );

    case "list":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-300">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    className="border-b border-gray-800 pb-2 pr-4 text-xs uppercase tracking-wider font-medium text-gray-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-gray-900 py-2.5 pr-4 align-top text-gray-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
