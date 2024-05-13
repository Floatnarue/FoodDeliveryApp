//  Create a Resolver in NestJS for Efficient GraphQL APIs
// https://medium.com/@bramprasetyop/create-a-resolver-in-nestjs-for-efficient-graphql-apis-772b11a5927a

import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { ActivationResponse, ForgotPasswordResponse, LoginResponse, LogoutResponse, RegisterResponse, ResetPasswordResponse } from './types/user.types';
import { ActivationDto, ForgotPasswordDto, RegisterDto, ResetPasswordDto } from './dto/user.dto';
import { Response } from 'express';
import { User } from './entities/user.entities';
import { AuthGuard } from '../guards/auth.guard';

/*
a resolver is responsible for resolving the queries and mutations 
efined in your GraphQL schema. Each query or mutation maps to a resolver function,
 which retrieves or manipulates the data requested by the client.
    Resolvers act as the bridge between your GraphQL schema ,
    and the underlying data sources or services.


*/

@Resolver('User')
export class UserResolver {
  constructor(private readonly userService: UsersService) {}
  // In graphQL , we dont have get / post / .. but instead we have Mutation / Query
  @Mutation(() => RegisterResponse)
  //we use the @Mutation() decorator to indicate that the createUser() function represents a GraphQL mutation.
  async register(
    @Args('registerInput') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ): Promise<RegisterResponse> {
    if (!registerDto.name || !registerDto.email || !registerDto.password) {
      throw new BadRequestException('Please fill all the fields');
    }
    const {activation_token } = await this.userService.register(registerDto, context.res);
    
    return { activation_token };
  }

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationInput') activationDto: ActivationDto,
    @Context() context: { res: Response },
  ): Promise<ActivationResponse> {
    
    return await this.userService.activationUser(activationDto , context.res) ;
    

  }

  @Mutation(() => LoginResponse) 
  async Login(@Args('email') email : string,
  @Args('password') password :string ) : Promise<LoginResponse>{
    return await this.userService.login({email,password})
    
  }

  @Mutation(() => ForgotPasswordResponse)
  async forgotPassword(
    @Args('forgotPasswordDto') forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> {
    return await this.userService.forgotPassword(forgotPasswordDto);
  }

  @Mutation(() => ResetPasswordResponse)
  async resetPassword(
    @Args('resetPasswordDto') resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    return await this.userService.resetPassword(resetPasswordDto);
  }

  @Query(()=> LoginResponse) 
  @UseGuards(AuthGuard)
  async getLoginUser(@Context() context: {req :Request}) {
    return await this.userService.getLoginUser(context.req) ;
    
  }


  @Query(()=> LogoutResponse) 
  @UseGuards(AuthGuard)
  async Logout(@Context() context: {req : Request}) {
    return await this.userService.Logout(context.req) ; 
  }

  

  @Query(() => [User])
  // decorator indicates that the getUsers() function returns an array of User objects, which should match the type defined in the GraphQL schema.
  async getUsers() {
    return this.userService.getUsers();
  }
}
