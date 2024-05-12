import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { UsersService } from './users.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserResolver } from './user.resolver';
import { EmailModule } from './email/email.module';
import { EmailService } from './email/email.service';
import { HttpModule } from '@nestjs/axios';
import { CorsMiddleware } from './cors.middleware';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal : true ,
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver : ApolloFederationDriver,
      autoSchemaFile : {
        // use the federation version 2
        federation : 2,
      },
      playground : true,
      
      
    }),
    HttpModule.register({
      baseURL: "http://localhost:4001/graphql", // Your GraphQL server URL
      // Other axios options can be configured here
    }),

    
    EmailModule,
    
    
    
    
  ],
  controllers: [],
  providers: [UsersService,ConfigService,JwtService,PrismaService,UserResolver,EmailService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
