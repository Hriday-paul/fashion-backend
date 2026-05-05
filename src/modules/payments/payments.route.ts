import { Router } from 'express';
import { paymentsController } from './payments.controller';
import auth from '../../middleware/auth';
import { checkoutValidator } from './payments.validation';
import req_validator from '../../middleware/req_validation';
import { Role } from '../../../generated/prisma/enums';
import { allRoles } from '../user/user.rout';

const router = Router();

router.post('/checkout', checkoutValidator, req_validator(), auth(Role.INDIVIDUAL_USER), paymentsController.checkout);

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

// router.patch('/:id', auth(USER_ROLE.school_admin), paymentsController.updatePayments);

// router.delete('/:id', auth(USER_ROLE.school_admin), paymentsController.deletePayments);

// router.get(
//   '/:id',
//   auth(USER_ROLE.school_admin, USER_ROLE.school_admin),
//   paymentsController.getPaymentsById,
// );

router.get('/', auth(Role.ADMIN), paymentsController.getAllPayments);

export const paymentsRoutes = router;
