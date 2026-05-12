import { SQSEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import * as AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE!;
const snsTopicArn = process.env.SNS_TOPIC_ARN!;

export const handler = async (event: SQSEvent) => {
  console.log("Processing batch:", JSON.stringify(event));

  const productPromises = event.Records.map(async (record) => {
    try {
      const product = JSON.parse(record.body);

      const newProduct = {
        id: uuidv4(),
        title: product.title,
        description: product.description,
        price: Number(product.price),
        count: Number(product.count),
      };

      console.log("Parsed product:", newProduct);

      await dynamoDB
        .put({
          TableName: productsTableName,
          Item: newProduct,
        })
        .promise();

      console.log("Product created in DynamoDB:", newProduct);

      await sendNotificationToSNS(newProduct);
    } catch (error) {
      console.error("Error processing record:", record.body, error);
      throw error;
    }
  });

  await Promise.all(productPromises);

  console.log("Batch processing complete.");
};

const sendNotificationToSNS = async (product: {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}) => {
  const sns = new AWS.SNS();

  const message =
    `Product created:\n\n` +
    `ID: ${product.id}\n` +
    `Title: ${product.title}\n` +
    `Description: ${product.description}\n` +
    `Price: ${product.price}\n` +
    `Count: ${product.count}`;

  const params = {
    TopicArn: snsTopicArn,
    Message: message,
    Subject: `Product Created: ${product.title}`,
    MessageAttributes: {
      price: {
        DataType: "Number",
        StringValue: String(product.price),
      },
    },
  };

  try {
    const result = await sns.publish(params).promise();
    console.log(`SNS Notification sent. MessageId: ${result.MessageId}`);
  } catch (error) {
    console.error("Error sending notification to SNS:", error);
    throw error;
  }
};
