# CDK Single Page Web App Deployment with CloudFront/S3 and OAC
A modification on the original SPA deployment repository, showing how to use CloudFront and S3 with an OAC rather than the deprecated OAI, with an SSL cert and custom domain name.

Update: [2.156.0](https://github.com/aws/aws-cdk/releases/tag/v2.156.0) has released with the OAC functionality built in! Thanks to [Grace Luo for her PR](https://github.com/aws/aws-cdk/pull/31254), this has been a hugely requested feature.

## Notes
* This repo is partially set up to be one deployment/stack per environment (dev, prod, etc.) but for sake of simplicity I am simply using one domain. If you want to use subdomains for deployments, you will need to modify the code further.

`cdk deploy --context environment=dev --profile YOUR_PROFILE`

* You will need to upload something into the bucket in order for the CloudFront distribution to have something to serve, I have a sample vue app [here](https://github.com/Cloudmancermedia/vue-app.git). Once you clone it, just:

`cd vue-app`\
`npm i`\
`npm run build`\
`aws s3 cp --recursive dist s3://BUCKET_NAME --profile YOUR_PROFILE`

**Profile flag is optional if you don't use them, or only have your AWS CLI config/credentials set up to deploy to one AWS account.

* Before deletion of the stack, the ACM certificate and CloudFront entries will need to be removed manually from the Route 53 hosted Zone in order for it to delete properly. 

* The S3 bucket will need to be emptied and deleted separately as they are retained by default on stack deletion if you do not have `autoDeleteObjects` or `removalPolicy` set. 

## Original workaround method for OAC (versions <2.156.0)
* This method uses the `CloudfrontWebDistribution` construct that is deprecated in v2.156.0 and up.
* I have left all the code for this workaround method in `lib/cdk-spa-deployment-oac-stack-OLD-METHOD.ts` in case someone needs it if they are unable to upgrade to v2.156.0
* This is a [solution construct](https://github.com/awslabs/aws-solutions-constructs/blob/main/source/patterns/%40aws-solutions-constructs/aws-cloudfront-s3/lib/index.ts) that implements this solution under the hood.
* The S3 bucket will need to be emptied and deleted separately as they are retained by default on stack deletion. It might be possible to change this behavior by setting `autoRemoveObjects` and `removalPolicy` on the bucket construct, however I am not sure if this will interfere with the bucket policy that the OAC/CloudFront need to read objects.
* Some [docs](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-s3.html) on the construct.
* This [GitHub Issue](https://github.com/aws/aws-cdk/issues/21771) was helpful for understanding the issue and for providing some of the eventual solution, specifically [this comment](https://github.com/aws/aws-cdk/issues/21771#issuecomment-1281190832).
* The [OAC construct docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.CfnOriginAccessControl.html)