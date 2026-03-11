import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { USER_ROLE } from '../user/user.constants';
import auth from '../../middleware/auth';
import { checkoutValidator } from './payments.validation';
import req_validator from '../../middleware/req_validation';
import { Role } from '../../../generated/prisma/enums';

const router = Router();

router.post('/checkout', checkoutValidator, req_validator(), auth(Role.User), paymentsController.checkout);

router.get(
  '/my-payment',
  auth(Role.User),
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
