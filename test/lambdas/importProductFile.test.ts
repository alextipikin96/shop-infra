import * as AWS from "aws-sdk";
import { importProductsFile } from "../../lib/lambdas/importProductsFile";

const getSignedUrlPromiseMock = jest.fn();
AWS.S3.prototype.getSignedUrlPromise = getSignedUrlPromiseMock;

describe("importProductsFile", () => {
  beforeEach(() => {
    getSignedUrlPromiseMock.mockClear();
  });

  it("should return 400 if fileName is missing", async () => {
    const event = { queryStringParameters: {} };
    const result = await importProductsFile(event, {} as any, () => {});
    expect(result.statusCode).toBe(400);
  });

  it("should return signed url", async () => {
    getSignedUrlPromiseMock.mockResolvedValue("signed-url");
    const event = { queryStringParameters: { fileName: "test.csv" } };
    const result = await importProductsFile(event, {} as any, () => {});
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("signed-url");
  });

  it("should return 500 on error", async () => {
    getSignedUrlPromiseMock.mockRejectedValue(new Error("fail"));
    const event = { queryStringParameters: { fileName: "test.csv" } };
    const result = await importProductsFile(event, {} as any, () => {});
    expect(result.statusCode).toBe(500);
  });
});
