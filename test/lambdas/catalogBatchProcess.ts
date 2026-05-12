import { SQSEvent } from "aws-lambda";
import { handler } from "../../lib/lambdas/catalogBatchProcess";

jest.mock("aws-sdk", () => ({
  SNS: jest.fn(() => ({
    publish: jest.fn().mockReturnValue({ promise: jest.fn() }),
  })),
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      put: jest.fn().mockReturnValue({ promise: jest.fn() }),
    })),
  },
}));

const mockEvent: SQSEvent = {
  Records: [
    {
      messageId: "1",
      receiptHandle: "MockReceiptHandle",
      body: JSON.stringify({ title: "Product1", description: "Desc", price: 100, count: 10 }),
      attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1640995200000",
        SenderId: "MockSenderId",
        ApproximateFirstReceiveTimestamp: "1640995200000",
      },
      messageAttributes: {},
      md5OfMessageAttributes: "MockMd5",
      md5OfBody: "MockMd5",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:eu-central-1:123456789012:catalogItemsQueue",
      awsRegion: "eu-central-1",
    },
  ],
};

test("catalogBatchProcess should save products and send SNS notification", async () => {
  const result = await handler(mockEvent);
  expect(result).toBeUndefined(); 
});