import {expectError} from 'tsd';
import getPort from '../source/index.js';

expectError(await getPort({port: 1024}));
