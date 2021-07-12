import {Column, Entity, PrimaryColumn} from 'typeorm';
import { Audit } from '../../dao/Audit';

@Entity('t_d_server_type')
export class DServerTypeModel extends Audit {
    @PrimaryColumn({
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'cv_description',
        nullable: true,
    })
    ['cv_description']?: string;

    @Column({
        name: 'cl_application',
        nullable: false,
        default: 'false',
    })
    ['cl_application']: boolean;
}
