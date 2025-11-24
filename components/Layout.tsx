import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  allowedRoles: ('all' | UserRole)[]; // Who can see this
  icon: (active: boolean) => ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, hasRole } = useUser();

  // If on login page, simple layout
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const navItems: NavItem[] = [
    {
      path: '/',
      label: '爆品库', // Renamed from Workbench to be clearer
      allowedRoles: ['member', 'admin', 'product_selector', 'promoter'],
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    // Workbench (Admin/Selector/Ambassador)
    {
      path: '/admin',
      label: '工作台',
      allowedRoles: ['admin', 'product_selector', 'promo_ambassador'],
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )
    },
    // USERS (Promoter): Promotion Materials (推广素材)
    {
      path: '/master-poster',
      label: '推广素材',
      allowedRoles: ['promoter'],
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    // ALL: Settings
    {
      path: '/settings',
      label: '设定',
      allowedRoles: ['all'],
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <header className="bg-xianyu-yellow text-xianyu-black h-14 flex items-center justify-between px-4 font-bold text-lg shadow-sm fixed top-0 w-full z-10">
        <span>闲鱼爆品推广助手</span>
        {isAuthenticated && (
          <button onClick={() => { logout(); navigate('/login'); }} className="text-xs font-normal bg-black text-white px-2 py-1 rounded">
            退出
          </button>
        )}
      </header>

      <main className="pt-16 px-4 max-w-md mx-auto min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation */}
      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe flex justify-around items-center h-16 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {navItems.filter(item => {
            if (item.allowedRoles.includes('all')) return true;
            return item.allowedRoles.some(role => hasRole(role as UserRole));
          }).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-xianyu-black font-bold' : 'text-gray-400'}`}
              >
                {item.icon(isActive)}
                <span className="text-[10px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  );
};

export default Layout;