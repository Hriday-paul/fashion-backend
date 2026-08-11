import { Router } from 'express';
import { paymentsController } from './payments.controller';
import auth from '../../middleware/auth';
import { donationCheckoutValidator } from './payments.validation';
import req_validator from '../../middleware/req_validation';
import { Role } from '../../../generated/prisma/enums';
import { allRoles } from '../user/user.rout';

const router = Router();

export const excludedCharityRoles: Role[] = [
  Role.CHARITABLE_ORGANIZATION,
  Role.CHARITY_SHOP,
];

router.post('/donation/checkout', donationCheckoutValidator, req_validator(), auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), paymentsController.donationCheckout);

router.get(
  '/my-payment',
  auth(...allRoles),
  paymentsController.getPaymentsByUserId,
);

// router.get(
//   '/paymentbyuserId/:id',
//   auth(USER_ROLE.school_admin),
//   paymentsController.getPaymentsByUserIdWithParams,
// );

router.get('/confirm-payment',
  paymentsController.confirmPayment);

router.get('/confirm-donation',
  paymentsController.confirmDonationPayment);

// router.patch('/:id', auth(USER_ROLE.school_admin), paymentsController.updatePayments);

// router.delete('/:id', auth(USER_ROLE.school_admin), paymentsController.deletePayments);

// router.get(
//   '/:id',
//   auth(USER_ROLE.school_admin, USER_ROLE.school_admin),
//   paymentsController.getPaymentsById,
// );

router.get('/', auth(Role.ADMIN), paymentsController.getAllPayments);

export const paymentsRoutes = router;
