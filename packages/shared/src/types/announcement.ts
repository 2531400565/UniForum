export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'notice' | 'lecture' | 'club' | 'other';
  publisherId: number;
  priority: number;
  status: 'active' | 'expired' | 'deleted';
  startDate: string | null;
  endDate: string | null;
  publisher?: import('./user').User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: 'notice' | 'lecture' | 'club' | 'other';
  priority?: number;
  startDate?: string;
  endDate?: string;
}
