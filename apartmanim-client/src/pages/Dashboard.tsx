
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DueBadge, MaintenanceBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

import type { Due } from '../types';

import {
  getAllDues,
  getMyDues,
  getDuesSummary,
} from '../api/duesApi';

import { getAnnouncements } from '../api/announcementsApi';

import {
  getAllMaintenanceRequests,
  getMyMaintenanceRequests,
} from '../api/maintenanceApi';

// ============================================
// İSTATİSTİK KARTI
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
// DAİRE API İSTEĞİ
// ============================================

async function getUnitCount(): Promise<number> {
  const token = localStorage.getItem('apartmanim_token');

  if (!token) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yap.');
  }

  const response = await fetch('http://localhost:5285/api/units', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Daire bilgileri alınamadı: HTTP ${response.status}`);
  }

  const units = await response.json();
  return Array.isArray(units) ? units.length : 0;
}

// ============================================
// DASHBOARD
// ============================================

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';

  const [totalUnits, setTotalUnits] = useState(0);
  const [paidDues, setPaidDues] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);
  const [overdueDues, setOverdueDues] = useState(0);

  const [announcements, setAnnouncements] = useState<
    Awaited<ReturnType<typeof getAnnouncements>>
  >([]);

  const [maintenanceRequests, setMaintenanceRequests] = useState<
    Awaited<ReturnType<typeof getAllMaintenanceRequests>>
  >([]);

  const [residentDues, setResidentDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [announcementData, maintenanceData] = await Promise.all([
          getAnnouncements(),
          isAdmin
            ? getAllMaintenanceRequests()
            : getMyMaintenanceRequests(),
        ]);

        if (cancelled) return;

        setAnnouncements(
          [...announcementData].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );

        setMaintenanceRequests(maintenanceData);

        if (isAdmin) {
          const [summary, units] = await Promise.all([
            getDuesSummary(),
            getUnitCount(),
          ]);

          if (cancelled) return;

          setTotalUnits(units);
          setPaidDues(summary.paidCount);
          setPendingDues(summary.pendingCount);
          setOverdueDues(summary.overdueCount);
        } else if (isResident) {
          const dues = await getMyDues();

          if (cancelled) return;

          setResidentDues(dues);
          setTotalUnits(1);
          setPaidDues(dues.filter((due) => due.status === 'paid').length);
          setPendingDues(
            dues.filter((due) => due.status === 'pending').length
          );
          setOverdueDues(
            dues.filter((due) => due.status === 'overdue').length
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Dashboard verileri yüklenemedi.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (user) {
      loadDashboard();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, isResident]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const recentAnnouncements = announcements.slice(0, 4);

  const openRequests = maintenanceRequests.filter((request) => {
    const status = String(request.status).toLowerCase();

    return ![
      'completed',
      'resolved',
      'closed',
      'tamamlandı',
      'cozuldu',
      'çözüldü',
      'kapatıldı',
    ].includes(status);
  });

  const recentRequests = [...openRequests]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const nextUnpaidDue = [...residentDues]
    .filter((due) => due.status !== 'paid')
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() -
        new Date(b.dueDate).getTime()
    )[0];

  return (
    <Layout
      title="Genel Bakış"
      subtitle={`Hoş geldiniz, ${user?.name ?? ''}`}
    >
      {error && (
        <div
          className="card mb-4"
          style={{
            padding: 'var(--space-4) var(--space-6)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid-4 mb-8">
        <StatCard
          icon="🏢"
          value={loading ? '...' : totalUnits}
          label={isResident ? 'Dairem' : 'Toplam Daire'}
          variant="primary"
        />
        <StatCard
          icon="✅"
          value={loading ? '...' : paidDues}
          label="Ödeme Yapıldı"
          variant="success"
        />
        <StatCard
          icon="⏳"
          value={loading ? '...' : pendingDues}
          label="Bekleyen Ödeme"
          variant="warning"
        />
        <StatCard
          icon="⚠️"
          value={loading ? '...' : overdueDues}
          label="Geciken Ödeme"
          variant="error"
        />
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
            {loading ? (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                Duyurular yükleniyor...
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                Henüz duyuru yok.
              </div>
            ) : (
              recentAnnouncements.map((ann) => (
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
              ))
            )}
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
            {loading ? (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                Talepler yükleniyor...
              </div>
            ) : recentRequests.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                Açık talep yok 🎉
              </div>
            ) : (
              recentRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  <div
                    className="flex items-center justify-between mb-4"
                    style={{ marginBottom: 'var(--space-1)' }}
                  >
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {req.title}
                    </p>
                    <MaintenanceBadge status={req.status} />
                  </div>

                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    📍 {req.location || 'Konum belirtilmemiş'}
                    &nbsp;·&nbsp;
                    {formatDate(req.createdAt)}
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
          background:
            'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
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
              {loading ? '...' : openRequests.length}
            </span>
          </h3>
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Bekleyen talepler için arıza ve bakım sayfasını ziyaret edin.
          </p>
        </div>

        <Link to="/maintenance" className="btn btn-accent">
          Taleplere Git →
        </Link>
      </div>

      {/* Sakin Aidat Durumu */}
      {isResident && (
        <div className="card mt-4" style={{ marginTop: 'var(--space-6)' }}>
          <div className="card-header">
            <span className="card-title">💰 Aidat Durumum</span>
          </div>

          <div className="card-body">
            {loading ? (
              <p className="text-sm">Aidat bilgileri yükleniyor...</p>
            ) : nextUnpaidDue ? (
              <div className="flex items-center gap-3">
                <DueBadge status={nextUnpaidDue.status} />
                <span className="text-sm">
                  Son ödeme: {formatDate(nextUnpaidDue.dueDate)}
                  {' · '}
                  {nextUnpaidDue.amount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </span>
              </div>
            ) : residentDues.length > 0 ? (
              <div className="flex items-center gap-3">
                <DueBadge status="paid" />
                <span className="text-sm">
                  Ödenmemiş aidatınız bulunmuyor.
                </span>
              </div>
            ) : (
              <p className="text-sm">Henüz aidat kaydı bulunmuyor.</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
