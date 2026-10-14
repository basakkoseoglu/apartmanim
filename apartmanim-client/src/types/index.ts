// ============================================
// KULLANICI VE KİMLİK DOĞRULAMA
// ============================================

export type UserRole = 'admin' | 'resident';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  unitId?: number;      // Sakin ise daire ID'si
  unitNumber?: string;  // Sakin ise daire numarası
  apartmentId: number;
}

// ============================================
// DUYURULAR
// ============================================

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;   // ISO date string
  updatedAt?: string;
  apartmentId: number;
}

// ============================================
// AİDATLAR
// ============================================

export type DueStatus = 'paid' | 'pending' | 'overdue';

export interface Due {
  id: number;
  unitId: number;
  unitNumber: string;
  residentName: string;
  amount: number;        // TL cinsinden
  dueDate: string;       // Son ödeme tarihi
  paidDate?: string;     // Ödeme tarihi
  status: DueStatus;
  month: string;         // Örn: "2024-10"
}

// ============================================
// ARIZA VE BAKIM
// ============================================

export type MaintenanceStatus = 'open' | 'in_progress' | 'completed';
export type MaintenancePriority = 'low' | 'medium' | 'high';

export interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  location: string;       // Örn: "Kat 3 - Daire 12"
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  requesterId: number;
  requesterName: string;
  createdAt: string;
  updatedAt?: string;
  apartmentId: number;
}

// ============================================
// DASHBOARD İSTATİSTİKLERİ
// ============================================

export interface DashboardStats {
  totalDues: number;
  paidDues: number;
  pendingDues: number;
  overdueDues: number;
  openMaintenanceRequests: number;
  recentAnnouncements: Announcement[];
  recentRequests: MaintenanceRequest[];
}

// ============================================
// FORM TİPLERİ
// ============================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface AnnouncementForm {
  title: string;
  content: string;
}

export interface MaintenanceForm {
  title: string;
  description: string;
  location: string;
  priority: MaintenancePriority;
}
