import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export enum MessageType {
    'all' = 'all',
    'warning' = 'warning',
    'error' = 'error',
    'info' = 'info',
    'notification' = 'notification',
    'debug' = 'debug',
    'block' = 'block',
    'unblock' = 'unblock',
}

export type MessageTypeStrings = keyof typeof MessageType;

export class Result {
    [key: string]: any;
    @ApiProperty({
        required: false,
    })
    cv_error?: Record<string, string[]>;
    @ApiProperty({
        required: false,
    })
    jt_form_message?: Record<string, Record<string, string[] | string[][]>>;
    @ApiProperty({
        required: false,
    })
    jt_return_form_data?: Record<string, any>;
    @ApiProperty({
        required: false,
    })
    jt_return_form_break?: Record<string, any>;
    @ApiProperty({
        required: false,
    })
    jt_message?: Record<MessageTypeStrings, string[][]>;

    @Exclude()
    public isError = false;
    @Exclude()
    public isWarning = false;
    /**
     * Устонавливаем сообщение
     * @param type тип сообщения
     * @param field наименования поля
     * @param code код ошибки | строка | uuid localization
     * @param args Дополнительные параметры
     * @returns 
     */
    public addMessage(type: MessageType, code: string | number, ...args: string[]) {
        if (type === MessageType.warning) {
            this.isWarning = true;
        }
        if (type === MessageType.error) {
            this.isError = true;
        }
        if (typeof code === 'number') {
            if (!this.cv_error) {
                this.cv_error = {};
            }
            this.cv_error[code] = args || [];
        } else {
            if (!this.jt_message) {
                this.jt_message = {} as Record<MessageTypeStrings, string[][]>;
            }
            if (!this.jt_message[type]) {
                this.jt_message[type] = [];
            }
            this.jt_message[type].push([code, ...(args || [])]);
        }
        return this;
    }

    /**
     * Устонавливаем сообщение на поле
     * @param type тип сообщения
     * @param field наименования поля
     * @param code код ошибки | строка | uuid localization
     * @param args Дополнительные параметры
     * @returns 
     */
    public addMessageField(type: MessageType, field: string, code: string | number, ...args: string[]) {
        if (type === MessageType.warning) {
            this.isWarning = true;
        }
        if (type === MessageType.error) {
            this.isError = true;
        }
        if (!this.jt_form_message) {
            this.jt_form_message = {};
        }
        if (!this.jt_form_message[field]) {
            this.jt_form_message[field] = {};
        }
        if (typeof code === 'number') {
            this.jt_form_message[field][code] = args || [];
        } else {
            if (!this.jt_form_message[field][type]) {
                this.jt_form_message[field][type] = [] as string[];
            }
            (this.jt_form_message[field][type] as string[][]).push([code, ...(args || [])]);
        }
        return this;
    }

    /**
     * Возращаем данные в форму
     * @param field наименование поля
     * @param value значения
     * @returns 
     */
    public addFieldReturn(field: string, value: any) {
        if (!this.jt_return_form_data) {
            this.jt_return_form_data = {};
        }
        this.jt_return_form_data[field] = value;
        return this;
    }

    /**
     * Возращаем данные в форму (со сбросом)
     * @param field наименование поля
     * @param value значения
     * @returns 
     */
    public addFieldReturnBreak(field: string, value: any) {
        if (!this.jt_return_form_break) {
            this.jt_return_form_break = {};
        }
        this.jt_return_form_break[field] = value;
        return this;
    }

    /**
     * Добавляем в ответ ошибку
     * @param code код ошибки | строка | uuid localization
     * @param args Дополнительные параметры
     * @returns 
     */
    public setError(code: string | number, ...args: string[]) {
        this.addMessage(MessageType.error, code, ...args);
        return this;
    }

    /**
     * Добавляем в ответ предупреждение
     * @param code код ошибки | строка | uuid localization
     * @param args Дополнительные параметры
     * @returns 
     */
    public setWarning(code: string | number, ...args: string[]) {
        this.addMessage(MessageType.warning, code, ...args);
        return this;
    }

    /**
     * Добавляем в ответ ошибку в поле
     * @param field поле формы
     * @param code код ошибки | строка | uuid localization
     * @param args Дополнительные параметры
     * @returns 
     */
    public setErrorField(field: string, code: string | number, ...args: string[]) {
        this.addMessageField(MessageType.error, field, code, ...args);
        return this;
    }

    /**
     * Добавляем в ответ предупреждение в поле
     * @param field поле формы
     * @param code код ошибки | строка | uuid localization
     * @param args Дополнительные параметры
     * @returns 
     */
    public setWarningField(field: string, code: string | number, ...args: string[]) {
        this.addMessageField(MessageType.warning, field, code, ...args);
        return this;
    }

    /**
     * Устанавливаем уникальный индетицикатор
     * @param value значение
     * @param name наименование поля
     * @returns 
     */
    public setId(value: any, name = 'ck_id') {
        this[name] = value;
        return this;
    }
}