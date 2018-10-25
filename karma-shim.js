import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

Error.stackTraceLimit = Infinity;

// jquery has to be first or many a test will break
global.$ = global.jQuery = require('jquery');

// angular 1 test harnesss
const angular = require('angular');
require('angular-mocks');

// polyfills
require('core-js/client/shim');

require('rxjs');

require('./settings.js');

require('ngimport');
beforeEach(angular.mock.module('bcherny/ngimport'));

const reportCoverage = __karma__.config.args.includes('--coverage');

const testContext = reportCoverage
  ? require.context('./src/', true, /\.(js|ts|tsx)$/)
  : require.context('./src/', true, /\.spec\.(js|ts|tsx)$/);

testContext.keys().forEach(testContext);
