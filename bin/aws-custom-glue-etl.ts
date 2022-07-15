#!/usr/bin/env node

/**
 *  Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { AwsCustomGlueEtlStack } from '../lib/aws-custom-glue-etl-stack';

const app = new App();
new AwsCustomGlueEtlStack(app, 'AwsCustomGlueEtlStack');



/* 
source:
https://github.com/awslabs/aws-solutions-constructs/tree/main/source/use_cases/aws-custom-glue-etl

Outputs:
AwsCustomGlueEtlStack.GlueJob = CustomETLKinesisETLJob04F57-JEUy744HVi2g
AwsCustomGlueEtlStack.JobRole = arn:aws:iam::576021032212:role/AwsCustomGlueEtlStack-CustomETLJobRole53A1671F-1SUPGLOTNO6X8
AwsCustomGlueEtlStack.KinesisStreamName = AwsCustomGlueEtlStack-CustomETLKinesisStreamB4F1869F-OuDOOE2XaUVT
Stack ARN:
arn:aws:cloudformation:ap-southeast-1:576021032212:stack/AwsCustomGlueEtlStack/ae65b390-0432-11ed-9568-0647bab7fb5a

*/