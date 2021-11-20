import {Module} from '@nestjs/common';
import * as controllers from './controllers';
import {DataBase} from './modules/DataBase';
import * as services from './services';

@Module({
    imports: [DataBase],
    controllers: [...Object.values(controllers)],
    providers: [...Object.values(services)],
    exports: [],
})
export class AppModule {}
