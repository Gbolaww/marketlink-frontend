import type { DeliveryDetails } from '@/lib/api'

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const KEY = 'ml_delivery'

/** The last delivery details used on this device, so repeat customers don't retype them. */
export function loadDelivery(): Partial<DeliveryDetails> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveDelivery(d: DeliveryDetails) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage unavailable: nothing to remember */
  }
}
