import type { Role, EventState } from '../types/ui';

let currentRole: Role = 'admin';

export const getMockAdminRole = (): Role => currentRole;
export const setMockAdminRole = (role: Role): void => {
  currentRole = role;
};

type MockCategory = {
  id: string;
  label: string;
};

type MockEvent = {
  id: string;
  title: string;
  datetime: string;
  host: string;
  state: EventState;
};

export const mockCategories: MockCategory[] = [];

export const mockEvents: MockEvent[] = [
  {
    id: 'evt-001',
    title: '地域清掃ボランティア',
    datetime: '2026/02/02 09:00-10:30',
    host: '生徒会',
    state: 'published',
  },
  {
    id: 'evt-002',
    title: '進路説明会',
    datetime: '2026/02/10 15:00-16:00',
    host: '進路指導室',
    state: 'published',
  },
];

export const mockParticipants = [
  { id: 'stu-081', display: 'Student-081', code: '#A7F3', time: '10:02' },
  { id: 'stu-142', display: 'Student-142', code: '#B112', time: '10:05' },
  { id: 'stu-203', display: '-', code: '#C821', time: '10:07' },
];

export const mockParticipantLogs = [
  {
    id: 'stu-081',
    display: 'Student-081',
    event: '地域清掃ボランティア',
    code: '#A7F3',
    time: '2026/02/02 10:02',
  },
  {
    id: 'stu-142',
    display: 'Student-142',
    event: '進路説明会',
    code: '#B112',
    time: '2026/02/10 15:05',
  },
];
