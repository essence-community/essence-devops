import {TypeOrmModule} from '@nestjs/typeorm';
import * as path from 'path';
import {TypeOrmLogger} from '../TypeOrmLogger';

export const DataBase = TypeOrmModule.forRoot({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
        path.join(__dirname, '..', 'entities', '*{.ts,.js}'),
        path.join(__dirname, '..', 'entities', '**', '*{.ts,.js}'),
    ],
    migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
    migrationsRun: process.env.DB_MIGRATIONSRUN === 'true',
    logging: process.env.DB_LOGGING ? process.env.DB_LOGGING === 'true' : true,
    logger: new TypeOrmLogger('DB'),
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    extra: process.env.DB_EXTRA ? JSON.parse(process.env.DB_EXTRA) : undefined,
});
