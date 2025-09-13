'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Appointment {
  _id: string;
  sellerEmail: string;
  buyerEmail: string;
  slotStart: string;
  slotEnd: string;
  eventIdSeller: string;
  createdAt: string;
  sellerName?: string;
  buyerName?: string;
}

export default function Appointments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserRole();
    }
  }, [session]);

  useEffect(() => {
    if (userRole) {
      fetchAppointments();
    }
  }, [userRole, session]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (err) {
      setError('Error fetching appointments');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAppointmentTitle = (appointment: Appointment) => {
    if (userRole === 'Seller') {
      return `Appointment with ${appointment.buyerName || appointment.buyerEmail}`;
    } else {
      return `Appointment with ${appointment.sellerName || appointment.sellerEmail}`;
    }
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    const now = new Date();
    const appointmentStart = new Date(appointment.slotStart);
    const appointmentEnd = new Date(appointment.slotEnd);

    if (now < appointmentStart) {
      return { status: 'upcoming', color: 'blue' };
    } else if (now >= appointmentStart && now <= appointmentEnd) {
      return { status: 'ongoing', color: 'green' };
    } else {
      return { status: 'completed', color: 'gray' };
    }
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
                My Appointments
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user?.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Appointments
            </h2>
            <p className="text-gray-600">
              {userRole === 'Seller' 
                ? 'View all appointments with buyers' 
                : 'View all your booked appointments with sellers'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => {
                    const statusInfo = getAppointmentStatus(appointment);
                    return (
                      <div
                        key={appointment._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {getAppointmentTitle(appointment)}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Date:</span> {formatDate(appointment.slotStart)}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> 30 minutes
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {formatDate(appointment.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusInfo.color === 'blue'
                                  ? 'bg-blue-100 text-blue-800'
                                  : statusInfo.color === 'green'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {statusInfo.status.charAt(0).toUpperCase() + statusInfo.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {statusInfo.status === 'upcoming' && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <span className="text-blue-400">📅</span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-blue-800">
                                  This appointment is scheduled for the future. You&apos;ll receive a calendar invite.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {statusInfo.status === 'ongoing' && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <span className="text-green-400">🔴</span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-green-800">
                                  This appointment is currently ongoing.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No appointments found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {userRole === 'Seller' 
                      ? 'You don&apos;t have any appointments yet. Share your calendar to start accepting bookings.'
                      : 'You haven&apos;t booked any appointments yet. Browse available sellers to get started.'
                    }
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {userRole === 'Seller' ? 'Go to Dashboard' : 'Book Appointment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
