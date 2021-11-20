import {Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

export class Audit {
    @CreateDateColumn({
        name: 'ct_create',
    })
    ['ct_create']: Date;
    @UpdateDateColumn({
        name: 'ct_change',
    })
    ['ct_change']: Date;
    @Column({
        name: 'ck_user',
        nullable: false,
        length: 100,
        default: () => '999999',
    })
    ['ck_user']: string;
}
