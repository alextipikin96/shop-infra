import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});
const productsTableName = process.env.PRODUCTS_TABLE || "Products";
const stockTableName = process.env.STOCK_TABLE || "Stock";

export async function getProductsList() {
  try {
    const productsResult = await dynamoDB.send(
      new ScanCommand({ TableName: productsTableName }),
    );
    const stockResult = await dynamoDB.send(
      new ScanCommand({ TableName: stockTableName }),
    );

    const products = (productsResult.Items || []).map((item) => ({
      id: item.id.S,
      title: item.title.S,
      description: item.description.S,
      price: Number(item.price.N),
    }));

    const stock = (stockResult.Items || []).map((item) => ({
      product_id: item.product_id.S,
      count: Number(item.count.N),
    }));

    const result = products.map((product) => {
      const stockItem = stock.find((s) => s.product_id === product.id);
      return {
        ...product,
        count: stockItem ? stockItem.count : 0,
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch products" }),
    };
  }
}
