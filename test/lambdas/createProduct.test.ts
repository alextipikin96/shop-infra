import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { createProductHandler } from "../../lib/lambdas/createProduct";

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));
jest.mock("@aws-sdk/client-dynamodb");

const sendMock = jest.fn();
DynamoDBClient.prototype.send = sendMock;

describe("createProductHandler", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("should return 400 if required fields are missing", async () => {
    const event = { body: JSON.stringify({ title: "t", price: 1 }) };
    const result = await createProductHandler(event, {} as any, () => {});
    expect(result.statusCode).toBe(400);
  });

  it("should create product and stock and return 201", async () => {
    sendMock.mockResolvedValue({});
    const event = {
      body: JSON.stringify({
        title: "t",
        description: "d",
        price: 1,
        count: 2,
      }),
    };
    const result = await createProductHandler(event, {} as any, () => {});
    expect(result.statusCode).toBe(201);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("should return 500 on error", async () => {
    sendMock.mockRejectedValue(new Error("fail"));
    const event = {
      body: JSON.stringify({
        title: "t",
        description: "d",
        price: 1,
        count: 2,
      }),
    };
    const result = await createProductHandler(event, {} as any, () => {});
    expect(result.statusCode).toBe(500);
  });
});
