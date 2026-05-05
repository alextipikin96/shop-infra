import { S3Handler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { SendMessageResult } from "aws-sdk/clients/sqs";

const csv = require("csv-parser");

const s3 = new AWS.S3({ region: process.env.AWS_REGION || "eu-central-1" });
const sqs = new AWS.SQS();
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;

export const importFileParser: S3Handler = async (event: any) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

      if (!key.startsWith("uploaded/") || !key.endsWith(".csv")) continue;

      const s3Stream = s3
        .getObject({ Bucket: bucket, Key: key })
        .createReadStream();

      const promises: Array<Promise<SendMessageResult>> = [];

      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csv())
          .on("data", (data: any) => {
            console.log("Parsed record:", data);

            const sqsMessage = {
              MessageBody: JSON.stringify(data),
              QueueUrl: SQS_QUEUE_URL,
            };

            const sendMessagePromise = sqs.sendMessage(sqsMessage).promise();
            promises.push(sendMessagePromise);
          })
          .on("end", async () => {
            console.log(`Finished parsing file: ${key}`);

            try {
              await Promise.all(promises);
              await s3
                .copyObject({
                  Bucket: bucket,
                  CopySource: `${bucket}/${key}`,
                  Key: key.replace("uploaded/", "parsed/"),
                })
                .promise();
              await s3.deleteObject({ Bucket: bucket, Key: key }).promise();

              console.log(
                `Moved file from ${key} to ${key.replace("uploaded/", "parsed/")}`,
              );

              resolve();
            } catch (err) {
              console.error("Error moving/parsing file:", err);
              reject(err);
            }
          })
          .on("error", (err: any) => {
            console.error("Error parsing CSV:", err);
            reject(err);
          });
      });
    }

    return;
  } catch (error) {
    console.error("Error in importFileParser:", error);
    throw error;
  }
};
