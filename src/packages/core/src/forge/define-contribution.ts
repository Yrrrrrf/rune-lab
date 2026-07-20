export interface ContributionKey<T> {
  readonly id: string;
  readonly __brand?: T;
}

export interface ContributionEntry<T = unknown> {
  readonly key: ContributionKey<T>;
  readonly items: T[];
}

export function defineContribution<T>(id: string): ContributionKey<T> {
  return { id } as ContributionKey<T>;
}

export function contribute<T>(
  key: ContributionKey<T>,
  ...items: T[]
): ContributionEntry<T> {
  return { key, items };
}

export interface SettingsSectionContribution {
  id: string;
  label: string;
  icon?: string;
  fields?: unknown[];
  component?: unknown;
}

export const settingsSections: ContributionKey<SettingsSectionContribution> =
  defineContribution<SettingsSectionContribution>("settingsSections");
