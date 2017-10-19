module.exports = function(context, opts) {
  const magentoClasses = (opts && opts.magentoClasses) || [];
  return {
    plugins: [[__dirname + '/../plugin/es6-class-to-magento-class', { magentoClasses }]]
  };
};
