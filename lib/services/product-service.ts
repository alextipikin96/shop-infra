import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
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

    const sharedLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
    };

    // SQS queue for asynchronous processing
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // SNS Topic for notifications
    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "createProductTopic",
    });

    createProductTopic.addSubscription(
      new subs.EmailSubscription("tiplica96@mail.ru"),
    );

    const filteredSubscription = new subs.EmailSubscription(
      "alextipikin96@gmail.com",
      {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThan: 50,
          }),
        },
      },
    );

    createProductTopic.addSubscription(filteredSubscription);

    // Lambda functions

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
        ...sharedLambdaProps,
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

    const catalogBatchProcessLambda = new lambda.Function(
      this,
      "CatalogBatchProcessHandler",
      {
        ...sharedLambdaProps,
        handler: "catalogBatchProcess/handler.catalogBatchProcessHandler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/catalogBatchProcess"),
        ),
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          SNS_TOPIC_ARN: createProductTopic.topicArn,
        },
      },
    );

    // Subscribe Lambda to SQS queue
    catalogBatchProcessLambda.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      }),
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
    productsTable.grantReadData(catalogBatchProcessLambda);
    productsTable.grantWriteData(createProductLambda);
    stockTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductByIdLambda);
    stockTable.grantWriteData(createProductLambda);
    createProductTopic.grantPublish(catalogBatchProcessLambda);
  }
}
