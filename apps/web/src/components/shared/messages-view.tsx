'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Plus, Inbox, Send, Loader2 } from 'lucide-react';

export function MessagesView() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId;
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ subject: '', content: '', recipientId: '' });
  const qc = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['users', 'messaging', tenantId],
    queryFn: () => api.get(`/users?limit=100${tenantId ? `&tenantId=${tenantId}` : ''}`) as any,
  });

  const { data: inboxData, isLoading: inboxLoading } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: () => api.get('/messages/inbox') as any,
    refetchInterval: 30_000,
  });

  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ['messages', 'sent'],
    queryFn: () => api.get('/messages/sent') as any,
  });

  const send = useMutation({
    mutationFn: (d: { recipientIds: string[]; subject: string; content: string }) =>
      api.post('/messages', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      setShowCompose(false);
      setForm({ subject: '', content: '', recipientId: '' });
    },
  });

  const markRead = useMutation({
    mutationFn: (messageId: string) => api.patch(`/messages/${messageId}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });

  const users: any[]  = (usersData as any)?.data?.data ?? [];
  const inbox: any[]  = (inboxData as any)?.data?.data ?? [];
  const sent: any[]   = (sentData as any)?.data?.data ?? [];
  const messages      = tab === 'inbox' ? inbox : sent;
  const isLoading     = tab === 'inbox' ? inboxLoading : sentLoading;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('inbox')}
            className={tab === 'inbox' ? 'btn-primary' : 'btn-secondary'}
          >
            <Inbox className="w-4 h-4 inline mr-1.5" />
            Inbox {inbox.length > 0 && `(${inbox.length})`}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={tab === 'sent' ? 'btn-primary' : 'btn-secondary'}
          >
            <Send className="w-4 h-4 inline mr-1.5" />
            Sent {sent.length > 0 && `(${sent.length})`}
          </button>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Compose
        </button>
      </div>

      {/* Message list */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {messages.map((m: any) => {
              const msg       = m.message ?? m;
              const isRead    = m.isRead ?? true;
              const messageId = msg.id;
              return (
                <div
                  key={messageId}
                  onClick={() => { if (!isRead && tab === 'inbox') markRead.mutate(messageId); }}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!isRead && tab === 'inbox' ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!isRead && tab === 'inbox' && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        )}
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {msg.subject || '(no subject)'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{msg.content}</p>
                      {tab === 'inbox' && msg.sender && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
                          From: {msg.sender.firstName} {msg.sender.lastName}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose modal */}
      <Modal open={showCompose} onClose={() => setShowCompose(false)} title="Compose Message">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.recipientId) return;
            send.mutate({ recipientIds: [form.recipientId], subject: form.subject, content: form.content });
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">To</label>
            <select
              className="input"
              required
              value={form.recipientId}
              onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
            >
              <option value="">Select recipient...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {u.role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              placeholder="(optional)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[120px]"
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          {send.isError && (
            <p className="text-red-600 dark:text-red-400 text-sm">Failed to send. Please try again.</p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={send.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {send.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {send.isPending ? 'Sending...' : 'Send Message'}
            </button>
            <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
