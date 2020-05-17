import {expectError} from 'tsd';
import getPort from '..';

expectError(await getPort({port: 1024}));
