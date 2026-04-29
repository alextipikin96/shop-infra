import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ImportProduct } from "./services/import-service";

export class ImportProductStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new ImportProduct(this, "ImportService");
  }
}
