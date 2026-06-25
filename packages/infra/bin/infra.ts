#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';

const app = new App();

new FrontendStack(app, 'PindouStudioFrontend', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Pindou Studio static frontend hosting (S3 + CloudFront)',
});

app.synth();
