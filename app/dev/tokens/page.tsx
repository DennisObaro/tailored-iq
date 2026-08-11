const grays: { name: string; className: string }[] = [
  { name: "50", className: "bg-gray-50" },
  { name: "100", className: "bg-gray-100" },
  { name: "200", className: "bg-gray-200" },
  { name: "300", className: "bg-gray-300" },
  { name: "400", className: "bg-gray-400" },
  { name: "500", className: "bg-gray-500" },
  { name: "600", className: "bg-gray-600" },
  { name: "700", className: "bg-gray-700" },
  { name: "800", className: "bg-gray-800" },
  { name: "850", className: "bg-gray-850" },
  { name: "900", className: "bg-gray-900" },
  { name: "925", className: "bg-gray-925" },
  { name: "950", className: "bg-gray-950" },
  { name: "975", className: "bg-gray-975" },
];

const primaries: { name: string; className: string }[] = [
  { name: "50", className: "bg-primary-50" },
  { name: "100", className: "bg-primary-100" },
  { name: "200", className: "bg-primary-200" },
  { name: "300", className: "bg-primary-300" },
  { name: "400", className: "bg-primary-400" },
  { name: "500", className: "bg-primary-500" },
  { name: "600", className: "bg-primary-600" },
  { name: "700", className: "bg-primary-700" },
  { name: "800", className: "bg-primary-800" },
  { name: "900", className: "bg-primary-900" },
  { name: "950", className: "bg-primary-950" },
];

export default function TokensPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <h1 className="text-xl font-semibold">Design tokens</h1>
      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-400">Gray</h2>
        <div className="grid grid-cols-7 gap-2">
          {grays.map((g) => (
            <div key={g.name} className="flex flex-col gap-1">
              <div className={`h-14 rounded-md border border-gray-800 ${g.className}`} />
              <span className="text-xs text-gray-400">{g.name}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-400">Primary (gold)</h2>
        <div className="grid grid-cols-6 gap-2">
          {primaries.map((p) => (
            <div key={p.name} className="flex flex-col gap-1">
              <div className={`h-14 rounded-md border border-gray-800 ${p.className}`} />
              <span className="text-xs text-gray-400">{p.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
