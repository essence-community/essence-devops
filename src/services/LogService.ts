import {Injectable} from '@nestjs/common';
import {Request} from 'express';
import {Result} from '../dto/Result';
import {JsonBody} from '../dto/JsonBody';
import {Connection} from 'typeorm';
import {LogModel} from '../entities/LogModel';
import {filterEntity, sortEntity, filterEqualsEntity, plainToEntity} from '../utils/FilterAndSort';
import Logger from '../Logger';
import {noop} from '../utils/Base';

const logger = Logger.getLogger('LogService');
@Injectable()
export class LogService {
    constructor(private connection: Connection) {}

    async findAll(json: JsonBody, user = '999999', req: Request): Promise<[LogModel[], number]> {
        const rep = this.connection.getRepository(LogModel);
        return rep.findAndCount({
            where: {
                ...filterEqualsEntity(rep.metadata, json.filter),
                ...filterEntity(rep.metadata, json.filter.jl_filter),
            },
            order: sortEntity(rep.metadata, json.filter.jl_sort),
            take: parseInt(json.filter.jn_fetch || 2000, 10),
            skip: parseInt(json.filter.jn_offset || 0, 10),
        });
    }

    log(json: LogModel): void {
        this.connection
            .getRepository(LogModel)
            .save(json)
            .then(noop, (err) => {
                logger.error(err);
            });
    }

    async add(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(LogModel);
        const data: LogModel = plainToEntity(rep.metadata, json.data) as LogModel;
        data.ck_user = user;
        const result = await rep.save(data);
        return new Result().setId(result['ck_id'], 'ck_id');
    }

    async update(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        const rep = this.connection.getRepository(LogModel);
        const data: LogModel = plainToEntity(rep.metadata, json.data) as LogModel;
        data.ck_user = user;
        await rep.findOneOrFail(data['ck_id']);
        const res = await rep.save(data);
        return new Result().setId(res['ck_id'], 'ck_id');
    }

    async delete(json: JsonBody, user = '999999', req: Request): Promise<Result> {
        await this.connection.getRepository(LogModel).delete(json.data['ck_id']);
        return new Result().setId(json.data['ck_id'], 'ck_id');
    }
}
