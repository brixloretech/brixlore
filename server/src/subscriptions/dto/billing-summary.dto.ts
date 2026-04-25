export class BillingPaymentMethodDto {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export class BillingInvoiceDto {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  hostedInvoiceUrl?: string | null;
  invoicePdf?: string | null;
  createdAt: string;
}

export class BillingSummaryDto {
  paymentMethod?: BillingPaymentMethodDto | null;
  invoices: BillingInvoiceDto[];
}
