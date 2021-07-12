import { ApiProperty } from '@nestjs/swagger';

export class Result {
    [key: string]: any;
    @ApiProperty({
        required: false,
    })
    cv_error?: Record<string, string[]>;
    @ApiProperty({
        required: false,
    })
    jt_form_message?: Record<string, Record<string, string[]>>;
    @ApiProperty({
        required: false,
    })
    jt_return_form_data?: Record<string, any>;
    @ApiProperty({
        required: false,
    })
    jt_return_form_break?: Record<string, any>;
}