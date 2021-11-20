import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {Audit} from '../dao/Audit';

@Entity('t_log')
export class LogModel extends Audit {
    @PrimaryGeneratedColumn('uuid', {
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'cv_session',
        nullable: true,
    })
    ['cv_session']?: string;

    @Column({
        name: 'cc_json',
        nullable: false,
    })
    ['cc_json']: string;

    @Column({
        name: 'cv_method',
        nullable: false,
    })
    ['cv_method']: string;

    @Column({
        name: 'cv_id',
        nullable: true,
    })
    ['cv_id']?: string;

    @Column({
        name: 'cv_error',
        nullable: true,
    })
    ['cv_error']?: string;
}
