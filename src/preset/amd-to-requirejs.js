import emultateEs6ModulesInAmd from '../plugin/amd-to-magento-amd';

export default function() {
    return {
        presets: ["stage-0"],
        plugins: [
            'transform-es2015-modules-amd',
            emultateEs6ModulesInAmd
        ]
    };
};
