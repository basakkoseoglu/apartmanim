import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DueBadge, MaintenanceBadge } from '../components/ui/Badge';
import { mockDashboardStats } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// ============================================
// İSTATİSTİK KART BİLEŞENİ (yerel)
// ============================================
interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  variant: 'primary' | 'success' | 'warning' | 'error' | 'accent';
}

function StatCard({ icon, value, label, variant }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD SAYFASI
// ============================================
export function DashboardPage() {
  const { user } = useAuth();
  const stats = mockDashboardStats;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <Layout
      title="Genel Bakış"
      subtitle={`Hoş geldiniz, ${user?.name}`}
    >
      {/* İstatistik Kartları */}
      <div className="grid-4 mb-8">
        <StatCard icon="🏢" value={stats.totalDues}   label="Toplam Daire"        variant="primary" />
        <StatCard icon="✅" value={stats.paidDues}    label="Ödeme Yapıldı"       variant="success" />
        <StatCard icon="⏳" value={stats.pendingDues} label="Bekleyen Ödeme"      variant="warning" />
        <StatCard icon="⚠️" value={stats.overdueDues} label="Geciken Ödeme"       variant="error"   />
      </div>

      <div className="grid-2">
        {/* Son Duyurular */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📢 Son Duyurular</span>
            <Link to="/announcements" className="btn btn-ghost btn-sm">
              Tümünü Gör →
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  borderBottom: '1px solid var(--color-border-light)',
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  {ann.title}
                </p>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}
                >
                  {ann.content}
                </p>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-light)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  {formatDate(ann.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Açık Talepler */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔧 Açık Talepler</span>
            <Link to="/maintenance" className="btn btn-ghost btn-sm">
              Tümünü Gör →
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.recentRequests.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Açık talep yok 🎉
              </div>
            ) : (
              stats.recentRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4" style={{ marginBottom: 'var(--space-1)' }}>
                    <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                      {req.title}
                    </p>
                    <MaintenanceBadge status={req.status} />
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    📍 {req.location} &nbsp;·&nbsp; {formatDate(req.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Özet Bilgi Kutusu */}
      <div
        style={{
          marginTop: 'var(--space-6)',
          padding: 'var(--space-5) var(--space-6)',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h3 style={{ color: '#fff', marginBottom: 'var(--space-1)' }}>
            Açık Bakım Talebi:{' '}
            <span style={{ color: 'var(--color-accent)' }}>
              {stats.openMaintenanceRequests}
            </span>
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)' }}>
            Bekleyen talepler için arıza ve bakım sayfasını ziyaret edin.
          </p>
        </div>
        <Link to="/maintenance" className="btn btn-accent">
          Taleplere Git →
        </Link>
      </div>

      {/* Sakin ise kendi aidat durumunu göster */}
      {user?.role === 'resident' && (
        <div className="card mt-4" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card-header">
            <span className="card-title">💰 Aidat Durumum</span>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-3">
              <DueBadge status="pending" />
              <span className="text-sm">
                Ekim 2024 — Son ödeme: 15 Ekim 2024
              </span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
