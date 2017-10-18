import AmdModulesInAmd from '../plugin/amd-to-magento-amd';

export default function() {
  return {
    plugins: ['transform-es2015-modules-amd', AmdModulesInAmd]
  };
}
