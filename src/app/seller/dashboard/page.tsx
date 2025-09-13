'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

interface AvailabilityData {
  busy: Array<{ start: string; end: string }>;
  slots: string[];
}

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [needsReconnection, setNeedsReconnection] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        setNeedsReconnection(false);
        
        const response = await fetch(`/api/seller/availability?sellerEmail=${session?.user?.email}&days=7`);
        
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        } else {
          const errorData = await response.json();
          
          // Check if it's a refresh token issue
          if (response.status === 400 && 
              (errorData.error?.includes('no refresh token') || 
               errorData.error?.includes('Invalid or unreadable refresh token'))) {
            setNeedsReconnection(true);
            setError('Google Calendar connection expired. Please reconnect your calendar.');
          } else {
            setError(errorData.error || 'Failed to fetch availability');
          }
          console.error('API Error:', errorData);
        }
      } catch (err) {
        setError('Network error - check console for details');
        console.error('Network Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchAvailability();
    }
  }, [session]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      setNeedsReconnection(false);
      
      const response = await fetch(`/api/seller/availability?sellerEmail=${session?.user?.email}&days=7`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      } else {
        const errorData = await response.json();
        
        // Check if it's a refresh token issue
        if (response.status === 400 && 
            (errorData.error?.includes('no refresh token') || 
             errorData.error?.includes('Invalid or unreadable refresh token'))) {
          setNeedsReconnection(true);
          setError('Google Calendar connection expired. Please reconnect your calendar.');
        } else {
          setError(errorData.error || 'Failed to fetch availability');
        }
        console.error('API Error:', errorData);
      }
    } catch (err) {
      setError('Network error - check console for details');
      console.error('Network Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnectCalendar = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Force Google to show the consent screen again to get refresh token
      await signIn('google', {
        callbackUrl: '/seller/dashboard',
        prompt: 'consent', // This forces the consent screen
      });
    } catch (err) {
      console.error('Reconnection error:', err);
      setError('Failed to reconnect calendar. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Seller Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user?.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Calendar Availability
            </h2>
            <p className="text-gray-600">
              View your available time slots for the next 7 days
            </p>
          </div>

          {/* Connection Status Card */}
          <div className="mb-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Calendar Integration Status
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      needsReconnection ? 'bg-yellow-500' : (availability ? 'bg-green-500' : 'bg-red-500')
                    }`}>
                      <span className="text-white text-sm">
                        {needsReconnection ? '⚠' : (availability ? '✓' : '✗')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {needsReconnection 
                        ? 'Google Calendar Connection Expired'
                        : availability 
                          ? 'Google Calendar Connected'
                          : 'Google Calendar Not Connected'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {needsReconnection 
                        ? 'Your calendar connection needs to be refreshed'
                        : availability 
                          ? 'Your calendar is synced and availability is being tracked'
                          : 'Connect your Google Calendar to manage availability'
                      }
                    </p>
                  </div>
                </div>
                {needsReconnection && (
                  <button
                    onClick={handleReconnectCalendar}
                    disabled={isConnecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isConnecting ? 'Connecting...' : 'Reconnect Calendar'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className={`border rounded-md p-4 mb-6 ${
              needsReconnection 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={needsReconnection ? 'text-yellow-800' : 'text-red-800'}>
                {error}
              </div>
            </div>
          )}

          {availability && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Slots */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Available Time Slots
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availability.slots.length > 0 ? (
                      availability.slots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                        >
                          <div>
                            <div className="font-medium text-green-900">
                              {formatDate(slot)}
                            </div>
                            <div className="text-sm text-green-700">
                              {formatTime(slot)} - {formatTime(new Date(new Date(slot).getTime() + 30 * 60000).toISOString())}
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No available slots found for the next 7 days
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Busy Times */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Busy Times
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availability.busy.length > 0 ? (
                      availability.busy.map((busy, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
                        >
                          <div>
                            <div className="font-medium text-red-900">
                              {formatDate(busy.start)}
                            </div>
                            <div className="text-sm text-red-700">
                              {formatTime(busy.start)} - {formatTime(busy.end)}
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Busy
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No busy times found for the next 7 days
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Retry Button for non-connection errors */}
          {error && !needsReconnection && !availability && (
            <div className="text-center mt-6">
              <button
                onClick={fetchAvailability}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}