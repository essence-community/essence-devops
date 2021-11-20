import {MigrationInterface, QueryRunner} from 'typeorm';
import {DServerTypeModel} from '../entities/dictionary/DServerTypeModel';

export class initDServerType1623771413665 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.connection.getRepository(DServerTypeModel).save({
            ck_id: 'docker-build-registry',
            cv_description: 'Собирает docker и пушит в репозиторий',
            cl_application: false,
        });
        queryRunner.connection.getRepository(DServerTypeModel).save({
            ck_id: 'podman-build-registry',
            cv_description: 'Собирает podman и пушит в репозиторий',
            cl_application: false,
        });
        queryRunner.connection.getRepository(DServerTypeModel).save({
            ck_id: 'app-podman',
            cv_description: 'Сервер с podman',
            cl_application: true,
        });
        queryRunner.connection.getRepository(DServerTypeModel).save({
            ck_id: 'app-docker',
            cv_description: 'Сервер с docker',
            cl_application: true,
        });
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.connection.getRepository(DServerTypeModel).delete('docker-build-registry');
        queryRunner.connection.getRepository(DServerTypeModel).delete('podman-build-registry');
        queryRunner.connection.getRepository(DServerTypeModel).delete('app-podman');
        queryRunner.connection.getRepository(DServerTypeModel).delete('app-docker');
    }
}
