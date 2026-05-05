import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getProductsList } from "../../lib/lambdas/getProductsList";

const sendMock = jest.fn();
DynamoDBClient.prototype.send = sendMock;

describe("getProductsList", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("should return products with stock", async () => {
    sendMock
      .mockResolvedValueOnce({
        Items: [
          {
            id: { S: "id" },
            title: { S: "t" },
            description: { S: "d" },
            price: { N: "1" },
          },
        ],
      })
      .mockResolvedValueOnce({
        Items: [{ product_id: { S: "id" }, count: { N: "2" } }],
      });
    const result = await getProductsList();
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('"count":2');
  });

  it("should return 500 on error", async () => {
    sendMock.mockRejectedValue(new Error("fail"));
    const result = await getProductsList();
    expect(result.statusCode).toBe(500);
  });
});
