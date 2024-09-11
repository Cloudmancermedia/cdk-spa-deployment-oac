import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { CfnOriginAccessControl, ViewerProtocolPolicy, CloudFrontWebDistribution, CloudFrontAllowedMethods, CloudFrontAllowedCachedMethods, CfnDistribution, ViewerCertificate } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

interface S3CloudFrontStackProps extends StackProps {
  environment: string;
}

export class CdkSpaDeploymentOacStack extends Stack {
  constructor(scope: Construct, id: string, props: S3CloudFrontStackProps) {
    super(scope, id, props);

    // OLD METHOD BELOW -- Deprecated

    const { environment } = props;

    const domainName = 'YOUR_DOMAIN_HERE'

    const hostedZone = new HostedZone(
      this,
      'HostedZone',
      {
        zoneName: domainName
      }
    );

    const certificate = new Certificate(
      this,
      'Cert',
      {
        domainName,
        validation: CertificateValidation.fromDns(hostedZone)
      }
    );

    const bucket = new Bucket(this, `MyBucket-${environment}`, {
      bucketName: `my-spa-bucket-${environment}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      // removalPolicy: RemovalPolicy.DESTROY,
      // autoDeleteObjects: true
    });

    // Single Origin Access Control for the environment
    const oac = new CfnOriginAccessControl(this, `MyOAC-${environment}`, {
      originAccessControlConfig: {
        name: `MyOAC-${environment}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Web Distribution (Deprecated in 2.156.0 and up)
    const cloudFrontWebDistribution = new CloudFrontWebDistribution(this, `MyDistribution-${environment}`, {
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [domainName],
      }),
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              allowedMethods: CloudFrontAllowedMethods.GET_HEAD,
              compress: true,
              cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD,
              viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              minTtl: Duration.seconds(0),
              maxTtl: Duration.seconds(86400),
              defaultTtl: Duration.seconds(3600),
            },
          ],
        },
      ]
    });

    new ARecord(
      this,
      'ARecord',
      {
        zone: hostedZone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFrontWebDistribution))
      }
    );

    // Create a policy allowing cloudfront access to the bucket
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
      resources: [bucket.arnForObjects('*')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${process.env.CDK_DEFAULT_ACCOUNT}:distribution/${cloudFrontWebDistribution.distributionId}`
        }
      }
    });
    
    bucket.addToResourcePolicy(policyStatement);
    // Override the OAC property with our OAC
    const cfnDistribution = cloudFrontWebDistribution.node.defaultChild as CfnDistribution

    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.attrId);
  }
}
