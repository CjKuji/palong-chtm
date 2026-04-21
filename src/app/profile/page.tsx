'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { Cormorant, Inter } from 'next/font/google';

const cormorant = Cormorant({ subsets: ['latin'], weight: ['300', '400', '600'] });
const inter = Inter({ subsets: ['latin'] });

// Extend window type for ProfileCard refresh
declare global {
  interface Window {
    refreshProfileCard?: () => void;
  }
}

// ✅ User type
export interface User {
  id: string;
  fname: string;
  lname: string;
  role: string;
  email?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formFName, setFormFName] = useState('');
  const [formLName, setFormLName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Email validation
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Fetch user
  const fetchUser = async () => {
    setLoading(true);
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !sessionUser) {
      router.push('/login');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id,fname,lname,role')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (profileError) console.error('Profile fetch error:', profileError);

    const userProfile: User = {
      id: sessionUser.id,
      fname: profileData?.fname || '',
      lname: profileData?.lname || '',
      role: profileData?.role || 'user',
      email: sessionUser.email
    };

    setUser(userProfile);
    setFormFName(userProfile.fname);
    setFormLName(userProfile.lname);
    setFormEmail(userProfile.email || '');
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  const getInitials = () => {
    if (!user) return '';
    return `${user.fname[0] || ''}${user.lname[0] || ''}`.toUpperCase();
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user) return;

    const trimmedFName = formFName.trim();
    const trimmedLName = formLName.trim();
    const trimmedEmail = formEmail.trim();

    if (!trimmedFName || !trimmedLName) return alert('First and Last Name cannot be empty.');
    if (trimmedEmail && !isValidEmail(trimmedEmail)) return alert('Invalid email address.');

    try {
      // Update email if changed
      if (trimmedEmail && trimmedEmail !== user.email) {
        const res = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, newEmail: trimmedEmail }),
        });
        const data = await res.json();
        if (!res.ok) return alert(`Cannot update email: ${data.error}`);
      }

      // Update DB
      const { error: dbError } = await supabase
        .from('users')
        .update({ fname: trimmedFName, lname: trimmedLName })
        .eq('id', user.id);

      if (dbError) return alert(`Cannot update profile: ${dbError.message}`);

      const updatedUser: User = { ...user, fname: trimmedFName, lname: trimmedLName, email: trimmedEmail };
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');

      // Update ProfileCard cache & refresh
      localStorage.setItem('profileCardUser', JSON.stringify({
        userName: `${trimmedFName} ${trimmedLName}`,
        userEmail: trimmedEmail
      }));
      if (window.refreshProfileCard) window.refreshProfileCard();

    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error occurred.');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!user) return <div className="flex justify-center items-center min-h-screen">No user found.</div>;

  return (
    <div className={`flex min-h-screen bg-gray-50 font-sans antialiased ${inter.className}`}>
      <Sidebar activeMenu="profile" />
      <main className="flex-1 ml-64">
        <Topbar />

        <div className="p-6 max-w-2xl mx-auto">
          <h1 className={`text-2xl font-bold text-gray-800 mb-6 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>
            My Profile
          </h1>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 text-white" style={{ background: 'linear-gradient(135deg, #3D5A4C 0%, #2d4339 100%)' }}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center font-bold text-3xl shadow-lg" style={{ color: '#3D5A4C' }}>
                  {getInitials()}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${cormorant.className}`}>{user.fname} {user.lname}</h2>
                  <p className="text-sm opacity-90">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              {!isEditing ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>Full Name</label>
                      <p className="text-lg text-gray-800">{user.fname} {user.lname}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>Email Address</label>
                      <p className="text-lg text-gray-800">{user.email}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>Role</label>
                      <p className="text-lg text-gray-800">{user.role}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: '#3D5A4C' }}>Edit Profile</button>
                    <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Back</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>First Name</label>
                      <input value={formFName} onChange={e => setFormFName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>Last Name</label>
                      <input value={formLName} onChange={e => setFormLName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${cormorant.className}`} style={{ color: '#3D5A4C' }}>Email</label>
                      <input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button onClick={handleSave} className="px-4 py-2 text-white rounded-lg" style={{ backgroundColor: '#3D5A4C' }}>Save Changes</button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormFName(user.fname);
                        setFormLName(user.lname);
                        setFormEmail(user.email || '');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}