module.exports = function(magentoClasses) {
  return {
    plugins: [
      [require('../plugin/es6-class-to-magento-class'), {magentoClasses}]
    ]
  };
};
