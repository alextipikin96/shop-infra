import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Handler } from "aws-lambda";

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});
const productsTableName = process.env.PRODUCTS_TABLE || "Products";
const stockTableName = process.env.STOCK_TABLE || "Stock";

export const createProductHandler: Handler = async (event: any) => {
  try {
    // Log the incoming event for debugging purposes
    console.log("EVENT:", JSON.stringify(event));

    // Unify the body parsing to handle both string and object formats
    let body;
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else if (typeof event.body === "object" && event.body !== null) {
      body = event.body;
    } else {
      body = event;
    }

    console.log("BODY:", JSON.stringify(body));

    // Validation of required fields
    const { title, description, price, count } = body;
    if (!title || !description || price === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const id = uuidv4();

    // Create product in Products
    await dynamoDB.send(
      new PutItemCommand({
        TableName: productsTableName,
        Item: {
          id: { S: id },
          title: { S: title },
          description: { S: description },
          price: { N: price.toString() },
        },
      }),
    );

    // Create stock in Stock
    await dynamoDB.send(
      new PutItemCommand({
        TableName: stockTableName,
        Item: {
          product_id: { S: id },
          count: { N: (count ?? 0).toString() },
        },
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Product created successfully",
        product: {
          id,
          title,
          description,
          price,
          count: count ?? 0,
        },
      }),
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to create product" }),
    };
  }
};
