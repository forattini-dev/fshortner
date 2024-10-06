export function deepMerge(target, source) {
  Object.keys(source).forEach(key => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue && typeof sourceValue === 'object') {
      if (!targetValue || typeof targetValue !== 'object') {
        target[key] = Array.isArray(sourceValue) ? [] : {};
      }
      deepMerge(target[key], sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });
  return target;
};