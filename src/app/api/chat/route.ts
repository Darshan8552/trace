import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { rateLimitedResponse } from "@/lib/api-response";
import { stripInvalidCitations } from "@/lib/chat/citations";
import { messageSources, messageText } from "@/lib/chat/message-parts";
import type { ChatSource } from "@/lib/chat/types";
import { chatTitleFromQuery } from "@/lib/chats/format";
import { chatIdSchema } from "@/lib/chats/schemas";
import { DEFAULT_CHAT_TITLE } from "@/lib/chats/serialize";
import { updateAutoTitle } from "@/lib/chats/title";
import { llmConfig } from "@/lib/llm/config";
import { getChatModel, isLlmConfigured } from "@/lib/llm/models";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import {
  type ContextChunk,
  type DocumentGroup,
  groupChunksByDocument,
} from "@/lib/rag/context";
import {
  isSearchableDocument,
  listNotebookDocuments,
  loadChatCorpus,
  type NotebookDocument,
} from "@/lib/rag/corpus";
import { isInventoryQuestion } from "@/lib/rag/intents";
import { buildInventoryAnswer } from "@/lib/rag/inventory";
import { buildNoMatchAnswer, shouldUseNoMatchAnswer } from "@/lib/rag/no-match";
import { retrieveCoverageChunks } from "@/lib/rag/retrieve";
import { rewriteQuery } from "@/lib/rag/rewrite-query";
import { rateLimit, userRateLimitKey } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

const uiMessageSchema = z.custom<UIMessage>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "role" in value &&
    "parts" in value,
);

const chatRequestSchema = z.object({
  chatId: chatIdSchema,
  messages: z.array(uiMessageSchema).min(1).max(100),
});

function lastUserMessage(messages: UIMessage[]): UIMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index];
    }
  }

  return undefined;
}

function sourceCountLabel(total: number, indexed: number): string {
  if (total === 0) {
    return "This notebook has no sources.";
  }

  const totalLabel = total === 1 ? "1 source" : `${total} sources`;
  const indexedLabel = indexed === total ? "all indexed" : `${indexed} indexed`;

  return `This notebook has ${totalLabel} (${indexedLabel}).`;
}

function inventoryList(
  documents: NotebookDocument[],
  indexedIds: Set<string>,
): string {
  return documents
    .map(
      (document, index) =>
        `${index + 1}. ${document.title}${
          indexedIds.has(document.id)
            ? ""
            : " (not searchable with the current model)"
        }`,
    )
    .join("\n");
}

function buildInstructions({
  notebook,
  indexedIds,
  groups,
  fullCorpus,
}: {
  notebook: NotebookDocument[];
  indexedIds: Set<string>;
  groups: DocumentGroup[];
  fullCorpus: boolean;
}): string {
  const inventory = inventoryList(notebook, indexedIds);

  if (groups.length === 0) {
    if (notebook.length === 0) {
      return [
        "You are Trace, a careful document assistant.",
        "This chat has no documents yet.",
        "Answer briefly from general knowledge, and make clear that the answer is not drawn from their documents.",
        "Do not invent citations or claim to have quoted their files.",
        "If they ask about documents, suggest adding a source from the Sources panel.",
      ].join(" ");
    }

    if (indexedIds.size === 0) {
      return [
        "You are Trace, a careful document assistant.",
        sourceCountLabel(notebook.length, indexedIds.size),
        inventory,
        "None of these sources are searchable with the current embedding model, so no passages are available.",
        "Do not claim the chat has no documents.",
        "Answer questions unrelated to the files briefly from general knowledge, and make clear the answer is not drawn from their documents.",
        "Do not invent citations.",
      ].join("\n");
    }

    return [
      "You are Trace, a careful document assistant.",
      sourceCountLabel(notebook.length, indexedIds.size),
      inventory,
      "No matching source passages were found for this question.",
      "Do not claim the chat has no documents or that nothing is indexed.",
      "If the question is about their files, say the sources above are indexed but no passage matched, and ask them to mention a topic, section, or page.",
      "If the question is unrelated to their files, answer briefly from general knowledge and make clear the answer is not drawn from their documents.",
      "Do not invent citations or claim to have quoted their files.",
    ].join("\n");
  }

  const sections = groups
    .map((group, index) => {
      const passages = group.chunks
        .map((chunk) => {
          const page = chunk.page ? `, page ${chunk.page}` : "";
          const before = chunk.before
            ? `BEFORE THE CITED PASSAGE:\n${chunk.before}\n\n`
            : "";
          const after = chunk.after
            ? `\n\nAFTER THE CITED PASSAGE:\n${chunk.after}`
            : "";

          return `[${chunk.number}]${page}\n${before}${chunk.content}${after}`;
        })
        .join("\n\n");

      return `DOCUMENT ${index + 1}: ${group.document.title}\n${passages}`;
    })
    .join("\n\n");

  return [
    "You are Trace, a careful document assistant.",
    sourceCountLabel(notebook.length, indexedIds.size),
    inventory,
    fullCorpus
      ? "The complete text of every searchable source is included below."
      : "The passages below are the most relevant excerpts from this notebook. Every searchable source is represented when the budget allows.",
    "The numbered passages are excerpts, not the notebook's source count. Use the source list above for counts.",
    "Text labelled BEFORE or AFTER is surrounding context for that numbered passage; cite only the numbered passage.",
    "When a question spans the notebook, draw on every document and say clearly if a document has no relevant passage.",
    "Support each claim with a single bracketed citation like [1], placed at the end of the sentence it supports.",
    "Use only the citation numbers shown below. Never invent a number.",
    "If the documents do not contain the answer, say you could not find it in their documents instead of guessing.",
    "Keep the answer concise and format it with short paragraphs or lists when that helps.",
    "",
    "DOCUMENTS:",
    sections,
  ].join("\n");
}

async function saveAssistantMessage({
  chatId,
  responseMessage,
  sources,
}: {
  chatId: string;
  responseMessage: UIMessage;
  sources: ChatSource[];
}) {
  const rawContent = messageText(responseMessage).trim();
  const sanitized = stripInvalidCitations(rawContent, sources).trim();
  const content = sanitized.length > 0 ? sanitized : rawContent;

  if (!content) {
    return;
  }

  try {
    await prisma.chatMessage.upsert({
      where: {
        chatId_externalId: {
          chatId,
          externalId: responseMessage.id,
        },
      },
      create: {
        chatId,
        role: "ASSISTANT",
        content,
        sources: messageSources(
          responseMessage,
        ) as unknown as Prisma.InputJsonValue,
        externalId: responseMessage.id,
      },
      update: {
        content,
        sources: messageSources(
          responseMessage,
        ) as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });
  } catch (error) {
    logError("chat.persist-assistant-message", error);
  }
}

function plainAnswerResponse({
  messages,
  chatId,
  answer,
  query,
  titleIsAuto,
  isFirstTurn,
}: {
  messages: UIMessage[];
  chatId: string;
  answer: string;
  query: string;
  titleIsAuto: boolean;
  isFirstTurn: boolean;
}) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      const textId = crypto.randomUUID();

      writer.write({ type: "text-start", id: textId });
      writer.write({ type: "text-delta", id: textId, delta: answer });
      writer.write({ type: "text-end", id: textId });
    },
    onEnd: async ({ responseMessage, outcome }) => {
      if (outcome.status === "failed") {
        return;
      }

      await saveAssistantMessage({
        chatId,
        responseMessage,
        sources: [],
      });

      if (titleIsAuto && isFirstTurn) {
        await updateAutoTitle({
          chatId,
          query,
          answer,
          sourceTitles: [],
        });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimit({
    key: userRateLimitKey(session.user.id, "chat"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  if (!isLlmConfigured()) {
    return NextResponse.json(
      { error: "The assistant is not configured yet." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { chatId, messages } = parsed.data;
  const userMessage = lastUserMessage(messages);
  const query = userMessage ? messageText(userMessage).trim() : "";

  if (!userMessage || !query) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
    select: { id: true, title: true, titleIsAuto: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingUserMessage = await prisma.chatMessage.findUnique({
    where: {
      chatId_externalId: { chatId, externalId: userMessage.id },
    },
    select: { createdAt: true },
  });

  if (existingUserMessage) {
    await prisma.chatMessage.deleteMany({
      where: {
        chatId,
        role: "ASSISTANT",
        createdAt: { gt: existingUserMessage.createdAt },
      },
    });
  }

  await prisma.chatMessage.upsert({
    where: {
      chatId_externalId: { chatId, externalId: userMessage.id },
    },
    create: {
      chatId,
      role: "USER",
      content: query,
      externalId: userMessage.id,
    },
    update: { content: query },
  });

  const messageCount = await prisma.chatMessage.count({ where: { chatId } });

  if (messageCount === 1 && chat.title === DEFAULT_CHAT_TITLE) {
    await prisma.chat.update({
      where: { id: chatId },
      data: { title: chatTitleFromQuery(query) },
    });
  }

  const notebook = await listNotebookDocuments(session.user.id, chatId).catch(
    (error: unknown) => {
      logError("chat.load-notebook", error);
      return [] as NotebookDocument[];
    },
  );
  const { embedding } = llmConfig();
  const indexedDocuments = notebook.filter((document) =>
    isSearchableDocument(document, embedding),
  );
  const indexedIds = new Set(indexedDocuments.map((document) => document.id));

  if (isInventoryQuestion(query)) {
    return plainAnswerResponse({
      messages,
      chatId,
      query,
      answer: buildInventoryAnswer(notebook, indexedIds),
      titleIsAuto: chat.titleIsAuto,
      isFirstTurn: messageCount === 1,
    });
  }

  let contextChunks: ContextChunk[] = [];
  let fullCorpus = false;
  const corpus =
    indexedDocuments.length > 0
      ? await loadChatCorpus({
          userId: session.user.id,
          chatId,
        }).catch((error: unknown) => {
          logError("chat.load-corpus", error);
          return null;
        })
      : { documents: [], chunks: [], totalChars: 0 };

  if (corpus) {
    contextChunks = corpus.chunks;
    fullCorpus = true;
  } else {
    const priorTurns = messages.filter(
      (message) => message.role === "user" && message.id !== userMessage.id,
    );
    const retrievalQuery =
      priorTurns.length > 0
        ? await rewriteQuery({
            history: messages.filter(
              (message) => message.id !== userMessage.id,
            ),
            query,
          })
        : query;

    contextChunks = await retrieveCoverageChunks({
      userId: session.user.id,
      chatId,
      query: retrievalQuery,
    }).catch((error: unknown) => {
      logError("chat.coverage-retrieval", error);
      return [] as ContextChunk[];
    });
  }

  if (
    shouldUseNoMatchAnswer({
      fullCorpus,
      indexedCount: indexedIds.size,
      query,
      similarities: contextChunks.map((chunk) => chunk.similarity),
    })
  ) {
    return plainAnswerResponse({
      messages,
      chatId,
      query,
      answer: buildNoMatchAnswer(),
      titleIsAuto: chat.titleIsAuto,
      isFirstTurn: messageCount === 1,
    });
  }

  const numberedChunks = contextChunks.map((chunk, index) => ({
    ...chunk,
    number: index + 1,
  }));
  const groups = groupChunksByDocument(indexedDocuments, numberedChunks);

  const sources: ChatSource[] = numberedChunks.map((chunk) => ({
    number: chunk.number,
    documentId: chunk.documentId,
    title: chunk.documentTitle,
    page: chunk.page,
    similarity: chunk.similarity,
    chunkId: chunk.id,
    snippet: chunk.content.slice(0, 600),
  }));

  try {
    const result = streamText({
      model: getChatModel(),
      instructions: buildInstructions({
        notebook,
        indexedIds,
        groups,
        fullCorpus,
      }),
      messages: await convertToModelMessages(messages),
    });

    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        if (sources.length > 0) {
          writer.write({ type: "data-sources", data: sources });
        }

        writer.merge(toUIMessageStream({ stream: result.stream }));
      },
      onEnd: async ({ responseMessage, outcome }) => {
        if (outcome.status === "failed") {
          return;
        }

        await saveAssistantMessage({
          chatId,
          responseMessage,
          sources,
        });

        if (chat.titleIsAuto && messageCount === 1) {
          await updateAutoTitle({
            chatId,
            query,
            answer: messageText(responseMessage),
            sourceTitles: sources.map((source) => source.title),
          });
        }
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    logError("chat.request", error);
    return NextResponse.json(
      { error: "The assistant could not answer that." },
      { status: 500 },
    );
  }
}
