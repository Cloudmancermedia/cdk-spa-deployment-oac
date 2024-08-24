import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { CfnOriginAccessControl, ViewerProtocolPolicy, CloudFrontWebDistribution, CloudFrontAllowedMethods, CloudFrontAllowedCachedMethods, CfnDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

interface S3CloudFrontStackProps extends StackProps {
  environment: string;
}

export class CdkSpaDeploymentOacStack extends Stack {
  constructor(scope: Construct, id: string, props: S3CloudFrontStackProps) {
    super(scope, id, props);

    const { environment } = props;

    const domainName = 'domainname.com'

    const hostedZone = new HostedZone(
      this,
      'HostedZone',
      {
        zoneName: domainName
      }
    );

    const cert = new Certificate(
      this,
      'Cert',
      {
        domainName,
        validation: CertificateValidation.fromDns(hostedZone)
      }
    );

    // Dynamically name the S3 bucket based on the environment
    const bucket = new Bucket(this, `MyBucket-${environment}`, {
      bucketName: `my-spa-bucket-${environment}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Single Origin Access Control for the environment
    const oac = new CfnOriginAccessControl(this, `MyOAC-${environment}`, {
      originAccessControlConfig: {
        name: `MyOAC-${environment}`,
        originAccessControlOriginType: 'originAccessControlOriginType',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Distribution
    const cloudFrontWebDistribution = new CloudFrontWebDistribution(this, `MyDistribution-${environment}`, {
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

    const cfnDistribution = cloudFrontWebDistribution.node.defaultChild as CfnDistribution

    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.getAtt('Id'))
  }
}
