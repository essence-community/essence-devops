import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Result } from '../dto/Result';
import { JsonBody } from '../dto/JsonBody';
import { Connection } from 'typeorm';
import { ServerModel } from '../entities/ServerModel';
import { filterEntity, sortEntity, filterEqualsEntity, plainToEntity } from '../utils/FilterAndSort';

@Injectable()
export class ServerService {
    constructor(private connection: Connection) {}
    
    async findAll(json: JsonBody, user = '999999', req: Request): Promise<[ServerModel[], number]> {
        const rep = this.connection.getRepository(ServerModel);
        return rep.findAndCount({
            where: {
                ...filterEqualsEntity(rep.metadata, json.filter),
                ...filterEntity(rep.metadata, json.filter.jl_filter)
            },
            relations: ['dServerTypeModel'],
            order: sortEntity(rep.metadata, json.filter.jl_sort),
            take: parseInt(json.filter.jn_fetch || 2000, 10),
            skip: parseInt(json.filter.jn_offset || 0, 10),
        });
    }
    async add(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(ServerModel);
        const data: ServerModel = plainToEntity(rep.metadata, json.data) as ServerModel;
        data.ck_user = user;
        const result = await this.connection.getRepository(ServerModel).save(data);
        return (new Result()).setId(result['ck_id'],'ck_id');
    }

    async update(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(ServerModel);
        const data: ServerModel = plainToEntity(rep.metadata, json.data) as ServerModel;
        data.ck_user = user;
        await rep.findOneOrFail(data['ck_id']);
        const res = await rep.save(data);
        return (new Result()).setId(res['ck_id'],'ck_id');
    }

    async delete(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        await this.connection.getRepository(ServerModel).delete(json.data['ck_id']);
        return (new Result()).setId(json.data['ck_id'],'ck_id');
    }
}
