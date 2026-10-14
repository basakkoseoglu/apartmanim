
import type {
  MaintenanceRequest,
  MaintenanceForm,
  MaintenanceStatus,
  MaintenancePriority,
} from '../types';

const API_URL = 'http://localhost:5285/api/maintenance-requests';

interface ApiMaintenanceRequest {
  id: number;
  unitId: number;
  floorNo?: number | null;
  unitNo?: number | null;
  requesterName?: string | null;
  requesterId?: number;
  title: string;
  description: string;
  location?: string | null;
  priority?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  apartmentId?: number;
}

function getToken(): string {
  return localStorage.getItem('apartmanim_token') ?? '';
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
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
      errorData?.message ?? `İşlem başarısız. HTTP ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

function mapStatus(status: string): MaintenanceStatus {
  switch (status.toLowerCase()) {
    case 'inprogress':
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    default:
      return 'open';
  }
}

function mapStatusToApi(status: MaintenanceStatus): string {
  switch (status) {
    case 'in_progress':
      return 'InProgress';
    case 'completed':
      return 'Completed';
    default:
      return 'Pending';
  }
}

function mapPriority(priority?: string | null): MaintenancePriority {
  switch (priority?.toLowerCase()) {
    case 'low':
      return 'low';
    case 'high':
      return 'high';
    default:
      return 'medium';
  }
}

function mapRequest(item: ApiMaintenanceRequest): MaintenanceRequest {
  const location =
    item.location?.trim() ||
    (item.floorNo != null && item.unitNo != null
      ? `${item.floorNo}. Kat - Daire ${item.unitNo}`
      : 'Konum belirtilmedi');

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    location,
    status: mapStatus(item.status),
    priority: mapPriority(item.priority),
    requesterId: item.requesterId ?? 0,
    requesterName: item.requesterName ?? 'Sakin',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? undefined,
    apartmentId: item.apartmentId ?? 0,
  };
}

export async function getAllMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const data = await request<ApiMaintenanceRequest[]>('');
  return data.map(mapRequest);
}

export async function getMyMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const data = await request<ApiMaintenanceRequest[]>('/my');
  return data.map(mapRequest);
}

export async function createMaintenanceRequest(
  data: MaintenanceForm,
): Promise<MaintenanceRequest> {
  const created = await request<ApiMaintenanceRequest>('', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      location: data.location,
      priority: data.priority,
    }),
  });

  return {
    ...mapRequest(created),
    location: data.location,
    priority: data.priority,
  };
}

export async function updateMaintenanceRequestStatus(
  id: number,
  status: MaintenanceStatus,
): Promise<void> {
  await request<ApiMaintenanceRequest>(`/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: mapStatusToApi(status) }),
  });
}
