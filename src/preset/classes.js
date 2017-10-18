import esClassToMagentoClass from '../plugin/es6-class-to-magento-class';

export default function(magentoClasses) {
  return () => {
    return {
      plugins: [esClassToMagentoClass(magentoClasses)]
    };
  };
}
