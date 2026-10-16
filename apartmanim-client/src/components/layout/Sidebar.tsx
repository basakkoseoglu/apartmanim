import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// İkon bileşeni (emoji tabanlı, ikon kütüphanesi gerektirmez)
// const icons: Record<string, string> = {
//   dashboard:     '🏠',
//   announcements: '📢',
//   dues:          '💰',
//   maintenance:   '🔧',
// };

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() ?? '?';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h2>
          Apart<span>manım</span>
        </h2>
        <p>Dijital Apartman Yönetimi</p>
      </div>

      {/* Navigasyon */}
      <ul className="sidebar-nav">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            {/* <span className="nav-icon">{icons.dashboard}</span> */}
            Genel Bakış
          </NavLink>
        </li>
        <li>
          <NavLink to="/announcements" className={({ isActive }) => isActive ? 'active' : ''}>
            {/* <span className="nav-icon">{icons.announcements}</span> */}
            Duyurular
          </NavLink>
        </li>
        <li>
          <NavLink to="/dues" className={({ isActive }) => isActive ? 'active' : ''}>
            {/* <span className="nav-icon">{icons.dues}</span> */}
            Aidatlar
          </NavLink>
        </li>
        <li>
          <NavLink to="/maintenance" className={({ isActive }) => isActive ? 'active' : ''}>
            {/* <span className="nav-icon">{icons.maintenance}</span> */}
            Arıza ve Bakım
          </NavLink>
          {user?.role === 'admin' && (
          <NavLink to="/residents" className="nav-link">
            <span>Sakin Yönetimi</span>
          </NavLink>
          )}
        </li>
      </ul>

      {/* Kullanıcı bilgisi */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p>{user?.name}</p>
            <span>{user?.role === 'admin' ? 'Yönetici' : 'Sakin'}</span>
          </div>
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Çıkış Yap"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
}
