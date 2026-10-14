import type { DueStatus, MaintenanceStatus, MaintenancePriority } from '../../types';

// ============================================
// AİDAT DURUM ETİKETİ
// ============================================
interface DueBadgeProps { status: DueStatus; }

export function DueBadge({ status }: DueBadgeProps) {
  const map: Record<DueStatus, { cls: string; label: string }> = {
    paid:    { cls: 'badge badge-success', label: 'Ödendi' },
    pending: { cls: 'badge badge-warning', label: 'Bekliyor' },
    overdue: { cls: 'badge badge-error',   label: 'Gecikti' },
  };
  const { cls, label } = map[status];
  return <span className={cls}>{label}</span>;
}

// ============================================
// BAKIM DURUM ETİKETİ
// ============================================
interface MaintenanceBadgeProps { status: MaintenanceStatus; }

export function MaintenanceBadge({ status }: MaintenanceBadgeProps) {
  const map: Record<MaintenanceStatus, { cls: string; label: string }> = {
    open:        { cls: 'badge badge-error',   label: 'Açık' },
    in_progress: { cls: 'badge badge-warning', label: 'İnceleniyor' },
    completed:   { cls: 'badge badge-success', label: 'Tamamlandı' },
  };
  const { cls, label } = map[status];
  return <span className={cls}>{label}</span>;
}

// ============================================
// ÖNCELİK ETİKETİ
// ============================================
interface PriorityBadgeProps { priority: MaintenancePriority; }

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const map: Record<MaintenancePriority, { cls: string; label: string }> = {
    low:    { cls: 'badge badge-gray', label: 'Düşük' },
    medium: { cls: 'badge badge-info', label: 'Orta' },
    high:   { cls: 'badge badge-error', label: 'Yüksek' },
  };
  const { cls, label } = map[priority];
  return <span className={cls}>{label}</span>;
}
