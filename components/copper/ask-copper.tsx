"use client";

// Module 2: the Ask Copper chat widget. A floating launcher opens a side
// panel. Each answer is drawn as a line of "stations" on a vertical rail:
// the tools Copper can use, what it was thinking, the tool it called (what it
// sent and what came back), and finally the reply. Tools on and tools off are
// two separate conversations.
import {
  ArrowUpIcon,
  BrainIcon,
  MessageCircleIcon,
  WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import { SetupRequired } from "@/components/setup-required";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { readLive } from "@/lib/ai/live";
import { askCopper } from "@/lib/copper/assistant/ask";
import {
  type Progress,
  type Step,
  TOOL_LABELS,
  type ToolStep,
} from "@/lib/copper/assistant/progress";
import { formatUsd, getPlans, getProducts } from "@/lib/copper/catalog";
import { cn } from "cn";

const STARTERS = [
  "How much is Copper Home with Copper Plus, paid yearly, for 2 years?",
  "Is Copper Notes in Night Sky in stock?",
  "Is Copper Plus cheaper monthly or yearly?",
];

type Turn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; progress: Progress };

type Chats = { tools: Turn[]; noTools: Turn[] };

const TOOL_NAMES = Object.keys(TOOL_LABELS);

const productName = (id: unknown) =>
  getProducts().find((p) => p.id === id)?.name ?? String(id);
const planName = (id: unknown) =>
  getPlans().find((p) => p.id === id)?.name ?? String(id);

/** Renders the **bold** and `code` marks in a thought summary. */
function Markdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
          return (
            <code key={i} className="font-mono">
              {part.slice(1, -1)}
            </code>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** One station: a round node ringed in the panel colour, hanging off the rail. */
function Station({
  icon,
  nodeClass,
  label,
  children,
}: {
  icon: React.ReactNode;
  nodeClass: string;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative pb-4 pl-9">
      <span
        className={cn(
          "ring-secondary absolute top-0 left-0 flex size-6 items-center justify-center rounded-full ring-4",
          nodeClass,
        )}
      >
        {icon}
      </span>
      {label && (
        <p className="text-muted-foreground pt-1 text-[11px] font-semibold tracking-widest uppercase">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-muted-foreground w-16 shrink-0">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function SentInput({ step }: { step: ToolStep }) {
  if (step.name === "get_prices")
    return <p>Nothing, it just asked for the price list</p>;
  if (step.name === "get_products")
    return <p>Nothing, it just asked what Copper sells</p>;
  if (step.input === undefined)
    return (
      <p className="text-muted-foreground flex items-center gap-2">
        <Spinner className="size-3" /> filling in the details…
      </p>
    );
  const input = step.input as Record<string, unknown>;
  if (step.name === "calculate_cost") {
    const products = Array.isArray(input.products) ? input.products : [];
    return (
      <dl className="space-y-0.5">
        <Field
          label="Products"
          value={
            products.length ? products.map(productName).join(", ") : "None"
          }
        />
        <Field label="Plan" value={planName(input.plan)} />
        <Field label="Billing" value={String(input.billing)} />
        <Field label="Years" value={String(input.years)} />
      </dl>
    );
  }
  return (
    <dl className="space-y-0.5">
      <Field label="Product" value={productName(input.product)} />
      <Field
        label="Color"
        value={input.color ? String(input.color) : "Every color"}
      />
    </dl>
  );
}

function StockPill({
  stock,
  restockDate,
}: {
  stock: string;
  restockDate: string | null;
}) {
  if (stock === "in_stock")
    return <Badge className="bg-accent text-accent-foreground">In stock</Badge>;
  if (stock === "low_stock")
    return <Badge className="bg-chart-4 text-foreground">Low stock</Badge>;
  const date = restockDate
    ? new Date(`${restockDate}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return (
    <Badge className="bg-chart-3 text-foreground">
      Back-ordered{date ? ` until ${date}` : ""}
    </Badge>
  );
}

function CameBack({ step }: { step: ToolStep }) {
  const out = step.output as Record<string, unknown> | undefined;
  if (step.state === "error")
    return <p>Something went wrong: {String(step.output)}</p>;
  if (!out) return null;

  if (step.name === "calculate_cost") {
    const lines = (out.lines ?? []) as { item: string; usd: number }[];
    return (
      <div className="space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="flex justify-between gap-3">
            <span>{line.item}</span>
            <span className="font-medium">{formatUsd(line.usd)}</span>
          </div>
        ))}
        <div className="border-t pt-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">Total</span>
            <span className="text-primary text-xl font-bold">
              {formatUsd(Number(out.totalUsd))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (step.name === "get_products") {
    const products = (out.products ?? []) as {
      name: string;
      type: string;
      priceUsd: number;
      colors: string[];
    }[];
    return (
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.name}>
            <p className="flex justify-between gap-3 font-medium">
              <span>{p.name}</span>
              <span>{formatUsd(p.priceUsd)}</span>
            </p>
            <p className="text-muted-foreground text-xs">{p.type}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.colors.map((color) => (
                <span
                  key={color}
                  className="bg-accent/20 rounded-full px-2 py-0.5 text-xs"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step.name === "get_prices") {
    const products = (out.products ?? []) as {
      name: string;
      priceUsd: number;
    }[];
    const plans = (out.plans ?? []) as {
      name: string;
      monthlyUsd: number;
      annualUsd: number;
    }[];
    return (
      <div className="space-y-1">
        {products.map((p) => (
          <div key={p.name} className="flex justify-between gap-3">
            <span>{p.name}</span>
            <span className="font-medium">{formatUsd(p.priceUsd)}</span>
          </div>
        ))}
        {plans
          .filter((p) => p.monthlyUsd > 0 || p.annualUsd > 0)
          .map((p) => (
            <div key={p.name} className="flex justify-between gap-3">
              <span>{p.name}</span>
              <span className="font-medium">
                {formatUsd(p.monthlyUsd)}/mo · {formatUsd(p.annualUsd)}/yr
              </span>
            </div>
          ))}
      </div>
    );
  }

  // check_availability
  if (out.status === "ok") {
    const colors = (out.colors ?? []) as {
      color: string;
      stock: string;
      restockDate: string | null;
    }[];
    return (
      <div className="space-y-1">
        {colors.map((c) => (
          <div
            key={c.color}
            className="flex items-center justify-between gap-3"
          >
            <span>{c.color}</span>
            <StockPill stock={c.stock} restockDate={c.restockDate} />
          </div>
        ))}
      </div>
    );
  }
  if (out.status === "not_a_color") {
    const colors = (out.colors ?? []) as string[];
    return (
      <p>
        {String(out.product)} doesn’t come in {String(out.color)}. Its colors
        are {colors.join(", ")}.
      </p>
    );
  }
  return <p>{String(out.message ?? "Stock can't be checked right now.")}</p>;
}

function ToolCard({ step, number }: { step: ToolStep; number: number }) {
  const running = step.state === "calling";
  return (
    <div
      data-testid="tool-call"
      data-tool={step.name}
      className="bg-card mt-2 overflow-hidden rounded-lg border text-sm"
    >
      <div className="bg-accent text-accent-foreground flex flex-wrap items-center gap-2 px-3 py-1.5">
        <span className="font-mono font-bold">{step.name}()</span>
        <span className="bg-background/30 rounded-full px-2 text-[11px]">
          tool {number}
        </span>
        <span className="ml-auto text-xs">{TOOL_LABELS[step.name]}</span>
      </div>
      <div className="p-3">
        <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-widest uppercase">
          <span aria-hidden>→</span> What Copper sent
        </p>
        <SentInput step={step} />
      </div>
      <div className="bg-accent/10 border-t p-3">
        <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-widest uppercase">
          <span aria-hidden>←</span> What came back
        </p>
        {running ? (
          <p className="text-muted-foreground flex items-center gap-2">
            <Spinner className="size-3" /> the app is running the code…
          </p>
        ) : (
          <CameBack step={step} />
        )}
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex gap-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}ms` }}
          className="bg-primary size-1 animate-bounce rounded-full"
        />
      ))}
    </span>
  );
}

function Answer({
  progress,
  useTools,
}: {
  progress: Progress;
  useTools: boolean;
}) {
  const working = progress.status === "working";
  const used = new Set(
    progress.steps.flatMap((s) => (s.type === "tool" ? [s.name] : [])),
  );
  const railTone = useTools
    ? "from-primary via-accent"
    : "from-chart-3 to-chart-3";
  const thinkingNode = useTools
    ? "bg-primary text-primary-foreground"
    : "bg-chart-3 text-foreground";

  const stationFor = (step: Step, i: number) => {
    if (step.type === "thinking")
      return (
        <Station
          key={i}
          icon={<BrainIcon className="size-3" />}
          nodeClass={thinkingNode}
          label="Copper is thinking"
        >
          <p
            data-testid="thinking"
            className="text-muted-foreground mt-1 border-l-2 pl-3 text-sm italic"
          >
            <Markdown text={step.text} />
          </p>
        </Station>
      );
    const toolNumber = progress.steps
      .slice(0, i + 1)
      .filter((s) => s.type === "tool").length;
    return (
      <Station
        key={i}
        icon={<WrenchIcon className="size-3" />}
        nodeClass="bg-accent text-accent-foreground"
        label={
          step.state === "calling"
            ? "Copper is calling a tool"
            : "Copper called a tool"
        }
      >
        <ToolCard step={step} number={toolNumber} />
      </Station>
    );
  };

  const now =
    !progress.steps.length && !progress.reply
      ? useTools
        ? "Reading your question…"
        : "Answering from memory…"
      : progress.reply
        ? "Writing the answer…"
        : useTools
          ? "Deciding what to do next…"
          : "Answering from memory…";

  return (
    <div className="relative">
      <div
        aria-hidden
        className={cn(
          "absolute top-3 bottom-0 left-3 w-0.5 -translate-x-1/2 bg-linear-to-b",
          railTone,
        )}
      />
      <Station
        icon={<WrenchIcon className="size-3" />}
        nodeClass={
          useTools
            ? "bg-primary text-primary-foreground"
            : "bg-chart-3 text-foreground"
        }
        label={
          useTools ? "Tools Copper can use" : "Tools given to Copper: none"
        }
      >
        <div className="mt-1 flex flex-wrap gap-1.5">
          {TOOL_NAMES.map((name) => (
            <span
              key={name}
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-xs",
                !useTools && "text-muted-foreground line-through",
                useTools &&
                  (used.has(name)
                    ? "bg-accent text-accent-foreground font-bold"
                    : "text-muted-foreground bg-muted"),
              )}
            >
              {name}
            </span>
          ))}
        </div>
        {!useTools && (
          <p className="text-muted-foreground mt-1 text-xs">
            Copper has to answer from memory alone.
          </p>
        )}
      </Station>
      {progress.steps.map(stationFor)}
      {working && (
        <Station icon={<Dots />} nodeClass="bg-card animate-pulse">
          <p className="text-muted-foreground pt-1 text-sm">{now}</p>
        </Station>
      )}
      {(progress.reply || !working) && (
        <div className="bg-card ml-9 rounded-xl rounded-tl-sm border p-3 text-sm">
          <p className="text-primary mb-1 text-xs font-semibold">Copper</p>
          {!useTools && (
            <div className="border-chart-3 mb-2 rounded-md border p-2 text-xs">
              <p>
                <strong>⚠ Answered without tools: may be made up</strong>
              </p>
              <p className="mt-1">
                With tools off, Copper can’t see today’s prices or stock. The AI
                only has what it learned in training, so it fills the gaps with
                guesses that sound right. That’s a hallucination.
              </p>
            </div>
          )}
          <p className="whitespace-pre-wrap">
            <span>{progress.reply}</span>
            {working && (
              <span
                aria-hidden
                className="bg-foreground ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse"
              />
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export function AskCopper({ aiConfigured }: { aiConfigured: boolean }) {
  const [open, setOpen] = useState(false);
  const [useTools, setUseTools] = useState(true);
  const [chats, setChats] = useState<Chats>({ tools: [], noTools: [] });
  const [busy, setBusy] = useState<Record<keyof Chats, boolean>>({
    tools: false,
    noTools: false,
  });
  const [text, setText] = useState("");
  const body = useRef<HTMLDivElement>(null);

  // Open from #ask, on load, when the hash changes, and on every click of a
  // link to #ask (clicking again fires no hashchange).
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#ask") setOpen(true);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      if (link?.getAttribute("href")?.endsWith("#ask")) setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const key: keyof Chats = useTools ? "tools" : "noTools";
  const turns = chats[key];
  const streaming = busy[key];

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, open, key]);

  async function send(question: string) {
    const content = question.trim();
    if (!content || busy[key]) return;
    const mode = key;
    const tools = useTools;
    const history = [
      ...chats[mode].map(({ role, content }) => ({ role, content })),
      { role: "user" as const, content },
    ];
    const empty: Progress = { steps: [], reply: "", status: "working" };
    const setLast = (progress: Progress) =>
      setChats((c) => ({
        ...c,
        [mode]: c[mode].map((turn, i) =>
          i === c[mode].length - 1 && turn.role === "assistant"
            ? { ...turn, content: progress.reply, progress }
            : turn,
        ),
      }));
    setText("");
    setBusy((b) => ({ ...b, [mode]: true }));
    setChats((c) => ({
      ...c,
      [mode]: [
        ...c[mode],
        { role: "user", content },
        { role: "assistant", content: "", progress: empty },
      ],
    }));
    try {
      const { progress } = await askCopper({
        messages: history,
        useTools: tools,
      });
      for await (const update of readLive(progress)) setLast(update);
    } catch {
      setLast({
        steps: [],
        reply: "Sorry, I couldn't answer that just now. Please try again.",
        status: "error",
      });
    } finally {
      setBusy((b) => ({ ...b, [mode]: false }));
    }
  }

  return (
    <>
      <Button
        data-testid="ask-copper-launcher"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 h-12 rounded-full px-5 shadow-lg"
      >
        <MessageCircleIcon />
        Ask Copper
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          data-testid="ask-copper"
          showCloseButton
          className="w-full gap-0 p-0 sm:max-w-md data-[side=right]:w-full"
        >
          <div className="bg-foreground text-background">
            <div className="flex items-center gap-3 p-4 pr-12">
              <span className="bg-primary flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                <Image
                  src="/assets/brand/copper-mascot.png"
                  alt="Copper the robot"
                  width={40}
                  height={40}
                  className="size-10 object-cover"
                />
              </span>
              <div>
                <SheetTitle className="text-background text-base">
                  Ask Copper
                </SheetTitle>
                <p className="text-xs opacity-80">
                  Prices, totals and stock, checked with tools.
                </p>
              </div>
            </div>
            <div className="bg-background/10 flex items-center justify-between gap-3 px-4 py-2">
              <div>
                <p className="text-sm font-medium">Use tools</p>
                <p className="text-xs opacity-80">
                  {useTools ? "Checks every answer" : "Model guesses alone"}
                </p>
              </div>
              <Switch
                aria-label="Use tools"
                checked={useTools}
                onCheckedChange={setUseTools}
              />
            </div>
          </div>

          {aiConfigured ? (
            <>
              <div
                ref={body}
                className="bg-secondary flex-1 space-y-4 overflow-y-auto p-4"
              >
                {turns.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Ask about Copper products, prices and stock.
                  </p>
                )}
                {turns.map((turn, i) =>
                  turn.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="bg-primary text-primary-foreground max-w-[85%] rounded-xl rounded-br-sm px-3 py-2 text-sm">
                        {turn.content}
                      </p>
                    </div>
                  ) : (
                    <Answer
                      key={i}
                      progress={turn.progress}
                      useTools={useTools}
                    />
                  ),
                )}
                {!streaming && (
                  <div className="flex flex-col items-start gap-2">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => send(starter)}
                        className="bg-card hover:border-primary rounded-full border px-3 py-1.5 text-left text-sm transition-colors"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <form
                className="bg-card flex items-center gap-2 border-t p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(text);
                }}
              >
                <Input
                  aria-label="Your question"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Ask about prices or stock…"
                  className="h-10 flex-1 rounded-full px-4"
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send"
                  disabled={streaming}
                  className="size-10 rounded-full"
                >
                  <ArrowUpIcon />
                </Button>
              </form>
            </>
          ) : (
            <div className="bg-secondary flex-1 overflow-y-auto p-4">
              <SetupRequired service="ai" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
