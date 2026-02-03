'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode
} from 'react'

/**
 * Voice Agent Tier
 * - basic: Receptionist mode - collects information, no automatic appointment creation
 * - advanced: Full automation - creates appointments automatically
 */
export type VoiceAgentTier = 'basic' | 'advanced'

/**
 * Subscription Plan Features
 * Determines which features are available based on the clinic's subscription
 */
export interface SubscriptionFeatures {
  voiceAgentTier: VoiceAgentTier
  // Future features can be added here
  // maxProfessionals: number
  // maxPatients: number
  // hasAdvancedReporting: boolean
  // etc.
}

interface SubscriptionContextValue {
  /** Current voice agent tier (basic/advanced) */
  voiceAgentTier: VoiceAgentTier
  /** Whether the voice agent can create appointments automatically */
  canAutoCreateAppointments: boolean
  /** Full subscription features object */
  features: SubscriptionFeatures
  /** Toggle voice agent tier (for development/testing) */
  setVoiceAgentTier: (tier: VoiceAgentTier) => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

/**
 * Default subscription features
 * TODO: This should come from the backend based on the clinic's subscription plan
 */
const DEFAULT_FEATURES: SubscriptionFeatures = {
  // Default to 'advanced' for now - change to 'basic' to test basic mode
  voiceAgentTier: 'advanced'
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // TODO: Fetch actual subscription from backend
  // For now, using local state with default features
  const [features, setFeatures] =
    useState<SubscriptionFeatures>(DEFAULT_FEATURES)

  const setVoiceAgentTier = useCallback((tier: VoiceAgentTier) => {
    setFeatures((prev) => ({ ...prev, voiceAgentTier: tier }))
  }, [])

  const value: SubscriptionContextValue = {
    voiceAgentTier: features.voiceAgentTier,
    canAutoCreateAppointments: features.voiceAgentTier === 'advanced',
    features,
    setVoiceAgentTier
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

/**
 * Hook to access subscription features
 * @throws Error if used outside of SubscriptionProvider
 */
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    )
  }
  return context
}

/**
 * Hook to get voice agent tier directly
 * Convenience wrapper around useSubscription
 */
export function useVoiceAgentTier(): VoiceAgentTier {
  return useSubscription().voiceAgentTier
}

/**
 * Hook to check if voice agent can auto-create appointments
 * Convenience wrapper around useSubscription
 */
export function useCanAutoCreateAppointments(): boolean {
  return useSubscription().canAutoCreateAppointments
}
