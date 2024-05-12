import { InputType,Field } from "@nestjs/graphql";
import { IsEmail,IsNotEmpty,IsString, MinLength } from "class-validator";

@InputType()
// Create datatypeobject for registration
export class RegisterDto {
    @Field()
    @IsNotEmpty({
        message : 'Name is required',
    })
    @IsString({
        message : 'Name must be string'
    })
    name : string;


    @Field()
    @IsNotEmpty({
        message : 'password is required'
    
    })
    @MinLength(8,{
        message : 'At least 8 character required for password'
    })
    
    password : string ;

    @Field()
    @IsNotEmpty({
        message : 'Email is required',
    })
    @IsString({
        message : 'email must be string'
    })
    email : string;

    @Field()
    @IsNotEmpty({
        message : "Phone number is required"
    })
    phone_number : number ;
    
    @Field()
    @IsNotEmpty({
        message : 'Email is required',
    })
    
    @IsString({
        message : 'address must be string'
    })
    address? : string;



}

@InputType()
export class ActivationDto {

    @Field()
    @IsNotEmpty({
        message : "Activation token is required"
    })
    activationToken : string 

    
    @Field()
    @IsNotEmpty({
        message : "Activation code is required"
    })
    activationCode : string 

    
}


@InputType()
export class LoginDto{
    @Field()
    @IsNotEmpty({
        message : 'email is required',
    })
    @IsEmail({},{
        message : 'Email must be valid'
    })
    email : string;
    
    @Field()
    @IsNotEmpty({
        message : 'password is required'
    
    })
    
    
    password : string ;
    
}

