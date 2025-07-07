// app/routes/rental/remove.jsx
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }) {
  try {
    const { customerId, productId } = await request.json();
    console.log(
      "......................................",
      customerId,
      productId,
    );

    if (!customerId || !productId) {
      return json(
        { success: false, error: "Missing customerId or productId" },
        { status: 400 },
      );
    }

    const deleted = await prisma.rental.deleteMany({
      where: {
        customerId,
        productId,
      },
    });

    if (deleted.count === 0) {
      return json(
        { success: false, message: "No matching rental found" },
        { status: 404 },
      );
    }
    console.log(
      "...................loader.............proxyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy......",
    );

    return json({ success: true, message: "Rental removed" });
  } catch (error) {
    console.error("Rental Remove Error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function loader() {
  return json(
    { success: false, message: "Use POST method only" },
    { status: 405 },
  );
}
