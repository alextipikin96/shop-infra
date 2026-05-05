import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});
const productsTableName = process.env.PRODUCTS_TABLE || "Products";
const stockTableName = process.env.STOCK_TABLE || "Stock";

export async function getProductById(event: any) {
  const productId = event.pathParameters?.productId;

  try {
    const productResult = await dynamoDB.send(
      new GetItemCommand({
        TableName: productsTableName,
        Key: { id: { S: productId } },
      }),
    );

    if (!productResult.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Product not found" }),
      };
    }

    const product = {
      id: productResult.Item.id.S,
      title: productResult.Item.title.S,
      description: productResult.Item.description.S,
      price: Number(productResult.Item.price.N),
    };

    const stockResult = await dynamoDB.send(
      new GetItemCommand({
        TableName: stockTableName,
        Key: { product_id: { S: productId } },
      }),
    );

    const count = stockResult.Item ? Number(stockResult.Item.count.N) : 0;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ ...product, count }),
    };
  } catch (error) {
    console.error("Error fetching product by id:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch product" }),
    };
  }
}
