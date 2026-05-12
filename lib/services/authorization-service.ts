import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class AuthorizationService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const basicAuthorizerLambda = new lambda.Function(
      this,
      "BasicAuthorizerHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "basicAuthorizer/handler.basicAuthorizer",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/basicAuthorizer"),
        ),
        environment: {
          ["alextipikin96"]: "TEST_PASSWORD",
        },
      },
    );

    basicAuthorizerLambda.addPermission("ApiGatewayInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*/*/*`,
    });

    new cdk.CfnOutput(this, "AuthorizerFunctionArn", {
      value: basicAuthorizerLambda.functionArn,
      exportName: "BasicAuthorizerLambdaArn",
    });
  }
}
