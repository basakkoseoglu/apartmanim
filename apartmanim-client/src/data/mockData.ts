import type {
  User,
  Announcement,
  Due,
  MaintenanceRequest,
  DashboardStats,
} from '../types';

// ============================================
// MOCK KULLANICILAR
// (localStorage'da oturum simülasyonu için)
// ============================================

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Ahmet Yılmaz',
    email: 'admin@apartmanim.com',
    role: 'admin',
    apartmentId: 1,
  },
  {
    id: 2,
    name: 'Fatma Çelik',
    email: 'fatma@apartmanim.com',
    role: 'resident',
    unitId: 1,
    unitNumber: 'Daire 3',
    apartmentId: 1,
  },
  {
    id: 3,
    name: 'Mehmet Kaya',
    email: 'mehmet@apartmanim.com',
    role: 'resident',
    unitId: 2,
    unitNumber: 'Daire 7',
    apartmentId: 1,
  },
];

// Test şifresi: "123456" (tüm kullanıcılar için)
export const MOCK_PASSWORD = '123456';

// ============================================
// MOCK DUYURULAR
// ============================================

export const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'Asansör Bakımı Hakkında Bilgilendirme',
    content:
      '15 Ekim Çarşamba günü saat 09:00-13:00 arasında asansörümüz bakım nedeniyle hizmet dışı kalacaktır. Merdivenleri kullanmanızı rica ederiz.',
    authorName: 'Ahmet Yılmaz',
    createdAt: '2024-10-12T09:00:00Z',
    apartmentId: 1,
  },
  {
    id: 2,
    title: 'Ekim Ayı Aidat Hatırlatması',
    content:
      'Ekim 2024 aidat ödemelerinizin son tarihi 15 Ekim 2024\'tür. Ödemelerinizi yönetici hesabına yapmanızı hatırlatırız.',
    authorName: 'Ahmet Yılmaz',
    createdAt: '2024-10-05T10:30:00Z',
    apartmentId: 1,
  },
  {
    id: 3,
    title: 'Temizlik Programı Güncellendi',
    content:
      'Apartmanımızın ortak alan temizliği bundan böyle Pazartesi ve Perşembe günleri yapılacaktır.',
    authorName: 'Ahmet Yılmaz',
    createdAt: '2024-09-28T14:00:00Z',
    apartmentId: 1,
  },
  {
    id: 4,
    title: 'Su Kesintisi Uyarısı',
    content:
      '20 Ekim Pazar günü saat 08:00-16:00 arası belediye tarafından planlı su kesintisi uygulanacaktır.',
    authorName: 'Ahmet Yılmaz',
    createdAt: '2024-09-20T11:00:00Z',
    apartmentId: 1,
  },
];

// ============================================
// MOCK AİDATLAR
// ============================================

export const mockDues: Due[] = [
  {
    id: 1,
    unitId: 1,
    unitNumber: 'Daire 1',
    residentName: 'Ali Demir',
    amount: 750,
    dueDate: '2024-10-15',
    paidDate: '2024-10-03',
    status: 'paid',
    month: '2024-10',
  },
  {
    id: 2,
    unitId: 2,
    unitNumber: 'Daire 2',
    residentName: 'Zeynep Arslan',
    amount: 750,
    dueDate: '2024-10-15',
    status: 'pending',
    month: '2024-10',
  },
  {
    id: 3,
    unitId: 3,
    unitNumber: 'Daire 3',
    residentName: 'Fatma Çelik',
    amount: 750,
    dueDate: '2024-10-15',
    paidDate: '2024-10-10',
    status: 'paid',
    month: '2024-10',
  },
  {
    id: 4,
    unitId: 4,
    unitNumber: 'Daire 4',
    residentName: 'Mustafa Şahin',
    amount: 750,
    dueDate: '2024-10-15',
    status: 'overdue',
    month: '2024-10',
  },
  {
    id: 5,
    unitId: 5,
    unitNumber: 'Daire 5',
    residentName: 'Ayşe Koç',
    amount: 750,
    dueDate: '2024-10-15',
    paidDate: '2024-10-08',
    status: 'paid',
    month: '2024-10',
  },
  {
    id: 6,
    unitId: 6,
    unitNumber: 'Daire 6',
    residentName: 'Hasan Öztürk',
    amount: 750,
    dueDate: '2024-10-15',
    status: 'pending',
    month: '2024-10',
  },
  {
    id: 7,
    unitId: 7,
    unitNumber: 'Daire 7',
    residentName: 'Mehmet Kaya',
    amount: 750,
    dueDate: '2024-10-15',
    status: 'overdue',
    month: '2024-10',
  },
  {
    id: 8,
    unitId: 8,
    unitNumber: 'Daire 8',
    residentName: 'Elif Yıldız',
    amount: 750,
    dueDate: '2024-10-15',
    paidDate: '2024-10-11',
    status: 'paid',
    month: '2024-10',
  },
];

// ============================================
// MOCK ARIZA VE BAKIM TALEPLERİ
// ============================================

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: 1,
    title: 'Bodrum Kat Su Sızıntısı',
    description:
      'Bodrum kattaki depoda tavan arasından su sızıntısı tespit edildi. Acil müdahale gerekiyor.',
    location: 'Bodrum Kat - Depo',
    status: 'in_progress',
    priority: 'high',
    requesterId: 1,
    requesterName: 'Ahmet Yılmaz',
    createdAt: '2024-10-11T08:30:00Z',
    updatedAt: '2024-10-12T10:00:00Z',
    apartmentId: 1,
  },
  {
    id: 2,
    title: 'Giriş Kapısı Kilidi Arızalı',
    description:
      'Apartman giriş kapısının elektronik kilidi zaman zaman çalışmıyor.',
    location: 'Giriş Holü',
    status: 'open',
    priority: 'medium',
    requesterId: 2,
    requesterName: 'Fatma Çelik',
    createdAt: '2024-10-10T15:00:00Z',
    apartmentId: 1,
  },
  {
    id: 3,
    title: '3. Kat Koridor Lambası Yanmıyor',
    description:
      '3. kat koridorundaki lambalardan biri arızalandı, ampul değişimi gerekiyor.',
    location: '3. Kat Koridor',
    status: 'completed',
    priority: 'low',
    requesterId: 3,
    requesterName: 'Mehmet Kaya',
    createdAt: '2024-10-08T09:00:00Z',
    updatedAt: '2024-10-09T11:30:00Z',
    apartmentId: 1,
  },
  {
    id: 4,
    title: 'Çatı Terası Çatlak Onarımı',
    description:
      'Çatı terasında yağmur suyunun birikimine yol açan çatlaklar mevcut.',
    location: 'Çatı Terası',
    status: 'open',
    priority: 'high',
    requesterId: 1,
    requesterName: 'Ahmet Yılmaz',
    createdAt: '2024-10-06T13:00:00Z',
    apartmentId: 1,
  },
  {
    id: 5,
    title: 'Otopark Aydınlatma Sorunu',
    description: 'Otopark girişindeki hareket sensörlü lambalar çalışmıyor.',
    location: 'Otopark Girişi',
    status: 'open',
    priority: 'medium',
    requesterId: 2,
    requesterName: 'Fatma Çelik',
    createdAt: '2024-10-04T10:00:00Z',
    apartmentId: 1,
  },
];

// ============================================
// DASHBOARD İSTATİSTİKLERİ
// ============================================

export const mockDashboardStats: DashboardStats = {
  totalDues: mockDues.length,
  paidDues: mockDues.filter((d) => d.status === 'paid').length,
  pendingDues: mockDues.filter((d) => d.status === 'pending').length,
  overdueDues: mockDues.filter((d) => d.status === 'overdue').length,
  openMaintenanceRequests: mockMaintenanceRequests.filter(
    (r) => r.status === 'open'
  ).length,
  recentAnnouncements: mockAnnouncements.slice(0, 3),
  recentRequests: mockMaintenanceRequests.filter((r) => r.status !== 'completed').slice(0, 3),
};
