// Email Templates for ERP System

interface PurchaseOrder {
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  supplierName: string;
  supplierEmail: string;
  totalAmount: string;
  currencyCode: string;
  lines: Array<{
    productName: string;
    description?: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
}

interface RFQ {
  rfqNumber: string;
  rfqDate: string;
  deadlineDate?: string;
  title: string;
  description?: string;
  organizationName: string;
  lines: Array<{
    productName: string;
    description?: string;
    quantity: string;
    targetPrice?: string;
  }>;
  suppliers: Array<{
    name: string;
    email: string;
  }>;
}

interface SupplierWelcome {
  supplierName: string;
  organizationName: string;
  organizationLogo?: string;
  contactPerson?: string;
}

export const getPurchaseOrderEmailTemplate = (po: PurchaseOrder, organizationName: string, organizationLogo?: string): string => {
  const lineItemsHtml = po.lines.map((line, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <strong>${line.productName}</strong>
        ${line.description ? `<br><span style="color: #6b7280; font-size: 0.875rem;">${line.description}</span>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${line.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${po.currencyCode} ${line.unitPrice}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${po.currencyCode} ${line.total}</strong></td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Order - ${po.poNumber}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          ${organizationLogo ? `<img src="${organizationLogo}" alt="${organizationName}" style="max-width: 150px; margin-bottom: 15px;">` : ''}
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${organizationName}</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Purchase Order</p>
        </div>

        <!-- PO Details -->
        <div style="padding: 30px;">
          <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">PO #${po.poNumber}</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">PO Date</p>
                <p style="margin: 5px 0; color: #1f2937; font-weight: 600;">${po.poDate}</p>
              </div>
              ${po.expectedDeliveryDate ? `
              <div>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Expected Delivery</p>
                <p style="margin: 5px 0; color: #1f2937; font-weight: 600;">${po.expectedDeliveryDate}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Dear ${po.supplierName},</h3>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            We are pleased to send you this Purchase Order. Please review the details below and confirm your acceptance at your earliest convenience.
          </p>

          <!-- Line Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 5%;">#</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 12%;">Quantity</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 15%;">Unit Price</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 15%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="padding: 15px; text-align: right; font-weight: 600; color: #1f2937; border-top: 2px solid #e5e7eb;">Total Amount:</td>
                <td style="padding: 15px; text-align: right; font-weight: 700; color: #667eea; font-size: 18px; border-top: 2px solid #e5e7eb;">${po.currencyCode} ${po.totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>📋 Next Steps:</strong> Please confirm receipt and acceptance of this PO by replying to this email or contacting us directly.
            </p>
          </div>

          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 10px;">
            Thank you for your continued partnership.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin: 0;">
            Best regards,<br>
            <strong>${organizationName}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated email. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getRFQEmailTemplate = (rfq: RFQ, organizationName: string, organizationLogo?: string): string => {
  const lineItemsHtml = rfq.lines.map((line, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <strong>${line.productName}</strong>
        ${line.description ? `<br><span style="color: #6b7280; font-size: 0.875rem;">${line.description}</span>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${line.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${line.targetPrice || 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Request for Quotation - ${rfq.rfqNumber}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); padding: 30px; text-align: center;">
          ${organizationLogo ? `<img src="${organizationLogo}" alt="${organizationName}" style="max-width: 150px; margin-bottom: 15px;">` : ''}
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${organizationName}</h1>
          <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Request for Quotation</p>
        </div>

        <!-- RFQ Details -->
        <div style="padding: 30px;">
          <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 20px; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px;">RFQ #${rfq.rfqNumber}</h2>
            <h3 style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; font-weight: 500;">${rfq.title}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">RFQ Date</p>
                <p style="margin: 5px 0; color: #1f2937; font-weight: 600;">${rfq.rfqDate}</p>
              </div>
              ${rfq.deadlineDate ? `
              <div>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Deadline</p>
                <p style="margin: 5px 0; color: #dc2626; font-weight: 600;">${rfq.deadlineDate}</p>
              </div>
              ` : ''}
            </div>
          </div>

          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Dear Supplier,</h3>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            We are inviting you to submit a quotation for the following items. Please review the requirements carefully and provide your best pricing.
          </p>
          ${rfq.description ? `
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Description:</strong></p>
            <p style="margin: 10px 0 0 0; color: #4b5563; line-height: 1.6;">${rfq.description}</p>
          </div>
          ` : ''}

          <!-- Line Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 5%;">#</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 15%;">Quantity</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 20%;">Target Price</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">
              <strong>⏰ Important:</strong> ${rfq.deadlineDate ? `Please submit your quotation by <strong>${rfq.deadlineDate}</strong>` : 'Please submit your quotation at your earliest convenience'}.
            </p>
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              Your quotation should include pricing, delivery time, payment terms, and any other relevant details.
            </p>
          </div>

          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 10px;">
            We look forward to receiving your competitive quotation.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin: 0;">
            Best regards,<br>
            <strong>${organizationName}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated email. Please reply with your quotation.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getSupplierWelcomeEmailTemplate = (data: SupplierWelcome): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${data.organizationName}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 700px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
          ${data.organizationLogo ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-width: 150px; margin-bottom: 20px; background-color: white; padding: 10px; border-radius: 8px;">` : ''}
          <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Welcome!</h1>
          <p style="color: #d1fae5; margin: 15px 0 0 0; font-size: 18px;">You're now a valued supplier of ${data.organizationName}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Congratulations, ${data.supplierName}!</h2>
          
          <p style="color: #4b5563; line-height: 1.8; margin-bottom: 20px; font-size: 16px;">
            We are delighted to welcome you as an official supplier partner of <strong style="color: #059669;">${data.organizationName}</strong>. 
            This marks the beginning of what we hope will be a long and mutually beneficial business relationship.
          </p>

          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">What This Means for You:</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Direct access to our procurement team</li>
              <li>Regular purchase orders and business opportunities</li>
              <li>Transparent communication and timely payments</li>
              <li>Potential for long-term partnership growth</li>
            </ul>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Next Steps:</h3>
            <ol style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Keep your contact information up to date</li>
              <li>Respond promptly to our RFQs and Purchase Orders</li>
              <li>Maintain the quality standards we expect</li>
              <li>Communicate any potential delays or issues proactively</li>
            </ol>
          </div>

          <p style="color: #4b5563; line-height: 1.8; margin-bottom: 15px; font-size: 16px;">
            We value quality, reliability, and partnership. We're confident that together, we can achieve great success.
          </p>

          <p style="color: #4b5563; line-height: 1.8; margin-bottom: 25px; font-size: 16px;">
            Should you have any questions or need assistance, please don't hesitate to reach out to our procurement team.
          </p>

          <div style="text-align: center; margin: 35px 0 25px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; border-radius: 25px; font-weight: 600; font-size: 16px;">
              🤝 Welcome to the Team!
            </div>
          </div>

          <p style="color: #4b5563; line-height: 1.8; margin: 0; font-size: 16px;">
            Warm regards,<br>
            <strong style="color: #1f2937; font-size: 18px;">${data.organizationName}</strong><br>
            ${data.contactPerson ? `<span style="color: #6b7280;">${data.contactPerson}</span>` : '<span style="color: #6b7280;">Procurement Team</span>'}
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0; color: #059669; font-weight: 600; font-size: 14px;">
            ${data.organizationName}
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated welcome email from our ERP system.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
