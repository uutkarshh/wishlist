import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  console.log("........................................", request);
  await authenticate.admin(request);
  return null;
};
