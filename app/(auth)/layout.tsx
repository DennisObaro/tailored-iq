import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-975">
      <header className="p-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-gray-50">
          Tailored<span className="text-primary-500">IQ</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
