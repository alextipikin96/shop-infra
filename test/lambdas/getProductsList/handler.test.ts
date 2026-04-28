import { getProductsList } from "../../../lib/lambdas/getProductsList/handler";
import { products } from "../../../lib/lambdas/shared/data";

describe('getProductsList', () => {
  it('should return all products', async () => {
    const result = await getProductsList();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(products);
  });
});