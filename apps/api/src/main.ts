import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  // Cloud platforms (Render, Railway, etc.) inject PORT; fall back to API_PORT locally.
  const port = process.env.PORT ? Number(process.env.PORT) : config.get<number>('API_PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: config.get<string>('WEB_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('IADL Center EMIS API')
      .setDescription('Education Management Information System for IADL Center & ADL Schools')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('tenants', 'School/Tenant Management')
      .addTag('users', 'User Management')
      .addTag('courses', 'Course & LMS Management')
      .addTag('enrollments', 'Student Enrollments')
      .addTag('sessions', 'Class Sessions')
      .addTag('attendance', 'Attendance Tracking')
      .addTag('assessments', 'Assessments & Assignments')
      .addTag('finance', 'Financial Ledger & Invoicing')
      .addTag('certificates', 'Digital Certificates')
      .addTag('notifications', 'Notifications & Messaging')
      .addTag('analytics', 'Analytics & Reporting')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port, '0.0.0.0');
  console.log(`IADL EMIS API running on http://localhost:${port}/api/v1`);
  if (nodeEnv !== 'production') {
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
