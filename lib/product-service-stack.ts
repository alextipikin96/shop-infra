import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { ProductService } from "./product-service";

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ProductService(this, "ProductService");
  }
}
