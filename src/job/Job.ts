import {getConnection, createConnection} from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {HistoryPipelineModel} from '../entities/project/HistoryPipelineModel';
import Logger from '../Logger';
import {ParameterModel} from '../entities/project/ParameterModel';
import {IJobData} from './Job.types';
import {noop, deleteFolderRecursive} from '../utils/Base';
import {builders} from './ansible/builder';
import {exec} from 'child_process';

const log = Logger.getLogger('Job');
export class Job {
    timer?: NodeJS.Timeout;

    constructor() {
        createConnection({
            name: 'job_ansible',
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
            logging: process.env.DB_LOGGING === 'true',
        }).then(noop, (err) => log.error(err));
    }

    start() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
            this.execute().then(noop, (err) => {
                log.error(err);
            });
        }, parseInt(process.env.SERVICE_JOB_INTERVAL || '30', 10) * 1000);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async execute() {
        const conn = getConnection('job_ansible');
        const queryRunner = conn.createQueryRunner();
        await queryRunner.startTransaction();
        const rep = queryRunner.manager.getRepository(HistoryPipelineModel);
        const res = (await queryRunner.manager
            .createQueryBuilder()
            .select('history')
            .from(HistoryPipelineModel, 'history')
            .innerJoinAndSelect('history.status', 'status')
            .innerJoinAndSelect('history.pipeline', 'pipeline')
            .innerJoinAndMapOne(
                'history.parameter',
                ParameterModel,
                'parameter',
                'parameter.ck_id = pipeline.parameter.ck_id',
            )
            .innerJoinAndSelect('parameter.server', 'server')
            .innerJoinAndSelect('server.dServerTypeModel', 'serverType')
            .where({
                status: {
                    ck_id: 'new',
                },
            })
            .limit(10)
            .setLock('pessimistic_partial_write')
            .getMany()) as IJobData[];
        try {
            await Promise.all(
                res.map((val) =>
                    rep.save({
                        ...val,
                        status: {
                            ck_id: 'processing',
                        },
                    }),
                ),
            );
            await queryRunner.commitTransaction();
        } catch (e) {
            log.error(e);
            await queryRunner.rollbackTransaction();
        }

        try {
            await Promise.all(
                res.map(
                    (val) =>
                        new Promise(async (resolve, reject) => {
                            const ansible_path = path.join(os.tmpdir(), `ansible_${val.ck_id}`);
                            try {
                                fs.mkdirSync(ansible_path, {
                                    recursive: true,
                                });
                                const parameter = {} as Record<string, string>;
                                const env = {} as Record<string, string>;
                                val.parameter.server.cct_setting.forEach(({key, value}) => {
                                    parameter[key] = value;
                                });
                                val.parameter.cct_setting.forEach(({key, value}) => {
                                    parameter[key] = value;
                                });
                                val.pipeline.cct_setting.forEach(({key, value}) => {
                                    parameter[key] = value;
                                });
                                val.parameter.server.cct_env.forEach(({key, value}) => {
                                    env[key] = value;
                                });
                                val.parameter.cct_env.forEach(({key, value}) => {
                                    env[key] = value;
                                });
                                val.pipeline.cct_env.forEach(({key, value}) => {
                                    env[key] = value;
                                });
                                let hosts = '[app-hosts]\n';
                                hosts += 'app1';
                                if (parameter.ansible_ssh_host) {
                                    hosts += ` ansible_ssh_host=${parameter.ansible_ssh_host}`;
                                }
                                if (parameter.ansible_user) {
                                    hosts += ` ansible_user=${parameter.ansible_user}`;
                                }
                                if (parameter.ansible_port) {
                                    hosts += ` ansible_port=${parameter.ansible_port}`;
                                }
                                if (parameter.ansible_host) {
                                    hosts += ` ansible_host=${parameter.ansible_host}`;
                                }
                                if (parameter.ansible_ssh_pass) {
                                    hosts += ` ansible_ssh_pass=${parameter.ansible_ssh_pass}`;
                                }
                                if (parameter.ansible_ssh_private_key_file) {
                                    if (parameter.ansible_ssh_private_key_file.startsWith('/')) {
                                        hosts += ` ansible_ssh_private_key_file=${parameter.ansible_ssh_private_key_file}`;
                                    } else {
                                        fs.writeFileSync(
                                            path.resolve(ansible_path, 'id_key'),
                                            parameter.ansible_ssh_private_key_file,
                                        );
                                        fs.chmodSync(path.resolve(ansible_path, 'id_key'), '600');
                                        hosts += ` ansible_ssh_private_key_file=${path.resolve(
                                            ansible_path,
                                            'id_key',
                                        )}`;
                                    }
                                }
                                fs.writeFileSync(path.join(ansible_path, 'hosts'), hosts);
                                const fn = builders[val.parameter.server.dServerTypeModel.ck_id];
                                if (fn) {
                                    fs.writeFileSync(
                                        path.join(ansible_path, 'deploy.yaml'),
                                        fn(ansible_path, val, parameter, env),
                                    );
                                } else {
                                    throw new Error(
                                        `Not found server type ${val.parameter.server.dServerTypeModel.ck_id}`,
                                    );
                                }
                                const res = await new Promise<boolean>((resolve, reject) => {
                                    exec(
                                        'ansible-playbook -i hosts deploy.yaml -vvvv',
                                        {
                                            cwd: ansible_path,
                                            maxBuffer: 100000000000,
                                            timeout: 7200000,
                                        },
                                        (err, stdout, stderr) => {
                                            if (err || stdout.indexOf('failed=0') === -1) {
                                                return rep
                                                    .save({
                                                        ...val,
                                                        cv_error: `${err?.message}STDERR:\n${stderr}\nSTDOUT:\n${stdout}`,
                                                        ct_finish: new Date(),
                                                        status: {
                                                            ck_id: 'error',
                                                        },
                                                    })
                                                    .then(
                                                        () => resolve(false),
                                                        (err) => {
                                                            log.error(
                                                                'ANSIBLE STDOUT:\n%s\nSTDERR:\n%s',
                                                                stdout,
                                                                stderr,
                                                                err,
                                                            );
                                                            return reject(err);
                                                        },
                                                    );
                                            }
                                            log.debug('ANSIBLE STDOUT:\n%s\nSTDERR:\n%s', stdout, stderr);
                                            return resolve(true);
                                        },
                                    );
                                });
                                if (res) {
                                    await rep.save({
                                        ...val,
                                        cv_error: '',
                                        ct_finish: new Date(),
                                        status: {
                                            ck_id: 'success',
                                        },
                                    });
                                }
                                deleteFolderRecursive(ansible_path);
                            } catch (e) {
                                log.error('Error pipeline id: %s, name: %s', val.ck_id, val.pipeline.cv_name, e);
                                await rep.save({
                                    ...val,
                                    cv_error: `${e.message}\n${e.stack}`,
                                    ct_finish: new Date(),
                                    status: {
                                        ck_id: 'fault',
                                    },
                                });
                                deleteFolderRecursive(ansible_path);
                                reject(e);
                            }
                        }),
                ),
            );
        } catch (e) {
            log.error(e);
        } finally {
            await queryRunner.release();
        }
    }
}
