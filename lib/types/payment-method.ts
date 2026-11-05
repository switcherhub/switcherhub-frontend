export interface PaymentMethod {
  id: string;
  workspaceId: string;
  stripePaymentMethodId: string;
  stripeCustomerId: string;
  type: 'card';
  cardDetails: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  addedById: string;
  addedBy?: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SetupIntentResponse {
  clientSecret: string;
  setupIntentId: string;
}
