import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SharedNotebook } from "@/components/share/shared-notebook";
import { toChatUIMessage } from "@/lib/chats/serialize";
import { prisma } from "@/lib/prisma";

const SLUG = /^[a-zA-Z0-9]{16,40}$/;

async function SharedContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connection();

  if (!SLUG.test(slug)) {
    notFound();
  }

  const chat = await prisma.chat.findUnique({
    where: { shareSlug: slug },
    select: {
      id: true,
      title: true,
      messages: { orderBy: { createdAt: "asc" } },
      documents: { select: { id: true } },
    },
  });

  if (!chat) {
    notFound();
  }

  const messages = chat.messages.map(toChatUIMessage);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="flex items-center gap-2 font-mono text-[0.62rem] text-muted-foreground">
        <span aria-hidden="true" className="h-px w-4 bg-highlight" />
        Shared notebook / read only
      </p>
      <h1 className="mt-4 font-display text-[clamp(2rem,4.6vw,3rem)] leading-[1.05] tracking-[-0.025em]">
        {chat.title}
      </h1>
      <p className="mt-3 font-mono text-[0.62rem] text-muted-foreground">
        {messages.filter((message) => message.role === "assistant").length}{" "}
        answers · {chat.documents.length}{" "}
        {chat.documents.length === 1 ? "source" : "sources"}
      </p>

      {messages.length === 0 ? (
        <p className="mt-12 border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
          This notebook does not have an answer yet.
        </p>
      ) : (
        <div className="mt-12">
          <SharedNotebook slug={slug} messages={messages} />
        </div>
      )}
    </div>
  );
}

function SharedFallback() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-5 py-10 sm:px-8">
      <div className="h-2.5 w-32 rounded-[2px] bg-secondary/50" />
      <div className="mt-4 h-10 w-2/3 rounded-[2px] bg-secondary/60" />
      <div className="mt-10 space-y-6">
        {[0, 1].map((index) => (
          <div key={index} className="border-l border-border pl-4">
            <div className="h-2.5 w-20 rounded-[2px] bg-secondary/50" />
            <div className="mt-3 h-3 w-full rounded-[2px] bg-secondary/40" />
            <div className="mt-2 h-3 w-4/5 rounded-[2px] bg-secondary/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SharedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<SharedFallback />}>
      <SharedContent params={params} />
    </Suspense>
  );
}
