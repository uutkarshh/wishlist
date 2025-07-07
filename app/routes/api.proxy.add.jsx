// app/routes/rental/add.jsx
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }) {
  try {
    const { customerId, productId } = await request.json();

    if (!customerId || !productId) {
      return json(
        { success: false, error: "Missing customerId or productId" },
        { status: 400 },
      );
    }
    console.log("................adding");
    const existing = await prisma.rental.findFirst({
      where: { customerId, productId },
    });

    if (existing) {
      return json({
        success: true,
        message: "Already exists",
        rental: existing,
      });
    }
    console.log("................adding", customerId, productId);

    const newRental = await prisma.rental.create({
      data: {
        customerId,
        productId,
      },
    });

    return json({ success: true, message: "Rental added", rental: newRental });
  } catch (error) {
    console.error("Rental Add Error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function loader() {
  return json(
    { success: false, message: "Use POST method only" },
    { status: 405 },
  );
}
