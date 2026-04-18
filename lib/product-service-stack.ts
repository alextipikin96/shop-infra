import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda functions
    const getProductsListFunction = new lambda.Function(
      this,
      "GetProductsListHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "getProductsList/handler.getProductsList",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../dist/lambdas/getProductsList"),
        ),
      },
    );

    const getProductByIdFunction = new lambda.Function(
      this,
      "GetProductByIdHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "getProductById/handler.getProductById",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../dist/lambdas/getProductById"),
        ),
      },
    );

    // API Gateway
    const api = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service",
      description: "This service provides product management functionality.",
    });


    // Integrations
    const getProductsListIntegration = new apigateway.LambdaIntegration(
      getProductsListFunction,
    );

    const getProductByIdIntegration = new apigateway.LambdaIntegration(
      getProductByIdFunction,
    );

    // API Resources and Methods
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET", getProductsListIntegration);

    const productIdResource = productsResource.addResource("{productId}");
    productIdResource.addMethod("GET", getProductByIdIntegration);
  }
}
