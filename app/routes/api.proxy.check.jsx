import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const { productId, customerId } = await request.json();

    if (!productId || !customerId) {
      return json({ exists: false });
    }

    const found = await prisma.rental.findFirst({
      where: { productId, customerId },
    });

    return json({ exists: !!found });
  } catch (err) {
    console.error("Error checking wishlist status:", err);
    return json({ exists: false });
  }
};
