import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Result } from '../../dto/Result';
import { JsonBody } from '../../dto/JsonBody';
import { Connection } from 'typeorm';
import { ParameterModel } from '../../entities/project/ParameterModel';
import { filterEntity, sortEntity, filterEqualsEntity, plainToEntity } from '../../utils/FilterAndSort';

@Injectable()
export class ParameterService {
    constructor(private connection: Connection) {}
    
    async findAll(json: JsonBody, user = '999999', req: Request): Promise<[ParameterModel[], number]> {
        const rep = this.connection.getRepository(ParameterModel);
        const filter = json.filter;
        filter['ck_project'] = json.master['ck_id'];

        return rep.findAndCount({
            where: {
                ...filterEqualsEntity(rep.metadata, filter),
                ...filterEntity(rep.metadata, json.filter.jl_filter)
            },
            relations: ['project', 'server', 'server.dServerTypeModel'],
            order: sortEntity(rep.metadata, json.filter.jl_sort),
            take: parseInt(json.filter.jn_fetch || 2000, 10),
            skip: parseInt(json.filter.jn_offset || 0, 10),
        });
    }

    async add(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(ParameterModel);
        json.data['ck_project'] = json.master['ck_id'];
        const data: ParameterModel = plainToEntity(rep.metadata, json.data) as ParameterModel;
        data.ck_user = user;
        const result = await rep.save(data);
        return {
            ['ck_id']: result['ck_id']
        }
    }

    async update(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(ParameterModel);
        json.data['ck_project'] = json.master['ck_id'];
        const data: ParameterModel = plainToEntity(rep.metadata, json.data) as ParameterModel;
        data.ck_user = user;
        await rep.findOneOrFail(data['ck_id']);
        const res = await rep.save(data);
        return {
            ['ck_id']: res['ck_id'],
        }
    }

    async delete(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        await this.connection.getRepository(ParameterModel).delete(json.data['ck_id']);
        return {
            ['ck_id']: json.data['ck_id'],
        }
    }
}
