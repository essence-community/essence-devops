import Logger from './Logger';
import { Logger as ILogger, QueryRunner } from 'typeorm';
import { IRufusLogger } from 'rufus';

export class TypeOrmLogger implements ILogger {
    public logger: IRufusLogger;
    constructor(name: string) {
        this.logger = Logger.getLogger(`${name}:TypeOrm`);
    }
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.logger.isTraceEnabled()) {
            this.logger.trace('Query:\n%s\nParameters: %j', query, parameters);
        } else {
            this.logger.debug('Query:\n%s', query);
        }
    }
    logQueryError(
        error: string | Error,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        if (this.logger.isTraceEnabled()) {
            this.logger.error(
                'Error: %s\nQuery:\n%s\nParameters: %j',
                typeof error === 'object' ? error.message : error,
                query,
                parameters,
                error,
            );
        } else {
            this.logger.error(
                'Error: %s\nQuery:\n%s',
                typeof error === 'object' ? error.message : error,
                query,
                error,
            );
        }
    }
    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        if (this.logger.isTraceEnabled()) {
            this.logger.warning(
                'Execute time: %s\nQuery:\n%s\nParameters: %j',
                time,
                query,
                parameters,
            );
        } else {
            this.logger.warning('Execute time: %s\nQuery:\n%s', time, query);
        }
    }
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        this.logger.debug(message);
    }
    logMigration(message: string, queryRunner?: QueryRunner) {
        this.logger.debug(message);
    }
    log(
        level: 'log' | 'info' | 'warn',
        message: any,
        queryRunner?: QueryRunner,
    ) {
        this.logger[level](message);
    }
}
