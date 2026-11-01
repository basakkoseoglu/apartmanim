
import type { Due, DueStatus } from '../types';

const API_URL = 'http://localhost:5285/api/Dues';

interface ApiDue {
  id: number;
  unitId: number;
  unitNo?: string;
  unitNoValue?: string;
  floorNo?: number;
  residentName?: string | null;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
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
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
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

function mapStatus(status: string): DueStatus {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'paid';
    case 'overdue':
      return 'overdue';
    default:
      return 'pending';
  }
}

function mapDue(item: ApiDue): Due {
  return {
    id: item.id,
    unitId: item.unitId,
    unitNumber: item.unitNo ?? '',
    floorNo: item.floorNo, // EKLENDİ
    residentName: item.residentName ?? 'Sakin bilgisi yok',
    amount: item.amount,
    dueDate: item.dueDate,
    paidDate: item.paidDate ?? undefined,
    status: mapStatus(item.status),
    month: item.dueDate.slice(0, 7),
  };
}

export async function getAllDues(): Promise<Due[]> {
  const data = await request<ApiDue[]>('');
  return data.map(mapDue);
}

export async function getMyDues(): Promise<Due[]> {
  const data = await request<ApiDue[]>('/my');
  return data.map(mapDue);
}

export async function getDuesSummary() {
  return request<{
    totalDueAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    totalDueCount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  }>('/summary');
}

export async function createDue(data: {
  unitId: number;
  amount: number;
  dueDate: string;
}) {
  return request<ApiDue>('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function markDueAsPaid(id: number) {
  return request<ApiDue>(`/${id}/pay`, {
    method: 'PUT',
  });
}

export async function deleteDue(id: number) {
  return request<{ message: string }>(`/${id}`, {
    method: 'DELETE',
  });
}