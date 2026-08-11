import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

export function CallTile({
  firstName,
  lastName,
  speaking,
}: {
  firstName: string;
  lastName: string;
  speaking?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border bg-gray-925 py-16",
        speaking ? "border-primary-500" : "border-gray-800",
      )}
    >
      <Avatar firstName={firstName} lastName={lastName} size="xl" />
      <p className="text-sm font-medium text-gray-200">
        {firstName} {lastName}
      </p>
    </div>
  );
}

export function CallStage({ children }: { children: React.ReactNode }) {
  return <div className="grid flex-1 grid-cols-1 gap-4 p-6 sm:grid-cols-2">{children}</div>;
}
