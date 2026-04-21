'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface CachedUser {
  userName: string;
  userEmail: string;
}

export default function ProfileCard() {
  const [userName, setUserName] = useState('Guest');
  const [userEmail, setUserEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const router = useRouter();

  const loadUserFromCache = () => {
    const cached = localStorage.getItem('profileCardUser');
    if (cached) {
      const data: CachedUser = JSON.parse(cached);
      setUserName(data.userName);
      setUserEmail(data.userEmail);
      return true;
    }
    return false;
  };

  const fetchAndCacheUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase
      .from('users')
      .select('fname, lname')
      .eq('id', authUser.id)
      .single();

    const fullName = profile ? `${profile.fname} ${profile.lname}` : 'Guest';
    const email = authUser.email ?? '';

    setUserName(fullName);
    setUserEmail(email);

    localStorage.setItem('profileCardUser', JSON.stringify({ userName: fullName, userEmail: email }));
  };

  useEffect(() => {
    if (!loadUserFromCache()) fetchAndCacheUser();
  }, []);

  // Expose a refresh for when profile changes
  useEffect(() => {
    (window as any).refreshProfileCard = fetchAndCacheUser;
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('profileCardUser');
    router.push('/');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderAvatar = (sizeClass: string, textSizeClass?: string) => (
    <div className={`${sizeClass} bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold ${textSizeClass || ''}`}>
      {getInitials(userName)}
    </div>
  );

  if (isMinimized) {
    return (
      <button onClick={() => setIsMinimized(false)} title={userName}>
        {renderAvatar('w-10 h-10', 'text-sm')}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-pink-50 transition"
      >
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{userName}</p>
          <p className="text-xs text-gray-600">Admin</p>
        </div>
        {renderAvatar('w-10 h-10', 'text-sm')}
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-2xl shadow-pink-200/50 border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Account</h3>
              <button
                onClick={() => { setIsMinimized(true); setIsOpen(false); }}
                className="text-gray-400 hover:text-pink-600 transition"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3">
              {renderAvatar('w-12 h-12', 'text-lg')}
              <div>
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-green-600">Verified</span>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={() => { router.push('/profile'); setIsOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-pink-50 transition flex items-center gap-3"
              >
                My Profile
              </button>

              <hr className="my-2" />

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-pink-50 transition flex items-center gap-3 font-medium"
              >
                Logout
              </button>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Signed in as {userEmail}
            </div>
          </div>

          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
}