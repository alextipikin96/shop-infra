import { Stack, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthorizationService } from "./services/authorization-service";

export class AuthorizationServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new AuthorizationService(this, "AuthorizationService");
  }
}
