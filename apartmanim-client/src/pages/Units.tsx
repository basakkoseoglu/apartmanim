import { useState, type FormEvent } from 'react';
import { Layout } from '../components/layout/Layout';
import { useBuilding } from '../context/BuildingContext';

export function UnitsPage() {
  const { floors, units, addFloor, addUnits } = useBuilding();

  const [floorNumber, setFloorNumber] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [unitCount, setUnitCount] = useState('3');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddFloor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const floor = Number(floorNumber);

    if (!Number.isInteger(floor) || floor < 0) {
      setError('Kat numarası 0 veya daha büyük bir tam sayı olmalıdır.');
      return;
    }

    if (floors.includes(floor)) {
      setError('Bu kat zaten mevcut.');
      return;
    }

    addFloor(floor);
    setFloorNumber('');
    setMessage(`${floor}. kat başarıyla eklendi.`);
  };

  const handleAddUnits = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const floor = Number(selectedFloor);
    const count = Number(unitCount);

    if (selectedFloor === '' || !floors.includes(floor)) {
      setError('Lütfen bir kat seç.');
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      setError('Daire sayısı 1 ile 100 arasında olmalıdır.');
      return;
    }

    try {
      addUnits(floor, count);
      setMessage(`${floor}. kata ${count} daire başarıyla eklendi.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Daireler eklenemedi.',
      );
    }
  };

  return (
    <Layout
      title="Daire Yönetimi"
      subtitle="Apartmanın katlarını ve dairelerini oluştur."
    >
      {(message || error) && (
        <div
          className={`units-alert ${
            error ? 'units-alert-error' : 'units-alert-success'
          }`}
          role={error ? 'alert' : 'status'}
        >
          {error || message}
        </div>
      )}

      <div className="units-management-grid">
        <section className="card units-form-card">
          <div className="card-header">
            <h3 className="card-title">Kat Ekle</h3>
          </div>

          <div className="card-body">
            <p className="units-description">
              Apartmana yeni bir kat tanımla.
            </p>

            <form onSubmit={handleAddFloor} className="units-form">
              <div className="form-group">
                <label className="form-label" htmlFor="new-floor">
                  Kat numarası
                </label>

                <input
                  id="new-floor"
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  value={floorNumber}
                  onChange={(event) => setFloorNumber(event.target.value)}
                  placeholder="Örn. 4"
                  required
                />
              </div>

              <button className="btn btn-primary" type="submit">
                + Kat Ekle
              </button>
            </form>
          </div>
        </section>

        <section className="card units-form-card">
          <div className="card-header">
            <h3 className="card-title">Daire Ekle</h3>
          </div>

          <div className="card-body">
            <p className="units-description">
              Bir kat seç ve o kata eklemek istediğin daire sayısını gir.
              Mevcut daire numaraları korunur.
            </p>

            <form onSubmit={handleAddUnits} className="units-form">
              <div className="form-group">
                <label className="form-label" htmlFor="selected-floor">
                  Kat seçimi
                </label>

                <select
                  id="selected-floor"
                  className="form-select"
                  value={selectedFloor}
                  onChange={(event) => setSelectedFloor(event.target.value)}
                  required
                >
                  <option value="">Kat seç</option>

                  {floors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}. Kat
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="unit-count">
                  Eklenecek daire sayısı
                </label>

                <input
                  id="unit-count"
                  className="form-input"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={unitCount}
                  onChange={(event) => setUnitCount(event.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={floors.length === 0}
              >
                + Daireleri Ekle
              </button>

              {floors.length === 0 && (
                <p className="units-description">
                  Önce bir kat eklemelisin.
                </p>
              )}
            </form>
          </div>
        </section>
      </div>

      <section className="card units-list-card">
        <div className="card-header">
          <h3 className="card-title">Mevcut Katlar</h3>
          <span className="badge badge-info">
            {floors.length} kat
          </span>
        </div>

        <div className="units-floor-list">
          {floors.length === 0 ? (
            <p className="units-empty">
              Henüz kat eklenmemiş. İlk katını yukarıdan ekleyebilirsin.
            </p>
          ) : (
            [...floors]
              .sort((a, b) => a - b)
              .map((floor) => {
                const floorUnitCount = units.filter(
                  (unit) => unit.floorNo === floor,
                ).length;

                return (
                  <div className="units-floor-row" key={floor}>
                    <div className="units-floor-icon">🏢</div>

                    <div className="units-floor-info">
                      <strong>{floor}. Kat</strong>
                      <span>
                        {floorUnitCount} daire
                      </span>
                    </div>

                    <span className="units-floor-count">
                      {floorUnitCount}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </section>
    </Layout>
  );
}
