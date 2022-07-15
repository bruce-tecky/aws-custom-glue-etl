# Xtra Sensing Project - IoT Data Warehouse

<u>Phase 1: Proof of concept</u>

Aim: This phase aims at building a dashboard for IoT data visualization

### Part 1

Data Flow:

Route 1
1. IoT devices >> MQTT >> On-site computer
2. On-site computer >> AWS-KINESIS (Kinesis Firehose)
3. AWS-KINESIS >> AWS-S3 (Data Lake)
4. AWS-S3 (trigger) >> AWS-LAMBDA >> NodeJS Web-backend (Machine Health Check)

`
Note:
AWS-KINESIS-FIREHOSE allows data flow to AWS-S3 and other storage.
AWS-KINESIS-STREAM allows data to be managed by AWS-LAMBDA 
`

Route 2
1. On-site computer generate binary data >> AWS-KINESIS >> AWS-S3
2. AWS-S3 (trigger) >> AWS-LAMBDA >> http request (with binary data url in AWS-S3) to Dr.Wan's REST API
3. (after calculation) REST API >> fetch result to AWS-KINESIS (Kinesis Firehose) >> AWS-S3 

Stack:
1. AWS-CDK
2. AWS-KINESIS
3. AWS-FIREHOSE
4. AWS-S3
5. AWS-LAMBDA

### Part 2

Data Flow:
1. AWS-S3 >> AWS-LAMBDA(CPP)
2. AWS-LAMBDA(CPP) >> [AWS-DOCDB, AWS-S3]
3. AWS-S3 >> AWS-GLUE >> AWS-RDS(POSTGRES)

Stack:
1. AWS-S3
2. AWS-LAMBDA
3. AWS-DOCDB
4. AWS-GLUE
5. AWS-RDS(POSTGRES)

## Installation
<i>AWS-CDK (Cloud Development Kit)</i>

AWS-CDK tutorial: https://cdkworkshop.com/

MacOS:
1. Download and install AWS-CLI
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"

sudo installer -pkg AWSCLIV2.pkg -target /
```

2. Setup (with IAM user keyID and accessKey)
```
aws configure
```
(Pls refer to [Internal] project share drive (/Enki's current info/Credential) for the Keys below)
```
AWS Access Key ID [None]: <type key ID here>
AWS Secret Access Key [None]: <type access key>
Default region name [None]: ap-southeast-1
Default output format [None]: <leave blank>
```

3. +/- Install AWS-CDK toolkit
(alternatively, if aws-cdk is installed only in project folder, you need to use ```npx cdk```)
```bash
sudo npm install -g aws-cdk
```

4. IDE (vscode) extension: AWS Toolkit

## Prepare Services

1. check cdk version
```
npx cdk --version
```

2. start project
```bash
mkdir myProject && cd myProject
npm install aws-cdk
mkdir app && cd app
npx cdk init sample-app --language typescript
```
note:
- Entry Point: bin/app.ts
- Stack: lib/app-stack.ts

3. create Cloud Formation template
```bash
npx cdk synth
```

4. install cdk bootstrap and deploy to aws
```bash
npx cdk bootstrap
```
```bash
npx cdk deploy
```
quick version: not for production
```bash
npx cdk deploy --hotswap
```

5. check different between current works and deployed works
```bash
npx cdk diff
```
(to check deployed stack: AWS-CloudFormation)

6. Cleanup Sample code
lib/cdk-workshop-stack.ts
```ts
import * as cdk from 'aws-cdk-lib';

export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // nothing here!
  }
}
```

---
7. delete the stacks
```
npx cdk destroy
```

8. AWS-CLI send file to s3
```bash
aws s3 cp ./testing.txt s3://appstack-rawbucket75d7d708-ppdqz0c9rmy8
```



---
[NOTE]
### Lambda Function
1. Create Lambda Function

example 1

lambda/hello.js
```js
exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({'message': `Testing, CDK~ You've hit ${event.path}`})
    };
};
```

2. Update stack.ts

lib/cdk-workshop-stack.ts
```ts
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define an AWS Lambda resource
    const testing = new lambda.Function(this, "TestingHandler", { // aws web portal lambda function name: TestingHandler
      runtime: lambda.Runtime.NODEJS_14_X,  // environment
      code: lambda.Code.fromAsset("lambda"),  // source code folder "lambda"
      handler: "testing.handler"  // file: "testing.js", function: "handler"
    })


    // define an API gateway (RESTFUL) for Lambda function
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: testing   // lamber function name defined in line10
    
    // 2022-07-12 19:52
    // Outputs:
    //AppStack.Endpoint8024A810 = https://ytje1g96gf.execute-api.ap-southeast-1.amazonaws.com/prod/
    //Stack ARN:
    //arn:aws:cloudformation:ap-southeast-1:576021032212:stack/AppStack/e30dcaa0-0140-11ed-8f86-0204daf69cde
    });
  }
}
```


example 2

/lambda/s3HttpFetchLambda.js
```js
exports.handler = async function (event){
    console.log("s3HttpFetchLambda")
    event.Records.forEach((record) => {
        console.log("event.Records.forEach")
        console.log('Event Name: %s', record.eventName)
        console.log('s3 Request: %j', record.s3)
    })
}
```

/lib/app-stack.ts
```ts
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

const S3_ACCESS_POINT_NAME = "xssensors";

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const rawBucket = new s3.Bucket(this, "rawBucket", {
      // for testing only. remove for production
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

      // add for secure testing
      // accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      // blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    const s3HttpFetchLambda = new lambda.Function(this, 's3HttpFetchLambda', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 's3HttpFetchLambda.handler',
      functionName: 's3HttpFetchLambda',
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    const s3PutEventSource = new lambdaEventSources.S3EventSource(rawBucket, {
      events: [
        s3.EventType.OBJECT_CREATED_PUT
      ]
    });

    s3HttpFetchLambda.addEventSource(s3PutEventSource)










    // further setup: https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/s3-object-lambda/lib/s3-object-lambda-stack.ts
    // Delegating access control to access points
    // https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-points-policies.html
    /*
    rawBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        principals: [new iam.AnyPrincipal()],
        resources: [rawBucket.bucketArn, rawBucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "s3:DataAccessPointAccount": `${cdk.Aws.ACCOUNT_ID}`,
          },
        },
      })
    );
*/

    /* lambda example

    // define an AWS Lambda resource
    const testing = new lambda.Function(this, "TestingHandler", { // aws web portal lambda function name: TestingHandler
      runtime: lambda.Runtime.NODEJS_14_X,  // environment
      code: lambda.Code.fromAsset("lambda"),  // source code folder "lambda"
      handler: "testing.handler"  // file: "testing.js", function: "handler"
    })


    // define an API gateway (RESTFUL) for Lambda function
    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: testing   // lamber function name defined in line10
    
    // 2022-07-12 19:52
    // Outputs:
    //AppStack.Endpoint8024A810 = https://ytje1g96gf.execute-api.ap-southeast-1.amazonaws.com/prod/
    //Stack ARN:
    //arn:aws:cloudformation:ap-southeast-1:576021032212:stack/AppStack/e30dcaa0-0140-11ed-8f86-0204daf69cde
    });

*/
  }
}
```

