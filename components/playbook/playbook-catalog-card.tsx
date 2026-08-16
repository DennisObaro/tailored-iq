import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlaybookTemplate } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function PlaybookCatalogCard({
  template,
  owned,
  playbookId,
}: {
  template: PlaybookTemplate;
  owned: boolean;
  playbookId?: string;
}) {
  if (owned && playbookId) {
    return (
      <Link href={`/playbooks/${playbookId}`} className="block h-full">
        <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:bg-gray-900">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-50">{template.title}</p>
            <StatusBadge status="owned" />
          </div>
          <p className="flex-1 text-sm leading-relaxed text-gray-400">{template.description}</p>
          <Badge variant="outline" className="w-fit">
            {template.category}
          </Badge>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <p className="text-sm font-medium text-gray-50">{template.title}</p>
      <p className="flex-1 text-sm leading-relaxed text-gray-400">{template.description}</p>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline">{template.category}</Badge>
        <StatusBadge status="locked" />
      </div>
      <Button asChild size="sm" variant="outline" className="w-full justify-center gap-1.5">
        <Link href={`/playbooks/explore/${template.id}`}>
          Unlock playbook
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>
    </Card>
  );
}
