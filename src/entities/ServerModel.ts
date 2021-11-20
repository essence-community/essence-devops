import {Expose, Transform} from 'class-transformer';
import {Column, Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm';
import {Audit} from '../dao/Audit';
import {Setting} from '../dto/Setting';
import {DServerTypeModel} from './dictionary/DServerTypeModel';

@Entity('t_server')
export class ServerModel extends Audit {
    @PrimaryColumn({
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'cv_description',
        nullable: true,
    })
    ['cv_description']?: string;

    @ManyToOne((type) => DServerTypeModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_d_server_type',
    })
    @Expose({
        name: 'ck_d_server_type',
    })
    @Transform(({value}) => value?.ck_id, {toPlainOnly: true})
    dServerTypeModel: DServerTypeModel;

    @Column({
        name: 'cct_setting',
        type: 'jsonb',
        nullable: false,
        default: () => "'[]'::jsonb",
    })
    cct_setting: Setting[] = [];

    @Column({
        name: 'cct_env',
        type: 'jsonb',
        nullable: false,
        default: () => "'[]'::jsonb",
    })
    cct_env: Setting[] = [];
}
