import { describe, it, expect } from 'vitest';
import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

function synth(): Template {
  const app = new App();
  const stack = new FrontendStack(app, 'TestFrontend');
  return Template.fromStack(stack);
}

describe('FrontendStack', () => {
  it('creates exactly one private, encrypted S3 bucket', () => {
    const t = synth();
    t.resourceCountIs('AWS::S3::Bucket', 1);
    t.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: Match.anyValue(),
      },
    });
  });

  it('enforces SSL via a bucket policy denying insecure transport', () => {
    const t = synth();
    t.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: { Bool: { 'aws:SecureTransport': 'false' } },
          }),
        ]),
      },
    });
  });

  it('creates a CloudFront distribution with SPA routing and index root object', () => {
    const t = synth();
    t.resourceCountIs('AWS::CloudFront::Distribution', 1);
    t.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        CustomErrorResponses: Match.arrayWith([
          Match.objectLike({
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
          Match.objectLike({
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          }),
        ]),
      }),
    });
  });

  it('uses Origin Access Control (OAC) rather than legacy OAI', () => {
    const t = synth();
    t.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  });

  it('redirects viewers to HTTPS', () => {
    const t = synth();
    t.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
        }),
      }),
    });
  });

  it('exposes the site URL as a stack output', () => {
    const t = synth();
    const outputs = t.findOutputs('SiteUrl');
    expect(Object.keys(outputs)).toHaveLength(1);
  });
});
