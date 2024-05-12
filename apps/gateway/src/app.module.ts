import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose } from '@apollo/gateway';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [],
        }),
      },
    }),

    // forRoot<>() => The root module is the starting point Nest uses to build the application graph
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
