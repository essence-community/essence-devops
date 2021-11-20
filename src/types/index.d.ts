import {UrlWithParsedQuery} from 'url';

declare global {
    namespace Express {
        interface Request {
            user?: Record<string, any>;
            _parsedUrl: UrlWithParsedQuery;
        }
    }
}
