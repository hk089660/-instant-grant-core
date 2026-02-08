/**
 * 管理者・利用者間のデータ同期レイヤー
 *
 * 利用者側で参加完了すると recipientTicketStore に記録される。
 * 管理者側はこの store を読み、リアルタイム参加数・参加者一覧を表示する。
 */

import React, { useEffect } from 'react';
import { useRecipientTicketStore } from '../store/recipientTicketStore';
import { mockEvents, mockParticipants } from './adminMock';
import type { EventState } from '../types/ui';

export interface SyncedEvent {
  id: string;
  title: string;
  datetime: string;
  host: string;
  state: EventState;
  rtCount: number;
  totalCount: number;
}

export interface SyncedParticipant {
  id: string;
  display: string;
  code: string;
  time: string;
}

export interface ParticipantLogEntry extends SyncedParticipant {
  event?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatTimeFull(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${formatTime(ts)}`;
}

/**
 * 同期済みイベント一覧を取得
 * mockEvents のベース + recipientTicketStore の参加数で rtCount を更新
 */
export function getSyncedEvents(tickets: { eventId: string }[]): SyncedEvent[] {
  const countByEvent = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.eventId] = (acc[t.eventId] ?? 0) + 1;
    return acc;
  }, {});

  return mockEvents.map((e) => {
    const syncedRtCount = countByEvent[e.id] ?? 0;
    const rtCount = Math.max(e.rtCount, syncedRtCount);
    return {
      ...e,
      rtCount,
    };
  });
}

/**
 * 同期済み参加者一覧を取得（指定イベント）
 * recipientTicketStore のチケットを参加者形式に変換 + モック参加者とマージ
 */
export function getSyncedParticipantsForEvent(
  eventId: string,
  tickets: { eventId: string; joinedAt: number }[]
): SyncedParticipant[] {
  const eventTickets = tickets.filter((t) => t.eventId === eventId);
  const fromStore = eventTickets.map((t, i) => ({
    id: `sync-${eventId}-${t.joinedAt}-${i}`,
    display: '-',
    code: `#${(t.joinedAt % 0x10000).toString(16).toUpperCase().padStart(4, '0')}`,
    time: formatTime(t.joinedAt),
  }));
  const fromMock = mockParticipants.filter(() => true);
  return [...fromStore, ...fromMock];
}

/**
 * 参加者ログ（全イベント横断）を取得
 */
export function getSyncedParticipantLogs(
  tickets: { eventId: string; eventName: string; joinedAt: number }[]
): ParticipantLogEntry[] {
  const eventNames: Record<string, string> = {};
  mockEvents.forEach((e) => {
    eventNames[e.id] = e.title;
  });
  return tickets.map((t, i) => ({
    id: `sync-${t.eventId}-${t.joinedAt}-${i}`,
    display: '-',
    code: `#${(t.joinedAt % 0x10000).toString(16).toUpperCase().padStart(4, '0')}`,
    time: formatTimeFull(t.joinedAt),
    event: eventNames[t.eventId] ?? t.eventName,
  }));
}

/**
 * 管理者画面用の同期データを返すフック
 */
export function useSyncedAdminData() {
  const tickets = useRecipientTicketStore((s) => s.tickets);
  const loadTickets = useRecipientTicketStore((s) => s.loadTickets);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const syncedEvents = getSyncedEvents(tickets);
  const getParticipantsForEvent = (eventId: string) =>
    getSyncedParticipantsForEvent(eventId, tickets);
  const participantLogs = getSyncedParticipantLogs(tickets);

  return {
    syncedEvents,
    getParticipantsForEvent,
    participantLogs,
  };
}
