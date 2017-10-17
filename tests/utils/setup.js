import globalFunctions from './global-functions';
import customMatcher from './custom-matcher';


expect.extend(customMatcher);

Object.assign(global, globalFunctions(global));
