'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Setup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'Seller' | 'Buyer'>('Buyer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'Seller' || roleParam === 'Buyer') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const saveRole = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please sign in first</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h2>
          <p className="text-gray-600 mb-6">
            Are you a seller or buyer?
          </p>
          
          <div className="space-y-4 mb-6">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="role"
                value="Seller"
                checked={role === 'Seller'}
                onChange={(e) => setRole(e.target.value as 'Seller')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Seller</div>
                <div className="text-sm text-gray-500">
                  Connect your Google Calendar to accept appointments
                </div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="role"
                value="Buyer"
                checked={role === 'Buyer'}
                onChange={(e) => setRole(e.target.value as 'Buyer')}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Buyer</div>
                <div className="text-sm text-gray-500">
                  Book appointments with available sellers
                </div>
              </div>
            </label>
          </div>
          
          <button
            onClick={saveRole}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
