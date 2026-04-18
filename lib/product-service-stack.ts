import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, "GetProductsListHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "handler.getProductsList",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambdas/getProductsList")),
    });

    const api = new apigateway.RestApi(this, "GetProductsListApi", {
      restApiName: "Get Products List Service",
      description: "This service returns a list of products.",
    });

    const getProductsListIntegration = new apigateway.LambdaIntegration(
      lambdaFunction,
    );

    const productsResource = api.root.addResource("products");

    productsResource.addMethod("GET", getProductsListIntegration);
  }
}
