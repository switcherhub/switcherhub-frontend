export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  requiresPaymentMethod: boolean;
  status: string;
}
