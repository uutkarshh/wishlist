import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // adjust path if needed
import prisma from "../db.server"; // adjust path if needed

const GET_PRODUCTS_QUERY = `
  query getProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;
export const action = async ({ request }) => {
  let customerId;
  try {
    const body = await request.json();
    customerId = body.customerId;
  } catch (error) {
    console.error("❌ Failed to parse request JSON", error);
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!customerId) {
    console.warn("⚠️ Missing customerId in request");
    return json({ error: "Missing customerId" }, { status: 400 });
  }

  // ✅ Use App Proxy Authentication
  let admin;
  try {
    console.log("🔐 Starting Shopify app proxy authentication...");
    const result = await authenticate.public.appProxy(request);
    admin = result.admin;
    console.log("✅ App proxy authentication success");
    console.log("🔐 Admin client:", admin);
    if (!admin) throw new Error("Admin client unavailable after auth");
  } catch (error) {
    console.error("❌ App proxy authentication failed:", error);
    return json({ error: "App proxy authentication failed" }, { status: 401 });
  }

  console.log("📦 Fetching wishlist items for customer ID:", customerId);
  const wishlistItems = await prisma.rental.findMany({
    where: { customerId },
    select: { productId: true },
  });

  const productIds = wishlistItems.map((item) => item.productId);

  const shopifyIds = productIds.map((id) => `gid://shopify/Product/${id}`);

  if (shopifyIds.length === 0) {
    console.log("📭 No wishlist products found. Returning empty array.");
    return json([]);
  }

  console.log("📡 Sending GraphQL request to Shopify admin...");
  const response = await admin.graphql(GET_PRODUCTS_QUERY, {
    variables: { ids: shopifyIds },
  });

  const jsonResp = await response.json();

  const products = jsonResp.data.nodes.filter(Boolean).map((node) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    image: node.featuredImage?.url || null,
    alt: node.featuredImage?.altText || "",
  }));
  const wishlists = jsonResp.data.nodes.filter(Boolean).map((node) => ({
    title: node.title,
    image: node.featuredImage?.url || null,
  }));
  console.log("✅ Final formatted product list:", wishlists);

  return json(products);
};
