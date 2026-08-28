"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoreVertical, Plus, Trash2 } from "@/components/icons";
import type { PlaybookBlock, PlaybookBlockBody } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HighlightedText, type TextAnchor } from "@/components/playbook/highlighted-text";
import { cn } from "@/lib/utils/cn";

/**
 * A field that looks like the document until you're in it.
 *
 * Same treatment as the brief-review fields: no chrome at rest, chrome on
 * focus. An editable document that draws a box around every paragraph stops
 * reading as a document, which is the whole point of this surface.
 */
function AutoField({
  value,
  onChange,
  onCommit,
  onFocus,
  className,
  placeholder,
  onEnter,
  onEmptyBackspace,
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onFocus: () => void;
  className?: string;
  placeholder?: string;
  /** For list rows: Enter adds a sibling rather than a newline. */
  onEnter?: () => void;
  onEmptyBackspace?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (onEnter && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter();
        }
        if (onEmptyBackspace && e.key === "Backspace" && value === "") {
          e.preventDefault();
          onEmptyBackspace();
        }
      }}
      className={cn(
        "w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1 -mx-2",
        "placeholder:text-gray-600 focus:border-gray-800 focus:bg-gray-900 focus-visible:outline-none",
        className,
      )}
    />
  );
}

/** What an empty block of each kind starts as. */
export const BLANK_BLOCKS: { label: string; body: PlaybookBlockBody }[] = [
  { label: "Paragraph", body: { kind: "paragraph", text: "" } },
  { label: "Insight", body: { kind: "insight", text: "" } },
  { label: "Bullets", body: { kind: "list", items: [""] } },
  { label: "Checklist", body: { kind: "checklist", items: [""] } },
  { label: "Steps", body: { kind: "phase", label: "", steps: [""] } },
];

export interface EditableBlockProps {
  block: PlaybookBlock;
  /** Scribe on a live document. Everyone else reads. */
  editable: boolean;
  anchors: TextAnchor[];
  focusedCommentId?: string | null;
  onFocusComment?: (commentId: string) => void;
  /** Content changed — schedule a save. */
  onChange: (body: PlaybookBlockBody) => void;
  /** Field left — write now. */
  onCommit: () => void;
  /** Presence: this block took or lost focus. */
  onFocusBlock: (blockId: string | undefined) => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
  onInsertAfter: (body: PlaybookBlockBody) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** e.g. "Grace is editing" — someone else has this block focused. */
  presenceLabel?: string;
}

export function EditableBlock(props: EditableBlockProps) {
  const { block, editable, anchors, focusedCommentId, onFocusComment, presenceLabel } = props;

  /*
    The draft lives here so typing never waits on a round trip. It re-syncs
    from the server copy only while this block is unfocused — otherwise an
    incoming change-feed refresh (someone else commenting, our own save
    landing) would overwrite the half-typed sentence under the cursor.
  */
  const [draft, setDraft] = useState<PlaybookBlockBody>(block);
  const [focused, setFocused] = useState(false);
  /**
   * The Scribe reads the document like everyone else until they click into a
   * block. Fields only where the caret is: a page of permanent inputs stops
   * looking like a document, and nothing can carry a comment highlight while
   * it's a textarea.
   */
  const [editing, setEditing] = useState(false);
  const [seededFrom, setSeededFrom] = useState(() => JSON.stringify(block));

  /*
    Take the server's copy only when it genuinely differs from what we last
    took, and only while nothing here is focused. Without the focus guard an
    incoming change-feed refresh — someone else commenting, or our own save
    landing — would overwrite the half-typed sentence under the cursor.
  */
  const incoming = JSON.stringify(block);
  if (incoming !== seededFrom && !focused) {
    setSeededFrom(incoming);
    setDraft(block);
  }

  const edit = useCallback(
    (body: PlaybookBlockBody) => {
      setDraft(body);
      props.onChange(body);
    },
    [props],
  );

  const focus = useCallback(() => {
    setFocused(true);
    props.onFocusBlock(block.id);
  }, [block.id, props]);

  /*
    Entering edit mode puts the caret where the click was aiming. Without this
    a click swaps in fields and then does nothing, and you have to click twice.
  */
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editing) return;
    wrapperRef.current?.querySelector("textarea")?.focus();
  }, [editing]);

  /** A field was left: write what's pending. Says nothing about the block. */
  const commit = useCallback(() => {
    props.onCommit();
  }, [props]);

  const text = (value: string) => (
    <HighlightedText
      text={value}
      anchors={anchors}
      focusedCommentId={focusedCommentId}
      onFocusComment={onFocusComment}
    />
  );

  /** Shared by the list-shaped kinds: bullets, checklist, phase steps. */
  function rows(
    items: string[],
    write: (next: string[]) => void,
    { placeholder }: { placeholder: string },
  ) {
    return items.map((item, i) => (
      <AutoField
        key={i}
        value={item}
        placeholder={placeholder}
        onFocus={focus}
        onCommit={commit}
        onChange={(v) => write(items.map((x, j) => (j === i ? v : x)))}
        onEnter={() => write([...items.slice(0, i + 1), "", ...items.slice(i + 1)])}
        onEmptyBackspace={() =>
          write(items.length > 1 ? items.filter((_, j) => j !== i) : items)
        }
        className="text-sm leading-relaxed text-gray-300"
      />
    ));
  }

  function body() {
    if (!editable || !editing) {
      switch (block.kind) {
        case "paragraph":
          return <p className="text-sm leading-relaxed text-gray-300">{text(block.text)}</p>;
        case "insight":
          return (
            <p className="text-sm leading-relaxed text-gray-200">
              <span className="font-medium text-gray-50">The insight. </span>
              {text(block.text)}
            </p>
          );
        case "science":
          return (
            <p className="text-sm leading-relaxed text-gray-300">
              <span className="font-medium text-gray-50">The science. </span>
              <span className="text-gray-200">{block.framework}. </span>
              {text(block.text)}
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
                        className="border-b border-gray-800 pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500"
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

    switch (draft.kind) {
      case "paragraph":
        return (
          <AutoField
            value={draft.text}
            placeholder="Write a paragraph…"
            onFocus={focus}
            onCommit={commit}
            onChange={(text) => edit({ kind: "paragraph", text })}
            className="text-sm leading-relaxed text-gray-300"
          />
        );
      case "insight":
        return (
          <div className="flex items-start">
            <span className="mt-1 shrink-0 text-sm font-medium text-gray-50">The insight.&nbsp;</span>
            <AutoField
              value={draft.text}
              placeholder="What should the reader take away?"
              onFocus={focus}
              onCommit={commit}
              onChange={(text) => edit({ kind: "insight", text })}
              className="text-sm leading-relaxed text-gray-200"
            />
          </div>
        );
      case "science":
        return (
          <div>
            <AutoField
              value={draft.framework}
              placeholder="The named framework"
              onFocus={focus}
              onCommit={commit}
              onChange={(framework) => edit({ ...draft, framework })}
              className="text-sm font-medium leading-relaxed text-gray-100"
            />
            <AutoField
              value={draft.text}
              placeholder="Why it applies here"
              onFocus={focus}
              onCommit={commit}
              onChange={(text) => edit({ ...draft, text })}
              className="text-sm leading-relaxed text-gray-300"
            />
          </div>
        );
      case "phase":
        return (
          <div>
            <AutoField
              value={draft.label}
              placeholder="Phase name"
              onFocus={focus}
              onCommit={commit}
              onChange={(label) => edit({ ...draft, label })}
              className="text-sm font-medium leading-relaxed text-gray-50"
            />
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              {rows(draft.steps, (steps) => edit({ ...draft, steps }), { placeholder: "A step…" }).map(
                (row, i) => (
                  <li key={i}>{row}</li>
                ),
              )}
            </ol>
          </div>
        );
      case "checklist":
      case "list": {
        const kind = draft.kind;
        return (
          <ul
            className={cn(
              "space-y-0.5",
              kind === "list" ? "list-disc pl-5" : "flex flex-col",
            )}
          >
            {rows(draft.items, (items) => edit({ kind, items }), { placeholder: "An item…" }).map(
              (row, i) => (
                <li key={i} className={cn(kind === "checklist" && "flex items-start gap-2.5")}>
                  {kind === "checklist" && (
                    <span
                      className="mt-2 size-3.5 shrink-0 rounded-[4px] border border-gray-700"
                      aria-hidden
                    />
                  )}
                  {row}
                </li>
              ),
            )}
          </ul>
        );
      }
      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {draft.columns.map((column, j) => (
                    <th key={j} className="border-b border-gray-800 pb-2 pr-4">
                      <AutoField
                        value={column}
                        placeholder="Column"
                        onFocus={focus}
                        onCommit={commit}
                        onChange={(v) =>
                          edit({ ...draft, columns: draft.columns.map((c, k) => (k === j ? v : c)) })
                        }
                        className="text-xs font-medium uppercase tracking-wider text-gray-500"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-gray-900 py-1 pr-4 align-top">
                        <AutoField
                          value={cell}
                          onFocus={focus}
                          onCommit={commit}
                          onChange={(v) =>
                            edit({
                              ...draft,
                              rows: draft.rows.map((r, k) =>
                                k === i ? r.map((c, l) => (l === j ? v : c)) : r,
                              ),
                            })
                          }
                          className="text-sm text-gray-300"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={() =>
                edit({ ...draft, rows: [...draft.rows, draft.columns.map(() => "")] })
              }
              className="mt-2 text-xs text-gray-500 hover:text-gray-300"
            >
              + Add row
            </button>
          </div>
        );
    }
  }

  return (
    <div className="group/block relative">
      {/*
        data-block-id is what a text selection is traced back to — the
        selection hook walks up from the selected node to find it.
      */}
      <div
        ref={wrapperRef}
        data-block-id={block.id}
        /*
          Blur bubbles, so this fires for every field in the block. Only an
          exit that lands outside the block ends editing — otherwise tabbing
          from a phase's label to its first step would close the editor.
        */
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setFocused(false);
          setEditing(false);
          props.onFocusBlock(undefined);
        }}
        onClick={(e) => {
          if (!editable || editing) return;
          // A drag-select is someone choosing a passage to comment on, and a
          // click on a highlight is someone opening that thread. Neither is a
          // request to start typing.
          if (!window.getSelection()?.isCollapsed) return;
          if ((e.target as HTMLElement).closest("mark[data-comment-id]")) return;
          setEditing(true);
        }}
        className={cn(editable && !editing && "cursor-text rounded-md")}
      >
        {body()}
      </div>

      {presenceLabel && (
        <p className="mt-1 text-xs text-gray-500">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-gold align-middle" aria-hidden />
          {presenceLabel}
        </p>
      )}

      {editable && (
        <>
          <div className="absolute -left-9 top-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover/block:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Block options"
                className="flex size-7 items-center justify-center rounded-md text-gray-600 hover:bg-gray-900 hover:text-gray-300"
              >
                <MoreVertical className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem disabled={!props.canMoveUp} onSelect={() => props.onMove("up")}>
                  Move up
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!props.canMoveDown} onSelect={() => props.onMove("down")}>
                  Move down
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={props.onDelete} className="text-danger-400 focus:text-danger-400">
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* The insert strip: a hairline that only resolves into buttons on approach. */}
          <div className="relative h-4 opacity-0 transition-opacity focus-within:opacity-100 hover:opacity-100">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-800" aria-hidden />
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md border border-gray-800 bg-gray-950 px-1 py-0.5">
              <Plus className="size-3 text-gray-600" aria-hidden />
              {BLANK_BLOCKS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => props.onInsertAfter(option.body)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-900 hover:text-gray-200"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
