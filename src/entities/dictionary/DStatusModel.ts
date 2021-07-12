import {Column, Entity, PrimaryColumn} from 'typeorm';
import { Audit } from '../../dao/Audit';

@Entity('t_d_status')
export class DStatusModel extends Audit {
    @PrimaryColumn({
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'cv_description',
        nullable: true,
    })
    ['cv_description']?: string;
}
