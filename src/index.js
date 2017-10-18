import transformAmdToRequireJs from './preset/amd-to-requirejs';
import transformClasses from './preset/classes';

export function preset(magentoClasses) {
  return {
    presets: [transformClasses(magentoClasses), transformAmdToRequireJs]
  };
}
