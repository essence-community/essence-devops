import {MigrationInterface, QueryRunner} from 'typeorm';
import { DStatusModel } from '../entities/dictionary/DStatusModel';

export class initDStatus1623771413662 implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.connection.getRepository(DStatusModel).save({
            ck_id: 'new',
            cv_description: 'Запланированный',
        });
        queryRunner.connection.getRepository(DStatusModel).save({
            ck_id: 'processing',
            cv_description: 'В работе',
        });
        queryRunner.connection.getRepository(DStatusModel).save({
            ck_id: 'success',
            cv_description: 'Выполнен',
        });
        queryRunner.connection.getRepository(DStatusModel).save({
            ck_id: 'fault',
            cv_description: 'Ошибка запуска',
        });
        queryRunner.connection.getRepository(DStatusModel).save({
            ck_id: 'error',
            cv_description: 'Ошибка выполнения',
        });
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.connection.getRepository(DStatusModel).delete('new');
        queryRunner.connection.getRepository(DStatusModel).delete('processing');
        queryRunner.connection.getRepository(DStatusModel).delete('success');
        queryRunner.connection.getRepository(DStatusModel).delete('fault');
        queryRunner.connection.getRepository(DStatusModel).delete('error');
    }


}