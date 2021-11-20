import {Expose, Transform} from 'class-transformer';
import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Audit} from '../../dao/Audit';
import {PipelineModel} from './PipelineModel';
import {DStatusModel} from '../dictionary/DStatusModel';

@Entity('t_history_pipeline')
export class HistoryPipelineModel extends Audit {
    @PrimaryGeneratedColumn('uuid', {
        name: 'ck_id',
    })
    ['ck_id']: string;

    @Column({
        name: 'ct_finish',
        nullable: true,
    })
    ['ct_finish']?: Date;

    @Column({
        name: 'cv_error',
        nullable: true,
    })
    ['cv_error']?: string;

    @ManyToOne((type) => DStatusModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_d_status',
    })
    @Expose({
        name: 'ck_d_status',
    })
    @Transform(({value}) => value?.ck_id, {toPlainOnly: true})
    status: DStatusModel;

    @Transform(({obj}) => obj?.status?.cv_description, {toPlainOnly: true})
    cv_d_status?: string = '';

    @ManyToOne((type) => PipelineModel, {
        nullable: false,
    })
    @JoinColumn({
        name: 'ck_pipeline',
    })
    @Expose({
        name: 'ck_pipeline',
    })
    @Transform(({value}) => value?.ck_id, {toPlainOnly: true})
    pipeline: PipelineModel;
}
