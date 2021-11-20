import {ApiProperty} from '@nestjs/swagger';
import {
    Connection,
    EntityMetadata,
    Equal,
    In,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Not,
    Raw,
    QueryRunner,
} from 'typeorm';
import {PostgresDriver} from 'typeorm/driver/postgres/PostgresDriver';
import {OracleDriver} from 'typeorm/driver/oracle/OracleDriver';
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata';
import {isEmpty, deepParam} from './Base';
import {IFilter} from '../../dist/utils/FilterAndSort';
import * as moment from 'moment';
import {JsonBody} from '../dto/JsonBody';

const re = /^[A-z0-9_$]{2,30}$/;
const PATTERN_FILTER = /\/\x2a\s*##\s*([^\s|\x2a]+)/gi;
const FILTER_PREFIX = 'cf_filter_';
const DIRECTIONS = ['DESC', 'ASC'];

export class Order {
    @ApiProperty({
        required: true,
        enum: ['ASC', 'DESC'],
    })
    direction: 'ASC' | 'DESC';
    @ApiProperty({
        required: true,
    })
    property: string;
}

export class Filter {
    @ApiProperty({
        required: true,
        enum: ['gt', '>', 'ge', '>=', 'lt', '<', 'le', '<=', 'eq', '=', 'like', 'in', 'not in'],
    })
    operator: string;
    @ApiProperty({
        required: true,
    })
    property: string;
    @ApiProperty({
        required: false,
    })
    format?: string;
    @ApiProperty({
        required: false,
    })
    datatype?: string;
    @ApiProperty({
        required: true,
        oneOf: [
            {
                type: 'integer',
            },
            {
                type: 'number',
            },
            {
                type: 'string',
            },
            {
                type: 'boolean',
            },
            {
                type: 'array',
                items: {
                    oneOf: [
                        {
                            type: 'integer',
                        },
                        {
                            type: 'number',
                        },
                        {
                            type: 'string',
                        },
                        {
                            type: 'boolean',
                        },
                    ],
                },
            },
        ],
    })
    value: string;
}

export const plainToEntity = (entity: EntityMetadata, target: Record<string, any> = {}) => {
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        let value = target[meta.propertyName];
        if (isEmpty(value)) {
            if (meta.referencedColumn) {
                value = Object.prototype.hasOwnProperty.call(target, meta.databaseName)
                    ? {
                        [meta.referencedColumn.databaseName]: target[meta.databaseName],
                    }
                    : undefined;
            } else {
                value = target[meta.databaseName];
            }
        }
        if (!isEmpty(value)) {
            res[meta.propertyName] = value;
        }
        return res;
    }, {});
};

export const filterEqualsEntity = (entity: EntityMetadata, target: Record<string, any> = {}) => {
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        let value = target[meta.propertyName];
        if (isEmpty(value)) {
            if (meta.referencedColumn) {
                value = Object.prototype.hasOwnProperty.call(target, meta.databaseName)
                    ? {
                        [meta.referencedColumn.databaseName]: target[meta.databaseName],
                    }
                    : undefined;
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
};

export const filterEntity = (
    entity: EntityMetadata,
    target: string | string[] | qs.ParsedQs | qs.ParsedQs[] | Filter[] = [],
) => {
    if (typeof target === 'string' && target.startsWith('{')) {
        target = [JSON.parse(target)];
    }
    if (typeof target === 'string' && target.startsWith('[')) {
        target = JSON.parse(target);
    }
    if (Array.isArray(target)) {
        if (typeof target[0] === 'string') {
            target = target.map((val) => JSON.parse(val));
        }
    } else {
        target = [];
    }
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        const filter = (target as Filter[]).find((val) =>
            val.property
                ? val.property.split('.')[0] === meta.propertyName || val.property === meta.databaseName
                : false,
        );
        if (filter && filter.operator) {
            const filterProperties = filter.property.split('.');
            let last = meta.propertyName;
            let val = res;
            if (filterProperties.length > 1) {
                last = filterProperties.pop();
                val = filterProperties.reduce((result, value) => {
                    result[value] = {};
                    return result[value];
                }, res);
            }
            switch (filter.operator) {
            case 'gt':
            case '>':
                val[last] = MoreThan(filter.value);
                break;
            case 'ge':
            case '>=':
                val[last] = MoreThanOrEqual(filter.value);
                break;
            case 'lt':
            case '<':
                val[last] = LessThan(filter.value);
                break;
            case 'le':
            case '<=':
                val[last] = LessThanOrEqual(filter.value);
                break;
            case 'eq':
            case '=':
                val[last] = Equal(filter.value);
                break;
            case 'like':
                val[last] = Raw((alias) => `UPPER(${alias}) like UPPER('%' || :filter || '%')`, {
                    filter: filter.value,
                });
                break;
            case 'in':
                if (Array.isArray(filter.value)) {
                    val[last] = In(filter.value);
                }
                break;
            case 'not in':
                if (Array.isArray(filter.value)) {
                    val[last] = Not(In(filter.value));
                }
                break;
            default:
                return res;
            }
        }
        return res;
    }, {});
};

export const sortEntity = (
    entity: EntityMetadata,
    target: string | string[] | qs.ParsedQs | qs.ParsedQs[] | Order[] = [],
) => {
    if (typeof target === 'string' && target.startsWith('{')) {
        target = [JSON.parse(target)];
    }
    if (typeof target === 'string' && target.startsWith('[')) {
        target = JSON.parse(target);
    }
    if (Array.isArray(target)) {
        if (typeof target[0] === 'string') {
            target = target.map((val) => JSON.parse(val));
        }
    } else {
        target = [];
    }
    return entity.columns.reduce((res, meta: ColumnMetadata) => {
        const order = (target as Order[]).find((val) =>
            val.property
                ? val.property.split('.')[0] === meta.propertyName || val.property === meta.databaseName
                : false,
        );
        if (order && order.direction) {
            const orderProperties = order.property.split('.');
            if (orderProperties.length > 1) {
                const last = orderProperties.pop();
                orderProperties.reduce((result, value) => {
                    result[value] = {};
                    return result[value];
                }, res)[last] = order.direction.toUpperCase();
            } else {
                res[meta.propertyName] = order.direction.toUpperCase();
            }
        }
        return res;
    }, {});
};

/**
 * Преобразуем параметры фильтра и добавляем в inParam
 * @param gateContext
 * @param inParam
 * @param value
 * @param column
 * @param param
 */
function toSqlValue(connection: Connection, inParam, value, column, param) {
    if (typeof value === 'string') {
        if (column.startsWith('cd') || column.startsWith('ct') || column.startsWith('dt')) {
            inParam[param] = connection.driver.preparePersistentValue(moment(value).toDate(), {
                type: Date,
            } as any);
        } else {
            inParam[param] = value;
        }
    } else if (typeof value === 'boolean') {
        inParam[param] = value ? 1 : 0;
    } else if (moment.isDate(value)) {
        inParam[param] = connection.driver.preparePersistentValue(moment(value).toDate(), {
            type: Date,
        } as any);
    } else if (Array.isArray(value)) {
        value.forEach((val, index) => {
            inParam[`${param}_${index}`] = val;
        });
    } else {
        inParam[param] = value;
    }
}

/**
 * Ищем вложеные объекты наподопие XPATH
 * @param obj - Объект поиска
 * @param path - путь
 * @returns {*}
 */
function deepFindCheck(obj, path) {
    const paths = path.split('.');
    let current = obj;

    for (const val of paths) {
        if (current[val] === undefined || current[val] === null) {
            return false;
        }
        current = current[val];
    }
    return true;
}
/**
 * Функция преобразования даты в оракле
 * @param name
 * @param format
 */
function dateTruncOracle(name: string, format: string) {
    switch (format) {
    case '1':
        return `trunc(${name}, 'YEAR')`;
    case '2':
        return `trunc(${name}, 'MONTH')`;
    case '3':
        return `trunc(${name}, 'DDD')`;
    case '4':
        return `trunc(${name}, 'HH')`;
    case '5':
        return `trunc(${name}, 'MI')`;
    case '6':
        return `${name}`;
    default:
        return `trunc(${name}, 'DDD')`;
    }
}
/**
 * Функция преобразования даты в потгрес
 * @param name
 * @param format
 */
function dateTruncPostgreSQL(name: string, format: string) {
    switch (format) {
    case '1':
        return `date_trunc('year', ${name}::timestamp)`;
    case '2':
        return `date_trunc('month', ${name}::timestamp)`;
    case '3':
        return `date_trunc('day', ${name}::timestamp)`;
    case '4':
        return `date_trunc('hour', ${name}::timestamp)`;
    case '5':
        return `date_trunc('minute', ${name}::timestamp)`;
    case '6':
        return `date_trunc('second', ${name}::timestamp)`;
    default:
        return `date_trunc('day', ${name}::timestamp)`;
    }
}

export const filterEntityRaw = (
    connection: Connection,
    query: string,
    params: Record<string, any>,
    jlFilter?: Filter[],
) => {
    let vlFilter = '1 = 1';
    if (!isEmpty(jlFilter)) {
        jlFilter.forEach((item) => {
            const {datatype, format, property} = item;
            let {operator, value} = item;
            if (isEmpty(property) || !re.test(property)) {
                return true;
            }
            if (isEmpty(operator)) {
                return true;
            }
            operator = operator.toLowerCase();
            let nmColumn = property.toUpperCase();
            let key = `${FILTER_PREFIX}${property.toLowerCase()}`;
            let param;
            let ind = 0;
            if (isEmpty(value)) {
                return true;
            }

            while (Object.prototype.hasOwnProperty.call(params, key)) {
                key = `${FILTER_PREFIX}${property.toLowerCase()}_${ind}`;
                ind += 1;
            }

            switch (operator) {
            case 'gt':
            case '>':
                if (datatype === 'date' || nmColumn.startsWith('CD') || nmColumn.startsWith('CT')) {
                    operator = '>=';
                } else {
                    operator = '>';
                }
                break;
            case 'ge':
                operator = '>=';
                break;
            case 'lt':
            case '<':
                if (datatype === 'date' || nmColumn.startsWith('CD') || nmColumn.startsWith('CT')) {
                    operator = '<=';
                } else {
                    operator = '<';
                }
                break;
            case 'le':
                operator = '<=';
                break;
            case 'eq':
                operator = '=';
                break;
            case 'like':
                if (!value || value === '' || typeof value !== 'string') {
                    return true;
                }
                nmColumn = `UPPER(${nmColumn})`;
                value = `%${value.toUpperCase()}%`;
                break;
            case 'in':
            case 'not in': {
                if (!value || value.length === 0) {
                    return true;
                }
                let vlValue = '';
                for (let i = 0; i < value.length; i += 1) {
                    vlValue = `${vlValue},:${key}_${i}`;
                }
                param = `(${vlValue.substr(1)})`;
                break;
            }
            case '=':
            case '<=':
            case '>=':
                break;
            default: {
                return true;
            }
            }
            toSqlValue(connection, params, value, property.toLowerCase(), key);
            if (!param) {
                param = `:${key}`;
            }
            if (datatype === 'date') {
                if (connection.driver instanceof OracleDriver) {
                    nmColumn = dateTruncOracle(nmColumn, format);
                    param = dateTruncOracle(param, format);
                } else if (connection.driver instanceof PostgresDriver) {
                    nmColumn = dateTruncPostgreSQL(nmColumn, format);
                    param = dateTruncPostgreSQL(param, format);
                }
            }
            vlFilter = `${vlFilter} and ${nmColumn} ${operator} ${param}`;
            return true;
        });
    }
    return query.replace(new RegExp('&FILTER', 'g'), vlFilter);
};

export const sortEntityRaw = (query: string, jlSort?: Order[]) => {
    let vlSort = '1 ASC';
    if (!isEmpty(jlSort)) {
        vlSort = '';
        jlSort.forEach((item) => {
            const {property, direction} = item;
            if (isEmpty(property) || !re.test(property)) {
                return true;
            }
            if (isEmpty(direction) || !DIRECTIONS.includes(direction.toUpperCase())) {
                return true;
            }
            vlSort = `${vlSort}, ${property.toUpperCase()} ${direction.toUpperCase()}`;
            return true;
        });
        if (vlSort.length <= 2) {
            vlSort = null;
        } else {
            vlSort = vlSort.substr(2);
        }
    }
    return query.replace(new RegExp('&SORT', 'g'), vlSort);
};

export const emptyMacroRaw = (query: string, params: Record<string, any>, startPath?: string) => {
    let param = params;
    if (startPath) {
        param = deepParam(startPath, param);
    }
    let matcher = PATTERN_FILTER.exec(query);
    let removeBlock = [];
    if (matcher) {
        do {
            removeBlock.push(matcher[1]);
            matcher = PATTERN_FILTER.exec(query);
        } while (matcher);
    }
    removeBlock = removeBlock.filter((item) => isEmpty(deepParam(item, param)));
    return removeBlock.reduce(
        (res, item) =>
            res.replace(
                new RegExp(`/\x5c*\x5cs*##\x5cs*${item}\x5cs*\x5c*[\x5cs\x5cS]*?${item}\x5cs*##\x5cs*\x5c*/`, 'g'),
                '',
            ),
        query,
    );
};

interface IExecuteQueryRawOptions {
    filter?: IFilter[];
    order?: Order[];
    offset?: string | number;
    fetch?: string | number;
    emptyMacroPath?: string;
}

const prepareSql = (connection: Connection, query: string) => {
    return (data: Record<string, any>) => {
        const values = [];
        return {
            query: query.replace(
                /(--.*?$)|(\/\*[\s\S]*?\*\/)|('[^']*?')|("[^"]*?")|(::?)([a-zA-Z0-9_]+)/g,
                (_, ...group) => {
                    const noReplace = group.slice(0, 4);
                    const [prefix, key] = group.slice(4);
                    if (prefix === ':') {
                        values.push(data[key] || null);
                        return connection.driver.createParameter(key, values.length);
                    } else if (prefix && prefix.length > 1) {
                        return prefix + key;
                    }
                    return noReplace.find((val) => typeof val !== 'undefined');
                },
            ),
            values,
        };
    };
};

export function executeQueryJson(conn: Connection | QueryRunner, query: string, preJson: string | JsonBody) {
    const json = typeof preJson === 'string' ? (JSON.parse(preJson) as JsonBody) : preJson;

    return executeQueryRaw(
        conn,
        query,
        {json},
        {
            fetch: json.filter?.jn_fetch,
            offset: json.filter?.jn_offset,
            filter: json.filter?.jl_filter,
            order: json.filter?.jl_sort,
            emptyMacroPath: 'json',
        },
    );
}

export function executeQueryRaw(
    conn: Connection | QueryRunner,
    preQuery: string,
    params: Record<string, any>,
    options: IExecuteQueryRawOptions = {},
) {
    let query = preQuery;
    const connection = (conn as QueryRunner).connection || (conn as Connection);
    query = filterEntityRaw(connection, query, params, options.filter);
    query = sortEntityRaw(query, options.order);
    query = emptyMacroRaw(query, params, options.emptyMacroPath);
    if (
        !isEmpty(options.fetch) &&
        (typeof options.fetch === 'number' || (typeof options.fetch === 'string' && /^\d+$/.test(options.fetch)))
    ) {
        query = query.replace(new RegExp('&FETCH', 'g'), `${options.fetch}`);
    }

    if (
        !isEmpty(options.offset) &&
        (typeof options.offset === 'number' || (typeof options.offset === 'string' && /^\d+$/.test(options.offset)))
    ) {
        query = query.replace(new RegExp('&OFFSET', 'g'), `${options.offset}`);
    }

    const opt = prepareSql(connection, query)(params);

    return connection.query(opt.query, opt.values);
}
