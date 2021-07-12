import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import { Audit } from '../dao/Audit';

@Entity('t_project')
export class ProjectModel extends Audit {
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
        name: 'cv_description',
        nullable: true,
    })
    ['cv_description']?: string;

}
