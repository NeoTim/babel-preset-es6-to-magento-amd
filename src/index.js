import amdToMagentoAmd from './plugin/amd-to-magento-amd';
import esClassToMagentoClass from './plugin/es6-class-to-magento-class';
import esModuleToAmd from 'babel-plugin-transform-es2015-modules-amd';

export default function(context, opts) {
  const magentoClasses = (opts && opts.magentoClasses) || [];
  const otherPresets = (opts && opts.presets) || [];
  return {
    presets: otherPresets,
    plugins: [esModuleToAmd, amdToMagentoAmd, [esClassToMagentoClass, { magentoClasses }]]
  };
}
