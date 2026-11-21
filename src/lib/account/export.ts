type ExportUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
};

type ExportMessage = {
  role: string;
  content: string;
  sources: unknown;
  createdAt: Date;
  feedback?: {
    rating: number;
    reason: string | null;
    note: string | null;
    createdAt: Date;
  } | null;
};

type ExportChat = {
  id: string;
  title: string;
  titleIsAuto?: boolean;
  shareSlug?: string | null;
  shareCreatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ExportMessage[];
};

type ExportDocument = {
  id: string;
  chatId: string;
  title: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number | null;
  status: string;
  createdAt: Date;
};

export function buildAccountExport({
  user,
  chats,
  documents,
  exportedAt = new Date(),
}: {
  user: ExportUser;
  chats: ExportChat[];
  documents: ExportDocument[];
  exportedAt?: Date;
}) {
  return {
    exportedAt: exportedAt.toISOString(),
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
    chats: chats.map((chat) => ({
      ...chat,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      shareCreatedAt: chat.shareCreatedAt
        ? chat.shareCreatedAt.toISOString()
        : null,
      messages: chat.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
        feedback: message.feedback
          ? {
              ...message.feedback,
              createdAt: message.feedback.createdAt.toISOString(),
            }
          : null,
      })),
    })),
    documents: documents.map((document) => ({
      ...document,
      createdAt: document.createdAt.toISOString(),
      downloadPath: `/api/documents/${document.id}/file`,
    })),
  };
}
