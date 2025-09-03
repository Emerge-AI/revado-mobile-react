import { NavLink } from 'react-router-dom';
import { HomeIcon, ArrowUpTrayIcon, ShareIcon } from '@heroicons/react/24/solid';
import { BeakerIcon } from '@heroicons/react/24/outline';

function TabBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pb-safe-bottom z-50">
      <div className="bg-white border-t border-gray-100">
        <nav className="flex justify-around items-center h-14 max-w-[600px] mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-lg transition-colors ${
              isActive 
                ? 'text-primary-600' 
                : 'text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-primary-50' : ''}`}>
                <HomeIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-lg transition-colors ${
              isActive 
                ? 'text-primary-600' 
                : 'text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-primary-50' : ''}`}>
                <ArrowUpTrayIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">Upload</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/medications"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-lg transition-colors ${
              isActive 
                ? 'text-primary-600' 
                : 'text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-primary-50' : ''}`}>
                <BeakerIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">Meds</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/share"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] rounded-lg transition-colors ${
              isActive 
                ? 'text-primary-600' 
                : 'text-gray-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-primary-50' : ''}`}>
                <ShareIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5">Share</span>
            </>
          )}
        </NavLink>
      </nav>
      </div>
    </div>
  );
}

export default TabBar;