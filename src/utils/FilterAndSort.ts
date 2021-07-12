import { EntityMetadata, Equal, In, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Not, Raw } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { isEmpty } from './Base';

export interface IOrder {
    direction: 'ASC' | 'DESC';
    property: string;
}

export interface IFilter {
    operator: string;
    property: string;
    value: any;
}

export const plainToEntity = (entity: EntityMetadata, target: Record<string, any> = {}) => {
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        let value = target[meta.propertyName];
        if (isEmpty(value)) {
            if (meta.referencedColumn) {
                value = Object.prototype.hasOwnProperty.call(
                    target,
                    meta.databaseName,
                ) ? {
                        [meta.referencedColumn.databaseName]: target[meta.databaseName],
                    } : undefined;
            } else {
                value = target[meta.databaseName];
            }
        }
        if (!isEmpty(value)) {
            res[meta.propertyName] = value;
        }
        return res;
    }, {});
}

export const filterEqualsEntity = (entity: EntityMetadata, target: Record<string, any> = {}) => {
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        let value = target[meta.propertyName];
        if (isEmpty(value)) {
            if (meta.referencedColumn) {
                value = Object.prototype.hasOwnProperty.call(
                    target,
                    meta.databaseName,
                ) ? {
                        [meta.referencedColumn.databaseName]: target[meta.databaseName],
                    } : undefined;
            } else {
                value = target[meta.databaseName];
            }
        }
        if (!isEmpty(value)) {
            if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
                value = JSON.parse(value);
            }
            res[meta.propertyName] = Array.isArray(value) ? In(value) : value;
        }
        return res;
    }, {});
}

export const filterEntity = (entity: EntityMetadata, target: IFilter[] = []) => {
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        const filter = target.find((val) => val.property === meta.propertyName || val.property === meta.databaseName);
        if (filter && filter.operator && !res[meta.propertyName]) {
            switch (filter.operator) {
            case 'gt':
            case '>':
                res[meta.propertyName] = MoreThan(filter.value);
                break;
            case 'ge':
            case '>=':
                res[meta.propertyName] = MoreThanOrEqual(filter.value);
                break;
            case 'lt':
            case '<':
                res[meta.propertyName] = LessThan(filter.value);
                break;
            case 'le':
            case '<=':
                res[meta.propertyName] = LessThanOrEqual(filter.value);
                break;
            case 'eq':
            case '=':
                res[meta.propertyName] = Equal(filter.value);
                break;
            case 'like': 
                res[meta.propertyName] = Raw((alias) => `UPPER(${alias}) like UPPER('%${filter.value.replace("'","''")}%')`);
                break;
            case 'in':
                if (Array.isArray(filter.value)) {
                    res[meta.propertyName] = In(filter.value);
                }
                break;
            case 'not in':
                if (Array.isArray(filter.value)) {
                    res[meta.propertyName] = Not(In(filter.value));
                }
                break;
            default:
                return res;
            }
        }
        return res;
    }, {});
}

export const sortEntity = (entity: EntityMetadata, target: IOrder[] = []) => {
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        const order = target.find((val) => val.property === meta.propertyName || val.property === meta.databaseName);
        if (order && order.direction) {
            res[meta.propertyName] = order.direction.toUpperCase();
        }
        return res;
    }, {});
}
