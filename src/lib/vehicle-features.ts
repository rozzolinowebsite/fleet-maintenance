export type FeatureValue = 'none' | 'optional' | 'required'
export type TypeFeatures = Partial<Record<FeatureKey, FeatureValue>>

export type FeatureKey = typeof VEHICLE_FEATURES[number]['key']

export const VEHICLE_FEATURES = [
  {
    key: 'acoplado' as const,
    label: 'Acoplado',
    description: 'Permite asociar un acoplado al vehículo',
  },
] as const

export const FEATURE_VALUE_LABELS: Record<FeatureValue, string> = {
  none: 'No disponible',
  optional: 'Opcional',
  required: 'Requerido',
}
