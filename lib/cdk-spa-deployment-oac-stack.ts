import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { ViewerProtocolPolicy, Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';

interface S3CloudFrontStackProps extends StackProps {
  environment: string;
}

export class CdkSpaDeploymentOacStack extends Stack {
  constructor(scope: Construct, id: string, props: S3CloudFrontStackProps) {
    super(scope, id, props);

    // Simpler, cleaner, modernized method below

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

    // Dynamically name the S3 bucket based on the environment
    const bucket = new Bucket(this, `MyBucket-${environment}`, {
      bucketName: `my-spa-bucket-${environment}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const dist = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        // Using new S3BucketOrigin construct with OAC functionality built in! aws-cdk (and lib) version 2.156.0 and up
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      domainNames: [domainName],
      certificate,
    });

    new ARecord(
      this,
      'ARecord',
      {
        zone: hostedZone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(dist))
      }
    );
  }
}
