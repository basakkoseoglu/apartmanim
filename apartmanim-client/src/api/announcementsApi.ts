
import type { Announcement, AnnouncementForm } from '../types';

const API_URL = 'http://localhost:5285/api/Announcements';

interface ApiAnnouncement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  apartmentId: number;
}

function getToken(): string {
  const token = localStorage.getItem('apartmanim_token');

  if (!token) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yap.');
  }

  return token;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ?? `İşlem başarısız. HTTP ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function mapAnnouncement(item: ApiAnnouncement): Announcement {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    authorName: 'Yönetici',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? undefined,
    apartmentId: item.apartmentId,
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const data = await request<ApiAnnouncement[]>('');

  return data.map(mapAnnouncement);
}

export async function createAnnouncement(
  data: AnnouncementForm
): Promise<Announcement> {
  const result = await request<ApiAnnouncement>('', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return mapAnnouncement(result);
}

export async function updateAnnouncement(
  id: number,
  data: AnnouncementForm
): Promise<Announcement> {
  const result = await request<ApiAnnouncement>(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return mapAnnouncement(result);
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await request<void>(`/${id}`, {
    method: 'DELETE',
  });
}
