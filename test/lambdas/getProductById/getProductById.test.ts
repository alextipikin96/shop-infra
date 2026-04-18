import { getProductById } from "../../../lib/lambdas/getProductById/handler";
import { products } from "../../../lib/lambdas/shared/data";

describe('getProductById', () => {
  it('should return product by id', async () => {
    const event = { pathParameters: { productId: products[0].id } };
    const result = await getProductById(event);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(products[0]);
  });

  it('should return 404 if product not found', async () => {
    const event = { pathParameters: { productId: 'not-exist' } };
    const result = await getProductById(event);
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });
});