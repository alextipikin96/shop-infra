#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/deploy-web-app-stack";
import { ProductServiceStack } from "../lib/product-service-stack";
import { ImportProductStack } from "../lib/import-product-stack";

const app = new cdk.App();
new DeployWebAppStack(app, "DeployWebAppStack");
new ProductServiceStack(app, "ProductServiceStack");
new ImportProductStack(app, "ImportProductStack");
