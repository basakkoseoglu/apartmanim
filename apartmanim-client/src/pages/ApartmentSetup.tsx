
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FloorInput {
  floorNo: number;
  unitCount: number;
}

const API_URL = 'http://localhost:5285/api/Apartments';

export function ApartmentSetupPage() {
  const navigate = useNavigate();
  const { refreshSetupStatus } = useAuth();
  const [floors, setFloors] = useState<FloorInput[]>([
    { floorNo: 1, unitCount: 4 },
    { floorNo: 2, unitCount: 4 },
    { floorNo: 3, unitCount: 4 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateFloor = (
    index: number,
    field: keyof FloorInput,
    value: number,
  ) => {
    setFloors((current) =>
      current.map((floor, i) =>
        i === index ? { ...floor, [field]: value } : floor,
      ),
    );
  };

  const addFloor = () => {
    setFloors((current) => [
      ...current,
      {
        floorNo: Math.max(0, ...current.map((floor) => floor.floorNo)) + 1,
        unitCount: 4,
      },
    ]);
  };

  const removeFloor = (index: number) => {
    setFloors((current) => current.filter((_, i) => i !== index));
  };

  const totalUnits = floors.reduce(
    (total, floor) => total + floor.unitCount,
    0,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (
      floors.length === 0 ||
      floors.some(
        (floor) =>
          !Number.isInteger(floor.floorNo) ||
          floor.floorNo <= 0 ||
          !Number.isInteger(floor.unitCount) ||
          floor.unitCount <= 0 ||
          floor.unitCount > 200,
      )
    ) {
      setError('Kat ve daire sayıları geçerli olmalıdır.');
      return;
    }

    if (new Set(floors.map((floor) => floor.floorNo)).size !== floors.length) {
      setError('Kat numaraları birbirinden farklı olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('apartmanim_token');

      const response = await fetch(`${API_URL}/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          floors: floors.map((floor) => ({
            floorNo: floor.floorNo,
            unitCount: floor.unitCount,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? 'Apartman kurulumu tamamlanamadı.');
        return;
      }

      await refreshSetupStatus();
        navigate('/dashboard', { replace: true });
    } catch {
      setError('Sunucuya bağlanılamadı. API çalışıyor mu kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="setup-page">
      <section className="setup-card">
        <h1>Apartmanım</h1>
        <h2>Apartman Kurulumu</h2>
        <p>
          Yönetimini yapacağın apartmanın kat ve daire bilgilerini belirle.
          Daireler otomatik olarak oluşturulacaktır.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="setup-floor-list">
            {floors.map((floor, index) => (
              <div className="setup-floor-row" key={index}>
                <label>
                  Kat numarası
                  <input
                    type="number"
                    min="1"
                    value={floor.floorNo}
                    onChange={(event) =>
                      updateFloor(
                        index,
                        'floorNo',
                        Number(event.target.value),
                      )
                    }
                    required
                  />
                </label>

                <label>
                  Daire sayısı
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={floor.unitCount}
                    onChange={(event) =>
                      updateFloor(
                        index,
                        'unitCount',
                        Number(event.target.value),
                      )
                    }
                    required
                  />
                </label>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeFloor(index)}
                  aria-label={`${floor.floorNo}. katı kaldır`}
                >
                  Kaldır
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addFloor}
            disabled={floors.length >= 100}
          >
            + Kat Ekle
          </button>

          <div className="setup-total">
            <span>Toplam kat</span>
            <strong>{floors.length}</strong>
            <span>Toplam daire</span>
            <strong>{totalUnits}</strong>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Kurulum yapılıyor...' : 'Kurulumu Tamamla'}
          </button>
        </form>
      </section>
    </main>
  );
}
