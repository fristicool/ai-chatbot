import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { currentUser } from '@clerk/nextjs/server';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const user = await currentUser();

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  
  // Check if user is logged in first to avoid null/undefined issues during hydration
  const isUserOwner = user ? user.id === chat.userId : false;

  if (!isUserOwner && chat.visibility === "private") {
    notFound();
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        selectedVisibilityType={chat.visibility === "private" ? "private" : "public"}
        isReadonly={!isUserOwner} // Only the owner can edit
      />
      <DataStreamHandler id={id} />
    </>
  );
}