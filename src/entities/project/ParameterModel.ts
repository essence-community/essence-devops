import {Expose, Transform} from 'class-transformer';
import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Audit} from '../../dao/Audit';
import {ProjectModel} from '../ProjectModel';
import {ServerModel} from '../ServerModel';
import {Setting} from '../../dto/Setting';

@Entity('t_project_parameter')
export class ParameterModel extends Audit {
    @PrimaryGeneratedColumn('uuid', {
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'cv_name',
        nullable: false,
    })
    ['cv_name']: string;

    @ManyToOne((type) => ProjectModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_project',
    })
    @Expose({
        name: 'ck_project',
    })
    @Transform(({value}) => value && value.ck_id, {toPlainOnly: true})
    project: ProjectModel;

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

    @ManyToOne((type) => ServerModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_server',
    })
    @Expose({
        name: 'ck_server',
    })
    @Transform(({value}) => value?.ck_id, {toPlainOnly: true})
    server: ServerModel;

    @Transform(({obj}) => obj.server?.cv_description, {toPlainOnly: true})
    cv_server?: string = '';
    @Transform(({obj}) => obj.server?.cl_application, {toPlainOnly: true})
    cl_application?: boolean = false;
    @Transform(({obj}) => obj.server?.dServerTypeModel?.ck_id, {toPlainOnly: true})
    ck_d_server_type?: string = '';
}
