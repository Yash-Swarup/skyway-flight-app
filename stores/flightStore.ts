import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Flight, Seat, SearchParams, PassengerForm } from '@/types'

type BookingStep = 'search' | 'results' | 'seats' | 'passengers' | 'confirmation'

interface FlightState {
  // Search
  searchQuery: SearchParams | null
  // Selected flight + seat
  selectedFlight: Flight | null
  selectedSeat: Seat | null
  // Booking flow
  currentStep: BookingStep
  passengerForm: PassengerForm
  // Optimistic seat selection (before Supabase confirms)
  optimisticSeatId: string | null

  // Actions
  setSearchQuery: (q: SearchParams) => void
  setSelectedFlight: (f: Flight | null) => void
  setSelectedSeat: (s: Seat | null) => void
  setCurrentStep: (step: BookingStep) => void
  setPassengerForm: (data: Partial<PassengerForm>) => void
  setOptimisticSeatId: (id: string | null) => void
  resetBooking: () => void
  resetAll: () => void
}

const defaultPassengerForm: PassengerForm = {
  full_name: '',
  passport_no: '',
  nationality: '',
  dob: '',
}

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      searchQuery: null,
      selectedFlight: null,
      selectedSeat: null,
      currentStep: 'search',
      passengerForm: defaultPassengerForm,
      optimisticSeatId: null,

      setSearchQuery: (q) => set({ searchQuery: q }),
      setSelectedFlight: (f) => set({ selectedFlight: f }),
      setSelectedSeat: (s) => set({ selectedSeat: s, optimisticSeatId: s?.id ?? null }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setPassengerForm: (data) =>
        set((state) => ({ passengerForm: { ...state.passengerForm, ...data } })),
      setOptimisticSeatId: (id) => set({ optimisticSeatId: id }),

      resetBooking: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          currentStep: 'search',
          passengerForm: defaultPassengerForm,
          optimisticSeatId: null,
        }),

      resetAll: () =>
        set({
          searchQuery: null,
          selectedFlight: null,
          selectedSeat: null,
          currentStep: 'search',
          passengerForm: defaultPassengerForm,
          optimisticSeatId: null,
        }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      // Exclude sensitive fields from localStorage
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        // Intentionally exclude passengerForm (contains passport_no)
        optimisticSeatId: state.optimisticSeatId,
      }),
    }
  )
)
