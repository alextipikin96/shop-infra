import { Product } from "./product";

export type Stock = {
  product_id: Product["id"];
  count: number;
}