'use client';
import { Topbar } from '@/components/layout/topbar';
import { MessagesView } from '@/components/shared/messages-view';

export default function ParentMessagesPage() {
  return (
    <div>
      <Topbar title="Messages" />
      <MessagesView />
    </div>
  );
}
