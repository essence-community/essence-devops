import { IsNotEmpty } from 'class-validator';

export class IService {
    ck_main?: string;
    @IsNotEmpty()
    cv_action: 'I' | 'D' | 'U' | string;
    cl_warning: number;
    ck_page_object?: string;
    ck_page?: string;
}

export class JsonBody {
    filter?: Record<string, any>;
    master?: Record<string, any>;
    service?: IService;
    data?: Record<string, any>;
}