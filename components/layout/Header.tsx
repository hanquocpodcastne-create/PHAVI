
import React, { useContext } from 'react';
import { AuthContext } from '../../App';
import { BellIcon, ChevronDownIcon, LogOutIcon } from '../../constants';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chào mừng trở lại, {user.name}!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Đây là bảng điều khiển của bạn.</p>
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </button>
        <div className="flex items-center space-x-3">
          <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt="User avatar" />
          <div>
             <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{user.name}</p>
             <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
          title="Đăng xuất"
        >
          <LogOutIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
