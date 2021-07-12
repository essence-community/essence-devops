
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import axios from 'axios';
import { isEmpty } from '../utils/Base';
import Logger from '../Logger';

const log = Logger.getLogger('EssenceCoreAuth');

const isFail = process.env.ESSENCE_CORE_AUTH_REQUIRED === 'true' ? false : true;
@Injectable()
export class EssenceCoreAuth implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const session = request.query?.session || request.params?.session || request.body?.session;

        return axios({
            url: `${process.env.ESSENCE_CORE_URL}?query=getsessiondata&session=${encodeURIComponent(session)}`,
            method: 'GET',
            headers: {
                cookie: request.headers.cookie,
            },
        }).then((res) => {
            if (!res.data || isEmpty(res.data.data)) {
                log.warn(res.data);
                return isFail;
            }
            request.user = res.data.data[0];
            return true;
        }, (err) => {
            log.error(err);
            return isFail;
        });
    }
}