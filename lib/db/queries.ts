import 'server-only';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { Message, PrismaClient } from '@prisma/client';
import { ArtifactKind } from '@/components/artifact';

// Initialize Prisma Client
const prisma = new PrismaClient();

export async function getUser(email: string) {
  try {
    return await prisma.user.findMany({
      where: {
        email: email,
      },
    });
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await prisma.user.create({
      data: {
        email,
        password: hash,
      },
    });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await prisma.chat.create({
      data: {
        id,
        createdAt: new Date(),
        userId,
        title,
      },
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    // Using transactions to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Delete votes associated with the chat
      await tx.vote.deleteMany({
        where: {
          chatId: id,
        },
      });

      // Delete messages associated with the chat
      await tx.message.deleteMany({
        where: {
          chatId: id,
        },
      });

      // Delete the chat itself
      return await tx.chat.delete({
        where: {
          id: id,
        },
      });
    });
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await prisma.chat.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.findUnique({
      where: {
        id: id,
      },
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<any> }) {
  try {
    return await prisma.message.createMany({
      data: messages.map((message) => {
        return {
          id: message.id,
          chatId: message.chatId,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        }
      }),
    });
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: {
        chatId: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const existingVote = await prisma.vote.findFirst({
      where: {
        messageId: messageId,
        chatId: chatId,
      },
    });

    if (existingVote) {
      return await prisma.vote.update({
        where: {
          chatId_messageId: {
            chatId: chatId,
            messageId: messageId,
          },
        },
        data: {
          isUpvoted: type === 'up',
        },
      });
    }

    return await prisma.vote.create({
      data: {
        chatId,
        messageId,
        isUpvoted: type === 'up',
      },
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await prisma.vote.findMany({
      where: {
        chatId: id,
      },
    });
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await prisma.document.create({
      data: {
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await prisma.document.findMany({
      where: {
        id: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const documents = await prisma.document.findMany({
      where: {
        id: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    return documents[0];
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Delete associated suggestions first
      await tx.suggestion.deleteMany({
        where: {
          documentId: id,
          documentCreatedAt: {
            gt: timestamp,
          },
        },
      });

      // Delete the documents
      return await tx.document.deleteMany({
        where: {
          id: id,
          createdAt: {
            gt: timestamp,
          },
        },
      });
    });
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<any>;
}) {
  try {
    return await prisma.suggestion.createMany({
      data: suggestions,
    });
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await prisma.suggestion.findMany({
      where: {
        documentId: documentId,
      },
    });
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: {
        id: id,
      },
    });
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Find messages to delete
      const messagesToDelete = await tx.message.findMany({
        where: {
          chatId: chatId,
          createdAt: {
            gte: timestamp,
          },
        },
        select: {
          id: true,
        },
      });

      const messageIds = messagesToDelete.map((message) => message.id);

      if (messageIds.length > 0) {
        // Delete associated votes
        await tx.vote.deleteMany({
          where: {
            chatId: chatId,
            messageId: {
              in: messageIds,
            },
          },
        });

        // Delete messages
        return await tx.message.deleteMany({
          where: {
            chatId: chatId,
            id: {
              in: messageIds,
            },
          },
        });
      }
    });
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        visibility: visibility,
      },
    });
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}