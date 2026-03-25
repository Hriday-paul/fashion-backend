import Stripe from 'stripe';
import config from '../../config';
import { User } from '../../../generated/prisma/client';

export const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});

interface IPayload {
  products: {
    amount: number;
    name: string;
    images : string[]
    quantity: number;
  }[];
  // customerId: string;
  paymentId: string;
  user : User
}

export const createCheckoutSession = async (payload: IPayload) => {

  const paymentGatewayData = await stripe.checkout.sessions.create({
    line_items: payload?.products?.map(prod=>({
        price_data: {
          currency: 'usd',
          product_data: {
            name: prod?.name,
            images : prod?.images
          },
          unit_amount: Math.round(prod?.amount * 100),
        },
        quantity: prod?.quantity,
      })),

    customer_email : payload?.user?.email ?? undefined,

    success_url: `${config.SERVER_URL}/payments/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payload?.paymentId}`,

    cancel_url: `${config?.BASE_URL}${config?.cancel_url}`,

    // `${config.server_url}/payments/cancel?paymentId=${payload?.paymentId}`,
    mode: 'payment',
    // metadata: {
    //   user: JSON.stringify({
    //     paymentId: payment.id,
    //   }),
    // },
    invoice_creation: {
      enabled: true,
    },
    // customer: payload?.customerId,
    // payment_intent_data: {
    //   metadata: {
    //     payment: JSON.stringify({
    //       ...payment,
    //     }),
    //   },
    // },
    payment_method_types: ['card', "us_bank_account"],
    // payment_method_types: ['card'], //, 'paypal'
  });
  
  return paymentGatewayData;
};
