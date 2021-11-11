import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EssenceCoreAuth } from './modules/EssenceCoreAuth';
import { AppLogger } from './services/AppLogger';
import { Job } from './job/Job';
import './Constant';
export async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true, logger: new AppLogger() });

    const config = new DocumentBuilder()
        .setTitle('essence-devops')
        .setDescription('DevOps Manager')
        .setVersion('1.0.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('apiDoc', app, document);
    app.useGlobalPipes(new ValidationPipe());

    if (process.env.ESSENCE_CORE_URL) {
        app.useGlobalGuards(new EssenceCoreAuth());
    }

    new Job().start();
    
    await app.listen(parseInt(process.env.HTTP_PORT || '3000', 10));
}
