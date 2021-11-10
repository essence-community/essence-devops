import moment from 'moment-timezone';

export const DEFAULT_TIMEZONE_DATE = process.env.DEFAULT_TIMEZONE_DATE || 'Etc/GMT-3';
export const JSON_DATE_FORMAT = process.env.JSON_DATE_FORMAT || 'YYYY-MM-DDTHH:mm:ss';

Date.prototype.toJSON = function() {
    return moment(this)
        .clone()
        .tz(DEFAULT_TIMEZONE_DATE)
        .format(JSON_DATE_FORMAT);
};