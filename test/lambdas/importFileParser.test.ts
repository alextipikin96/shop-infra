import * as AWS from "aws-sdk";
import { importFileParser } from "../../lib/lambdas/importFileParser";

jest.mock("aws-sdk");
jest.mock("csv-parser", () => () => ({
  on: function (event: string, cb: Function) {
    if (event === "data") setTimeout(() => cb({ test: "row" }), 10);
    if (event === "end") setTimeout(() => cb(), 20);
    return this;
  },
}));

const getObjectMock = jest.fn().mockReturnValue({
  createReadStream: () => ({
    pipe: () => ({
      on: function (event: string, cb: Function) {
        if (event === "data") setTimeout(() => cb({ test: "row" }), 10);
        if (event === "end") setTimeout(() => cb(), 20);
        return this;
      },
    }),
  }),
});
AWS.S3.prototype.getObject = getObjectMock;
AWS.S3.prototype.copyObject = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve() });
AWS.S3.prototype.deleteObject = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve() });

describe("importFileParser", () => {
  beforeEach(() => {
    getObjectMock.mockClear();
  });

  it("should parse and move file", async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: "bucket" },
            object: { key: "uploaded/test.csv" },
          },
        },
      ],
    };
    await importFileParser(event as any, {} as any, () => {});
    expect(getObjectMock).toHaveBeenCalled();
  });

  it("should skip non-uploaded files", async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: "bucket" },
            object: { key: "other/test.csv" },
          },
        },
      ],
    };
    await importFileParser(event as any, {} as any, () => {});
    expect(getObjectMock).not.toHaveBeenCalled();
  });
});
