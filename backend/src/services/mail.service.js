import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.MAILER_HOST,
    port: parseInt(process.env.MAILER_PORT),
    secure: process.env.MAILER_SECURE === "true",
    auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
    },
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Mail Transport Error:", error);
    } else {
        console.log("Mail Transport is ready to send messages");
    }
});

/**
 * Sends an email notification when a PO is uploaded.
 * @param {Object} order - The order document (populated with products and dealer).
 */
export const sendPOUploadNotification = async (order) => {
    try {
        const recipient = process.env.PO_NOTIFICATION_RECIPIENT;
        const from = process.env.MAILER_FROM;

        const dealer = order.dealerId;
        const dealerName = order.metadata?.DealerName || dealer?.companyName || dealer?.name || "N/A";
        const dealerCode = dealer?.code || "N/A";
        const dealerEmail = dealer?.email || "N/A";
        const dealerPhone = dealer?.phone || dealer?.contact || "N/A";

        const productListHtml = order.products.map(item => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.productId?.name || "Unknown Product"}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString()}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join("");

        const mailOptions = {
            from: `"LOVOL DMS" <${from}>`,
            to: recipient,
            subject: `New PO Uploaded: Order ${order.orderNumber} - ${dealerName}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                    <div style="text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 10px; margin-bottom: 20px;">
                        <h2 style="color: #2563EB; margin: 0;">LOVOL DMS - New PO Notification</h2>
                    </div>
                    
                    <p>Hello Lovol Team,</p>
                    <p>A new Purchase Order (PO) has been uploaded for the following order:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Details</h3>
                        <table style="width: 100%;">
                            <tr><td><strong>Order Number:</strong></td><td>${order.orderNumber}</td></tr>
                            <tr><td><strong>Total Value:</strong></td><td>₹${order.totalValue.toLocaleString()}</td></tr>
                            <tr><td><strong>Upload Time:</strong></td><td>${new Date().toLocaleString()}</td></tr>
                        </table>
                    </div>

                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Dealer/Distributor Details</h3>
                        <table style="width: 100%;">
                            <tr><td><strong>Name:</strong></td><td>${dealerName}</td></tr>
                            <tr><td><strong>Code:</strong></td><td>${dealerCode}</td></tr>
                            <tr><td><strong>Email:</strong></td><td>${dealerEmail}</td></tr>
                            <tr><td><strong>Phone:</strong></td><td>${dealerPhone}</td></tr>
                        </table>
                    </div>

                    <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Product List</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Price</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productListHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>Total</strong></td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;"><strong>₹${order.totalValue.toLocaleString()}</strong></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${order.documents.po.url}" style="background-color: #2563EB; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View PO Document</a>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
                        This is an automated notification from the LOVOL DMS platform. Please do not reply to this email.
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Notification email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending PO notification email:", error);
        throw error;
    }
};
