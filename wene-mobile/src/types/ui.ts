export type Role = 'viewer' | 'operator' | 'admin';

export type EventState = 'draft' | 'published' | 'ended';

export type ParticipationState = 'started' | 'completed' | 'expired' | 'invalid';

export const roleLabel: Record<Role, string> = {
  viewer: 'Viewer - Read only',
  operator: 'Operator',
  admin: 'Admin',
};
