import emultateEs6ModulesInAmd from '../plugin/amd-to-magento-amd';

export default function() {
  return {
    plugins: ['transform-es2015-modules-amd', emultateEs6ModulesInAmd]
  };
}
