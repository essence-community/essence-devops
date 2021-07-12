import { ProjectService } from '../services/ProjectService';
import { Controller, Req, Post, Body, HttpCode } from '@nestjs/common';
import { ApiOkResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import { Result } from '../dto/Result';
import { JsonBody } from '../dto/JsonBody';
import Logger from '../Logger';
import { classToPlain, plainToClass } from 'class-transformer';
import { LogService } from '../services/LogService';

const logger = Logger.getLogger('ProjectController');

@Controller('project')
export class ProjectController {
    constructor(private readonly provider: ProjectService, private readonly audit: LogService) {}

    @Post()
    @HttpCode(200)
    @ApiConsumes('application/x-www-form-urlencoded')
    @ApiBody({
        schema: {
            type: 'object',
            additionalProperties: true,
            required: ['json'],
            properties: {
                session: {
                    type: 'string',
                },
                json: {
                    type: 'object',
                    properties: {
                        filter: {
                            type: 'object',
                            additionalProperties: true,
                        },
                        master: {
                            type: 'object',
                            additionalProperties: true,
                        },
                        service: {
                            type: 'object',
                            required: ['cv_action'],
                            properties: {
                                ck_main: {
                                    type: 'string',
                                },
                                cv_action: {
                                    type: 'string',
                                }
                            }
                        },
                        data: {
                            type: 'object',
                            additionalProperties: true,
                        }
                    }
                }
            }
        }
    })
    @ApiOkResponse({
        schema: {
            type: 'object',
            anyOf: [
                {
                    type: 'object',
                    required: ['ck_id'],
                    properties: {
                        ck_id: {
                            type: 'string'
                        },
                        cv_error: {
                            type: 'object',
                            additionalProperties: true,
                        }
                    }
                }, {
                    type: 'array',
                    items: {
                        type: 'object',
                        additionalProperties: true,
                        required: ['jn_total_cnt'],
                        properties: {
                            jn_total_cnt: {
                                type: 'integer'
                            }
                        }
                    },
                }
            ]
        }
    })
    async post(
        @Req() request: Request,
        @Body('json') jsonStr: string): Promise<Result | Record<string, any>[]> {
        let json: JsonBody = {};
        try {
            json = plainToClass(JsonBody, JSON.parse(jsonStr));
        } catch(e) {
            logger.error(e);
            return {
                ['ck_id']: '',
                cv_error: {
                    504: [],
                },
            };
        }
        
        if(json.filter) {
            const [result, jn_total_cnt] = await this.provider.findAll(json, (request as any).user?.ck_id, request);

            return result.map((res) => ({
                ...(classToPlain(res)),
                jn_total_cnt,
            }));
        }

        if(json.service) {
            let res = null;
            try {
                switch(json.service.cv_action) {
                case 'I':
                    res = await this.provider.add(json, (request as any).user?.ck_id, request);
                    break;
                case 'U':
                    res = await this.provider.update(json, (request as any).user?.ck_id, request);
                    break;
                case 'D':
                    res = await this.provider.delete(json, (request as any).user?.ck_id, request);
                    break;
                default:
                    return {
                        ['ck_id']: '',
                        cv_error: {
                            504: [],
                        },
                    };
                }
                this.audit.log({
                    cc_json: jsonStr,
                    cv_session: request.query?.session || request.params?.session || request.body?.session,
                    cv_method: 'project',
                    cv_id: json.data['ck_id'],
                    ck_user: (request as any).user?.ck_id || '999999',
                } as any);
                return res;
            } catch (e) {
                this.audit.log({
                    cc_json: jsonStr,
                    cv_session: request.query?.session || request.params?.session || request.body?.session,
                    cv_method: 'project',
                    cv_error: `${e.message}\n${e.stack}`,
                    cv_id: json.data['ck_id'],
                    ck_user: (request as any).user?.ck_id || '999999',
                } as any);
                throw e;
            }
        }

        return {
            ['ck_id']: '',
            cv_error: {
                504: [],
            },
        };
    }
}