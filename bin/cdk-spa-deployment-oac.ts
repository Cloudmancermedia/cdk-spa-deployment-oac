#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CdkSpaDeploymentOacStack } from '../lib/cdk-spa-deployment-oac-stack';

const app = new App();

const environment = app.node.tryGetContext('environment') || 'dev'; // Default to 'dev' if not provided

new CdkSpaDeploymentOacStack(app, `S3CloudFrontOACStack-${environment}`, {
  environment: environment,
});

app.synth();