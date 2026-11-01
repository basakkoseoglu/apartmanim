import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { DueBadge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import {
  getAllDues,
  getMyDues,
  createDue,
  markDueAsPaid,
  deleteDue,
} from "../api/duesApi";
import type { Due } from "../types";

interface Unit {
  id: number;
  unitNo: string;
  floorNo?: number;
  residentName?: string | null;
}

type DueScope = "single" | "all" | "occupied";

const API_URL = "http://localhost:5285/api";

export function DuesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [dues, setDues] = useState<Due[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const occupiedUnits = units.filter((unit) => unit.residentName?.trim());
  const [statusModal, setStatusModal] = useState<Due | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [scope, setScope] = useState<DueScope>("all");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDues = async () => {
    if (!user) return;

    const currentUser = user;

    const data = isAdmin ? await getAllDues() : await getMyDues();

    setDues(
      data.map((due) => ({
        ...due,
        unitNumber: due.unitNumber || currentUser.unitNumber || "—",
        residentName: due.residentName || "Boş Daire",
      })),
    );
  };

  useEffect(() => {
    if (!user) {
      setDues([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      if (!user) return;

      const currentUser = user;
      setLoading(true);
      setError("");

      try {
        const data = isAdmin ? await getAllDues() : await getMyDues();

        if (active) {
          setDues(
            data.map((due) => ({
              ...due,
              unitNumber: due.unitNumber || currentUser.unitNumber || "—",
              residentName: due.residentName || "Boş Daire",
            })),
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Aidatlar yüklenirken bir hata oluştu.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatAmount = (value: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(value);

  const openAddModal = async () => {
    setError("");
    setNotice("");
    setScope("all");
    setSelectedUnitId("");
    setAmount("");
    setDueDate("");
    setIsAddOpen(true);

    setUnitsLoading(true);

    try {
      const token = localStorage.getItem("apartmanim_token");

      if (!token) {
        throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
      }

      const response = await fetch(`${API_URL}/units`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Daire listesi yüklenemedi.");
      }

      const data: Unit[] = await response.json();
      setUnits(data);

      if (data.length > 0) {
        setSelectedUnitId(String(data[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Daire listesi yüklenemedi.",
      );
    } finally {
      setUnitsLoading(false);
    }
  };

  const closeAddModal = () => {
    if (saving) return;
    setIsAddOpen(false);
  };

  const onAddSubmit = async () => {
    if (saving) return;

    setError("");
    setNotice("");

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Geçerli ve sıfırdan büyük bir aidat tutarı gir.");
      return;
    }

    if (!dueDate) {
      setError("Son ödeme tarihini seç.");
      return;
    }

    if (scope === "single" && !selectedUnitId) {
      setError("Lütfen bir daire seç.");
      return;
    }

    const targetUnits =
      scope === "all"
        ? units
        : scope === "occupied"
          ? occupiedUnits
          : units.filter((unit) => unit.id === Number(selectedUnitId));

    if (targetUnits.length === 0) {
      setError("Aidat oluşturulacak daire bulunamadı.");
      return;
    }

    // Aynı daireye aynı ay için ikinci kez aidat oluşturma.
    const targetMonth = dueDate.slice(0, 7);

    const alreadyExists = targetUnits.filter((unit) =>
      dues.some((due) => due.unitId === unit.id && due.month === targetMonth),
    );

    const existingIds = new Set(alreadyExists.map((unit) => unit.id));

    const unitsToCreate = targetUnits.filter(
      (unit) => !existingIds.has(unit.id),
    );

    if (unitsToCreate.length === 0) {
      setError("Seçilen daire(ler) için bu ayın aidatı zaten mevcut.");
      return;
    }

    setSaving(true);

    try {
      const results = await Promise.allSettled(
        unitsToCreate.map((unit) =>
          createDue({
            unitId: unit.id,
            amount: numericAmount,
            dueDate,
          }),
        ),
      );

      const successCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      const failedCount = results.length - successCount;

      // Başarılı kayıtları listede göstermek için API'den yeniden oku.
      await loadDues();

      if (failedCount > 0) {
        setError(
          `${successCount} aidat oluşturuldu, ${failedCount} kayıt oluşturulamadı. Hata ayrıntıları için tekrar kontrol et.`,
        );
      } else {
        const skippedCount = alreadyExists.length;

        setNotice(
          `${successCount} aidat başarıyla oluşturuldu.` +
            (skippedCount > 0
              ? ` ${skippedCount} dairede aynı ay için kayıt bulunduğundan atlandı.`
              : ""),
        );

        setIsAddOpen(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Aidatlar oluşturulurken bir hata oluştu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (due: Due) => {
    setError("");
    setStatusModal(due);
  };

  const applyStatus = async () => {
    if (!statusModal || saving) return;

    if (statusModal.status === "paid") {
      setStatusModal(null);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedDue = await markDueAsPaid(statusModal.id);

      setDues((prev) =>
        prev.map((due) =>
          due.id === statusModal.id
            ? {
                ...due,
                status: "paid",
                paidDate: updatedDue.paidDate ?? new Date().toISOString(),
              }
            : due,
        ),
      );

      setStatusModal(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Aidat durumu güncellenemedi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDue = async (due: Due) => {
    if (saving || deletingId !== null) return;

    const confirmed = window.confirm(
      `${due.unitNumber} numaralı dairenin ${formatAmount(due.amount)} tutarındaki aidatını silmek istediğine emin misin?`,
    );

    if (!confirmed) return;

    setDeletingId(due.id);
    setError("");
    setNotice("");

    try {
      await deleteDue(due.id);

      setDues((prev) => prev.filter((item) => item.id !== due.id));

      setNotice("Aidat başarıyla silindi.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Aidat silinirken bir hata oluştu.",
      );
    } finally {
      setDeletingId(null);
    }
  };


  const sortedDues = [...dues].sort((a, b) => {
  const floorComparison = (a.floorNo ?? 0) - (b.floorNo ?? 0);

  if (floorComparison !== 0) {
    return floorComparison;
  }

  return (
    Number(a.unitNumber) - Number(b.unitNumber)
  );
});

  const total = dues.length;
  const paid = dues.filter((due) => due.status === "paid").length;
  const pending = dues.filter((due) => due.status === "pending").length;
  const overdue = dues.filter((due) => due.status === "overdue").length;

  return (
    <Layout
      title="Aidatlar"
      subtitle="Daire aidat kayıtları ve ödeme durumları"
    >
      <div className="page-header">
        <div>
          <h1>Aidatlar</h1>
          <p>Aidat kayıtları ve ödeme durumları</p>
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => void openAddModal()}
          >
            + Aidat Oluştur
          </button>
        )}
      </div>

      {error && (
        <div
          className="card mb-8"
          role="alert"
          style={{
            color: "var(--color-danger, #dc2626)",
          }}
        >
          <div className="card-body">{error}</div>
        </div>
      )}

      {notice && (
        <div
          className="card mb-8"
          role="status"
          style={{
            color: "var(--color-success, #15803d)",
          }}
        >
          <div className="card-body">{notice}</div>
        </div>
      )}

      {isAdmin && (
        <div className="grid-4 mb-8">
          <div className="stat-card">
            <div className="stat-icon primary">🏢</div>
            <div className="stat-info">
              <div className="stat-value">{total}</div>
              <div className="stat-label">Toplam Aidat</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">✅</div>
            <div className="stat-info">
              <div className="stat-value">{paid}</div>
              <div className="stat-label">Ödendi</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{pending}</div>
              <div className="stat-label">Bekliyor</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon error">⚠️</div>
            <div className="stat-info">
              <div className="stat-value">{overdue}</div>
              <div className="stat-label">Gecikti</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">💰 Aidat Listesi</span>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            {dues.length} kayıt
          </span>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Daire</th>
                <th>Sakin Adı</th>
                <th>Tutar</th>
                <th>Son Ödeme</th>
                <th>Ödeme Tarihi</th>
                <th>Durum</th>
                {isAdmin && <th>İşlem</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6}>Aidatlar yükleniyor...</td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6}>
                    Henüz aidat kaydı bulunmuyor.
                  </td>
                </tr>
              ) : (
                sortedDues.map((due) => (
                  <tr key={due.id}>
                    <td style={{ fontWeight: 600 }}>
                      {due.floorNo !== undefined
                        ? `${due.floorNo}. Kat - Daire ${due.unitNumber}`
                        : `Daire ${due.unitNumber}`}
                    </td>
                    <td>{due.residentName}</td>
                    <td
                      style={{
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {formatAmount(due.amount)}
                    </td>
                    <td>{formatDate(due.dueDate)}</td>
                    <td>
                      {due.paidDate ? (
                        formatDate(due.paidDate)
                      ) : (
                        <span
                          style={{
                            color: "var(--color-text-light)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      <DueBadge status={due.status} />
                    </td>

                    {isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openStatusModal(due)}
                            disabled={
                              due.status === "paid" || deletingId !== null
                            }
                          >
                            {due.status === "paid" ? "Ödendi" : "Güncelle"}
                          </button>

                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => void handleDeleteDue(due)}
                            disabled={deletingId !== null}
                            style={{
                              color: "#dc2626",
                              borderColor: "#dc2626",
                            }}
                          >
                            {deletingId === due.id ? "Siliniyor..." : "Sil"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aidat Oluşturma Modalı — yalnızca yönetici */}
      <Modal
        isOpen={isAddOpen && isAdmin}
        title="Aidat Oluştur"
        onClose={closeAddModal}
        footer={
          <>
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={closeAddModal}
            >
              İptal
            </button>

            <button
              className="btn btn-primary"
              disabled={saving || unitsLoading}
              onClick={() => void onAddSubmit()}
            >
              {saving ? "Oluşturuluyor..." : "Aidat Oluştur"}
            </button>
          </>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div className="form-group">
            <label className="form-label">Aidat Kapsamı</label>
            <select
              className="form-select"
              value={scope}
              onChange={(e) => setScope(e.target.value as DueScope)}
              disabled={saving}
            >
              <option value="all">Tüm daireler ({units.length})</option>
              <option value="occupied">
                Dolu daireler ({occupiedUnits.length})
              </option>
              <option value="single">Tek bir daire</option>
            </select>
          </div>

          {scope === "single" && (
            <div className="form-group">
              <label className="form-label">Daire Seç</label>
              <select
                className="form-select"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={saving || unitsLoading}
              >
                {units.length === 0 && (
                  <option value="">Daire bulunamadı</option>
                )}

                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.floorNo !== undefined
                      ? `${unit.floorNo}. Kat - Daire ${unit.unitNo}`
                      : `Daire ${unit.unitNo}`}
                    {unit.residentName ? ` (${unit.residentName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {unitsLoading && <p>Daireler yükleniyor...</p>}

          {!unitsLoading && units.length === 0 && (
            <p>Bu apartmanda daire bulunamadı.</p>
          )}

          <div className="form-group">
            <label className="form-label">Aidat Tutarı (₺)</label>
            <input
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Örn: 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Son Ödeme Tarihi</label>
            <input
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving}
            />
          </div>

          {scope === "all" && units.length > 0 && (
            <p
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              Aynı ay için aidatı zaten bulunan daireler tekrar eklenmeyecek.
            </p>
          )}
        </div>
      </Modal>

      {/* Aidat Ödemesi Modalı */}
      <Modal
        isOpen={statusModal !== null}
        title={`Aidat Ödemesi — ${statusModal?.unitNumber ?? ""}`}
        onClose={() => {
          if (!saving) setStatusModal(null);
        }}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setStatusModal(null)}
              disabled={saving}
            >
              İptal
            </button>

            <button
              className="btn btn-primary"
              onClick={() => void applyStatus()}
              disabled={saving || statusModal?.status === "paid"}
            >
              {saving ? "Kaydediliyor..." : "Ödendi olarak işaretle"}
            </button>
          </>
        }
      >
        <p>
          Bu aidatın ödemesinin alındığını onaylıyor musun? Onayladığında ödeme
          durumu veritabanında güncellenecek.
        </p>
      </Modal>
    </Layout>
  );
}
