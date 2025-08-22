import { FeatureListItem } from '../services/api';

/**
 * Calculate aggregated progress for features with sub-features.
 * Parent features show the average progress of their sub-features.
 * If a feature has no sub-features, returns its own progress.
 */
export const calculateAggregatedProgress = (
  feature: FeatureListItem,
  allFeatures: FeatureListItem[]
): number => {
  // If the feature has no sub-features, return its own progress
  if (feature.sub_features_count === 0) {
    return feature.progress_percentage;
  }

  // Find all direct sub-features of this feature
  const subFeatures = allFeatures.filter(f => f.parent === feature.id);
  
  if (subFeatures.length === 0) {
    return feature.progress_percentage;
  }

  // Calculate recursive progress for each sub-feature
  const subFeatureProgresses = subFeatures.map(subFeature => 
    calculateAggregatedProgress(subFeature, allFeatures)
  );

  // Calculate average progress of sub-features
  const totalProgress = subFeatureProgresses.reduce((sum, progress) => sum + progress, 0);
  const averageProgress = totalProgress / subFeatures.length;

  return Math.round(averageProgress);
};

/**
 * Enhance features list with aggregated progress values.
 * Returns a new array with updated progress_percentage for parent features.
 */
export const enhanceFeaturesWithAggregatedProgress = (
  features: FeatureListItem[]
): FeatureListItem[] => {
  return features.map(feature => ({
    ...feature,
    progress_percentage: calculateAggregatedProgress(feature, features)
  }));
};