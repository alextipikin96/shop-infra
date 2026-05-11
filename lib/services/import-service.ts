import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";
import { aws_s3, RemovalPolicy } from "aws-cdk-lib";

export class ImportProduct extends Construct {
  public readonly bucket: aws_s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 Bucket
    this.bucket = new aws_s3.Bucket(this, "ImportBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [
            aws_s3.HttpMethods.GET,
            aws_s3.HttpMethods.PUT,
            aws_s3.HttpMethods.POST,
            aws_s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
        },
      ],
    });

    // Lambda for generation of Signed URL
    const importProductsFileLambda = new lambda.Function(
      this,
      "ImportProductsFileHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "importProductsFile/handler.importProductsFile",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/importProductsFile"),
        ),
        environment: {
          IMPORT_BUCKET: this.bucket.bucketName,
        },
      },
    );

    // Lambda for parsing CSV from S3
    const importFileParserLambda = new lambda.Function(
      this,
      "ImportFileParserHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(10),
        handler: "importFileParser/handler.importFileParser",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../../dist/lambdas/importFileParser"),
        ),
        environment: {
          IMPORT_BUCKET: this.bucket.bucketName,
        },
      },
    );

    // API Gateway Authorizer
    const basicAuthorizer = new apigateway.TokenAuthorizer(
      this,
      "BasicAuthorizer",
      {
        handler: lambda.Function.fromFunctionArn(
          this,
          "BasicAuthorizerHandler",
          cdk.Fn.importValue("BasicAuthorizerLambdaArn"),
        ),
        identitySource: apigateway.IdentitySource.header("Authorization"),
      },
    );

    // S3 Event Notification for Lambda-parser
    this.bucket.addEventNotification(
      aws_s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/", suffix: ".csv" },
    );

    // Permissions for Lambda functions
    this.bucket.grantReadWrite(importFileParserLambda);
    this.bucket.grantPut(importProductsFileLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service",
      description: "API for importing products from CSV files.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda),
      {
        authorizer: basicAuthorizer,
      },
    );
  }
}
