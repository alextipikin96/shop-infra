import { Handler } from "aws-lambda";
import * as AWS from "aws-sdk";

const s3 = new AWS.S3();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export const importProductsFile: Handler = async (event: any) => {
  try {
    const queryParams = event.queryStringParameters || {};

    const fileName = queryParams.fileName;

    if (!fileName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Missing fileName query parameter",
        }),
      };
    }

    const signedUrl = await s3.getSignedUrlPromise("putObject", {
      Bucket: process.env.IMPORT_BUCKET!,
      Key: `uploaded/${fileName}`,
      ContentType: "text/csv",
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        url: signedUrl,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};
