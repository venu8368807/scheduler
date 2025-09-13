'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Seller {
  email: string;
  name: string;
  role: string;
}

interface AvailabilityData {
  busy: Array<{ start: string; end: string }>;
  slots: string[];
}

export default function BuyerBooking() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSellers();
    }
  }, [session]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sellers');
      
      if (response.ok) {
        const data = await response.json();
        setSellers(data.sellers);
      } else {
        setError('Failed to fetch sellers');
      }
    } catch (err) {
      setError('Error fetching sellers');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (sellerEmail: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/availability?sellerEmail=${sellerEmail}&days=7`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      } else {
        setError('Failed to fetch availability');
      }
    } catch (err) {
      setError('Error fetching availability');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerSelect = (seller: Seller) => {
    setSelectedSeller(seller);
    setSelectedSlot(null);
    fetchAvailability(seller.email);
  };

  const handleBookAppointment = async () => {
    if (!selectedSeller || !selectedSlot) return;

    try {
      setBookingLoading(true);
      const slotEnd = new Date(new Date(selectedSlot).getTime() + 30 * 60000).toISOString();
      
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerEmail: selectedSeller.email,
          slotStartISO: selectedSlot,
          slotEndISO: slotEnd,
          title: `Appointment with ${selectedSeller.name}`,
        }),
      });

      if (response.ok) {
        alert('Appointment booked successfully!');
        router.push('/appointments');
      } else {
        setError('Failed to book appointment');
      }
    } catch (err) {
      setError('Error booking appointment');
      console.error('Error:', err);
    } finally {
      setBookingLoading(false);
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
                Book Appointment
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
              Choose a Seller
            </h2>
            <p className="text-gray-600">
              Select a seller to view their available time slots
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sellers List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Sellers
                </h3>
                <div className="space-y-3">
                  {sellers.length > 0 ? (
                    sellers.map((seller) => (
                      <button
                        key={seller.email}
                        onClick={() => handleSellerSelect(seller)}
                        className={`w-full text-left p-4 border rounded-lg transition-colors ${
                          selectedSeller?.email === seller.email
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {seller.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {seller.email}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No sellers available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Availability and Booking */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {selectedSeller ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Available Time Slots - {selectedSeller.name}
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                      {availability && availability.slots.length > 0 ? (
                        availability.slots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full text-left p-3 border rounded-md transition-colors ${
                              selectedSlot === slot
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-gray-900">
                              {formatDate(slot)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(slot)} - {formatTime(new Date(new Date(slot).getTime() + 30 * 60000).toISOString())}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No available slots found
                        </div>
                      )}
                    </div>

                    {selectedSlot && (
                      <div className="border-t pt-4">
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Selected Appointment
                          </h4>
                          <div className="text-sm text-gray-600">
                            <div>Seller: {selectedSeller.name}</div>
                            <div>Date: {formatDate(selectedSlot)}</div>
                            <div>Time: {formatTime(selectedSlot)} - {formatTime(new Date(new Date(selectedSlot).getTime() + 30 * 60000).toISOString())}</div>
                          </div>
                        </div>
                        <button
                          onClick={handleBookAppointment}
                          disabled={bookingLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                          {bookingLoading ? 'Booking...' : 'Book Appointment'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a seller to view their availability
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
