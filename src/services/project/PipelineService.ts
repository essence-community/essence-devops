import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Result } from '../../dto/Result';
import { JsonBody } from '../../dto/JsonBody';
import { Connection } from 'typeorm';
import { PipelineModel } from '../../entities/project/PipelineModel';
import { filterEntity, sortEntity, filterEqualsEntity, plainToEntity } from '../../utils/FilterAndSort';
import { ParameterModel } from '../../entities/project/ParameterModel';
import { DServerTypeModel } from '../../entities/dictionary/DServerTypeModel';
import { ServerModel } from '../../entities/ServerModel';
import { isEmpty } from '../../utils/Base';
import { HistoryPipelineModel } from '../../entities/project/HistoryPipelineModel';

@Injectable()
export class PipelineService {
    constructor(private connection: Connection) {}
    
    async findAll(json: JsonBody, user = '999999', req: Request): Promise<[PipelineModel[], number]> {
        const rep = this.connection.getRepository(PipelineModel);
        const filter = json.filter;
        filter['ck_project'] = json.master['ck_id'];
        const [rows, count] = await rep.findAndCount({
            where: {
                ...filterEqualsEntity(rep.metadata, filter),
                ...filterEntity(rep.metadata, json.filter.jl_filter)
            },
            relations: ['project', 'parameter'],
            order: sortEntity(rep.metadata, json.filter.jl_sort),
            take: parseInt(json.filter.jn_fetch || 2000, 10),
            skip: parseInt(json.filter.jn_offset || 0, 10),
        });
        await Promise.all(rows.map(async(val) => {
            (val as any).history = await this.connection.createQueryBuilder()
                .select('history')
                .from(HistoryPipelineModel, 'history')
                .innerJoinAndSelect('history.status', 'status')
                .where({
                    pipeline: {
                        ck_id: val.ck_id,
                    }
                })
                .addOrderBy('history.ct_create', 'DESC')
                .limit(1)
                .getOne();
            (val as any).last_success = await this.connection.createQueryBuilder()
                .select('history.ct_finish')
                .from(HistoryPipelineModel, 'history')
                .innerJoinAndSelect('history.status', 'status')
                .where({
                    pipeline: {
                        ck_id: val.ck_id,
                    },
                    status: {
                        ck_id: 'success'
                    }
                })
                .addOrderBy('history.ct_create', 'DESC')
                .limit(1)
                .getOne();
            return;
        }))
        return [rows, count]
    }
    async add(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(PipelineModel);
        json.data['ck_project'] = json.master['ck_id'];
        const data: PipelineModel = plainToEntity(rep.metadata, json.data) as PipelineModel;
        data.ck_user = user;
        if (data.parameter) {
            const parameter: ParameterModel & {
                serverType: DServerTypeModel,
            }  = await this.connection.getRepository(ParameterModel)
                .createQueryBuilder()
                .select('param')
                .from(ParameterModel, 'param')
                .innerJoinAndMapOne('param.server', ServerModel, 'server', 'server.ck_id = param.ck_server')
                .innerJoinAndMapOne('param.serverType', DServerTypeModel, 'serverType', 'server.ck_d_server_type = serverType.ck_id')
                .where({
                    ck_id: data.parameter.ck_id,
                })
                .getOneOrFail() as any;
            if (parameter.serverType.cl_application) {
                const res = new Result();
                if (isEmpty(data.cn_local_port)) {
                    res.setErrorField('cn_local_port', 200, 'Локальный порт образа');
                }
                if (isEmpty(data.cn_publish_port)) {
                    res.setErrorField('cn_publish_port', 200, 'Публичный порт');
                }
                if (res.isError) {
                    return res.setId('', 'ck_id')
                }
            }
        }
        const result = await rep.save(data);
        return (new Result()).setId(result['ck_id'],'ck_id');
    }

    async update(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(PipelineModel);
        json.data['ck_project'] = json.master['ck_id'];
        const data: PipelineModel = plainToEntity(rep.metadata, json.data) as PipelineModel;
        data.ck_user = user;
        await rep.findOneOrFail(data['ck_id']);
        if (data.parameter) {
            const parameter: ParameterModel & {
                serverType: DServerTypeModel,
            }  = await this.connection.getRepository(ParameterModel)
                .createQueryBuilder()
                .select('param')
                .from(ParameterModel, 'param')
                .innerJoinAndMapOne('param.server', ServerModel, 'server', 'server.ck_id = param.ck_server')
                .innerJoinAndMapOne('param.serverType', DServerTypeModel, 'serverType', 'server.ck_d_server_type = serverType.ck_id')
                .where({
                    ck_id: data.parameter.ck_id,
                })
                .getOneOrFail() as any;
            if (parameter.serverType.cl_application) {
                const jt_form_message = {};
                const res = new Result();
                if (isEmpty(data.cn_local_port)) {
                    res.setErrorField('cn_local_port', 200, 'Локальный порт образа');
                }
                if (isEmpty(data.cn_publish_port)) {
                    res.setErrorField('cn_publish_port', 200, 'Публичный порт');
                }
                if (res.isError) {
                    return res.setId('', 'ck_id')
                }
            }
        }
        const res = await rep.save(data);
        return (new Result()).setId(res['ck_id'],'ck_id');
    }

    async delete(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        await this.connection.getRepository(PipelineModel).delete(json.data['ck_id']);
        return (new Result()).setId(json.data['ck_id'],'ck_id');
    }

    async runPipeline(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(HistoryPipelineModel);
        if ( await rep.count({
            where: {
                pipeline: { ck_id: json.data['ck_id'] },
                status: { ck_id: 'new' },
            }
        }) ) {
            return (new Result()).setId(json.data['ck_id'], 'ck_id').setError(51, 'Уже есть запущеный процесс');
        }
        await rep.save({
            status: { ck_id: 'new' },
            pipeline: { ck_id: json.data['ck_id'] },
            ck_user: user,
        });
        return (new Result()).setId(json.data['ck_id'],'ck_id');
    }
}
