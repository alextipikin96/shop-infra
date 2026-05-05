import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

export class ProductService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // DynamoDB tables
    const productsTable = new dynamodb.Table(this, "Products", {
      tableName: "Products",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(this, "Stock", {
      tableName: "Stock",
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda functions

    const sharedLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
    };

    const getProductsListLambda = new lambda.Function(
      this,
      "GetProductsListHandler",
      {
        ...sharedLambdaProps,
        handler: "getProductsList/handler.getProductsList",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/getProductsList"),
        ),
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCK_TABLE: stockTable.tableName,
        },
      },
    );

    const getProductByIdLambda = new lambda.Function(
      this,
      "GetProductByIdHandler",
      {
        ...sharedLambdaProps,
        handler: "getProductById/handler.getProductById",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/getProductById"),
        ),
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCK_TABLE: stockTable.tableName,
        },
      },
    );

    const createProductLambda = new lambda.Function(
      this,
      "CreateProductHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "createProduct/handler.createProductHandler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/createProduct"),
        ),
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCK_TABLE: stockTable.tableName,
        },
      },
    );

    // API Gateway
    const api = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service",
      description: "This service provides product management functionality.",
    });

    // Integrations
    const getProductsListIntegration = new apigateway.LambdaIntegration(
      getProductsListLambda,
    );

    const getProductByIdIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambda,
    );

    const createProductIntegration = new apigateway.LambdaIntegration(
      createProductLambda,
    );

    // API Resources and Methods
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET", getProductsListIntegration);
    productsResource.addMethod("POST", createProductIntegration);

    const productIdResource = productsResource.addResource("{productId}");
    productIdResource.addMethod("GET", getProductByIdIntegration);

    // Permissions
    productsTable.grantReadData(getProductsListLambda);
    productsTable.grantReadData(getProductByIdLambda);
    productsTable.grantWriteData(createProductLambda);
    stockTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductByIdLambda);
    stockTable.grantWriteData(createProductLambda);
  }
}
