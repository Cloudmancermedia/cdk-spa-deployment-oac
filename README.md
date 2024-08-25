# CDK Single Page Web App Deployment with OAC
A modification on the original SPA deployment repo, showing how use use an OAC rather than the deprecated OAI, with an SSL and custom domain name.

Hopefully, we will be seeing an L2 construct for this in the future, but for now, a workaround is needed.

## Note
* You will need to upload something into the bucket in order for the cloudfront distribution to have something to serve, I have a sample vue app [here](https://github.com/Cloudmancermedia/vue-app.git). Once you clone it, just:


`cd vue-app`\
`npm i`\
`npm run build`\
`aws s3 cp --recursive dist s3://BUCKET_NAME --profile YOUR_PROFILE`

**Profile flag is optional if you don't use them, or only have your AWS CLI config/credentials set up to deploy to one AWS account

### Notes for why this works/need for the workaround
* This is a [solution construct](https://github.com/awslabs/aws-solutions-constructs/blob/main/source/patterns/%40aws-solutions-constructs/aws-cloudfront-s3/lib/index.ts) that implements this solution under the hood.
* Some [docs](https://docs.aws.amazon.com/solutions/latest/constructs/aws-cloudfront-s3.html) on the construct.
* This [GitHub Issue](https://github.com/aws/aws-cdk/issues/21771) was helpful for understanding the issue and for prividing some of the eventual solution, specifically [this comment](https://github.com/aws/aws-cdk/issues/21771#issuecomment-1281190832).
* [Grace Luo](https://github.com/gracelu0) is currently working on an L2 construct for this and has an [open issue](https://github.com/aws/aws-cdk-rfcs/issues/617) for it that is currently in review.
* The [OAC construct docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.CfnOriginAccessControl.html)