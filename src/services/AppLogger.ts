
import { LoggerService } from '@nestjs/common';
import Logger from '../Logger';

const appLogger = Logger.getLogger('AppLogger');

export class AppLogger implements LoggerService {
    log(message: string) {
        appLogger.info(message);
    }
    error(message: string, trace: string) {
        appLogger.error(message, trace);
    }
    warn(message: string) {
        appLogger.warning(message);
    }
    debug(message: string) {
        appLogger.debug(message);
    }
    verbose(message: string) {
        appLogger.verbose(message);
    }
}
