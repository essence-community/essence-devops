import { Expose, Transform } from 'class-transformer';
import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import { Audit } from '../../dao/Audit';
import { ProjectModel } from '../ProjectModel';
import { ParameterModel } from './ParameterModel';
import { Setting } from '../../dto/Setting';

@Entity('t_pipeline')
export class PipelineModel extends Audit {
    @PrimaryGeneratedColumn('uuid', {
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'cv_name',
        nullable: false,
    })
    ['cv_name']: string;

    @Column({
        name: 'cn_publish_port',
        nullable: true,
    })
    ['cn_publish_port']?: number;

    @Column({
        name: 'cn_local_port',
        nullable: true,
    })
    ['cn_local_port']?: number;

    @Column({
        name: 'cv_path',
        nullable: true,
    })
    ['cv_path']?: string;

    @Column({
        name: 'cv_path_extra',
        nullable: true,
    })
    ['cv_path_extra']?: string;

    @Column({
        name: 'cv_name_image',
        nullable: true,
    })
    ['cv_name_image']?: string;

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

    @ManyToOne(type => ProjectModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_project'
    })
    @Expose({
        name: 'ck_project',
    })
    @Transform(({ value }) => value?.ck_id, { toPlainOnly: true })
    project: ProjectModel;

    @ManyToOne(type => ParameterModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_parameter'
    })
    @Expose({
        name: 'ck_parameter',
    })
    @Transform(({ value }) => value?.ck_id, { toPlainOnly: true })
    parameter: ParameterModel;
}
