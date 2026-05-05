import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { count } from "console";
import { getProductById } from "../../lib/lambdas/getProductById";

const sendMock = jest.fn();
DynamoDBClient.prototype.send = sendMock;

describe("getProductById", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("should return 404 if product not found", async () => {
    sendMock.mockResolvedValueOnce({ Item: undefined });
    const event = { pathParameters: { productId: "id" } };
    const result = await getProductById(event);
    expect(result.statusCode).toBe(404);
  });

  it("should return product with count", async () => {
    sendMock
      .mockResolvedValueOnce({
        Item: {
          id: { S: "id" },
          title: { S: "t" },
          description: { S: "d" },
          price: { N: "1" },
        },
      })
      .mockResolvedValueOnce({
        Item: { product_id: { S: "id" }, count: { N: "2" } },
      });
    const event = { pathParameters: { productId: "id" } };
    const result = await getProductById(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('"count":2');
  });

  it("should return 500 on error", async () => {
    sendMock.mockRejectedValue(new Error("fail"));
    const event = { pathParameters: { productId: "id" } };
    const result = await getProductById(event);
    expect(result.statusCode).toBe(500);
  });
});
