# Razorpay Route Payment Integration

## Overview
This document explains how the Razorpay Route payment system is integrated into RoomPe to allow tenants to pay rent directly to property owners.

## How It Works

### 1. Property Owner Setup
- Property owners need to set up a Razorpay linked account
- The `linkedAccountId` is stored in the property document under `payments.linkedAccountId`
- This allows payments to be routed directly to the property owner's account

### 2. Payment Flow
1. **Tenant initiates payment**: Tenant clicks "Pay Now" on their dashboard
2. **Validation**: System checks if property has a valid `linkedAccountId`
3. **Order creation**: Razorpay order is created with transfers to property owner
4. **Payment processing**: Tenant completes payment through Razorpay checkout
5. **Verification**: Payment signature is verified on the backend
6. **Status update**: Payment status is updated to "PAID" in Firestore

### 3. Code Structure

#### Payment Service (`src/services/api/paymentService.ts`)
- `processOnlinePayment()`: Creates Razorpay order and validates property setup
- `verifyPayment()`: Verifies payment signature after completion
- `getPropertyById()`: Fetches property data including Razorpay account info

#### Payment Hook (`src/hooks/usePayments.ts`)
- `processOnlinePayment()`: Wrapper for payment processing
- `verifyPayment()`: Wrapper for payment verification
- Handles loading states and error management

#### Payment Screen (`src/screens/payments/TenantPaymentScreen.tsx`)
- `handlePayNow()`: Initiates Razorpay checkout
- Integrates with react-native-razorpay package
- Handles payment success/failure callbacks

### 4. Required Setup

#### Backend Server
The payment system requires a backend server running on `http://192.168.1.88:4000` with the following endpoints:

- `POST /payments/route/orders` - Create order with transfers
- `POST /payments/route/verify` - Verify payment signature
- `GET /payments/route/linked-accounts/{accountId}` - Get account status

#### Property Configuration
Each property needs to have the following structure:
```typescript
{
  payments: {
    enabled: true,
    linkedAccountId: "acc_XXXX", // Razorpay linked account ID
    platformFeePercent: 2.5, // Optional platform fee
    bankDetails: {
      beneficiaryName: "Property Owner Name",
      accountNumber: "1234567890",
      ifscCode: "SBIN0001234"
    }
  }
}
```

### 5. Error Handling
- **No linked account**: Shows error message asking tenant to contact property owner
- **Payment failure**: Displays appropriate error message
- **Verification failure**: Handles signature verification errors
- **Network issues**: Handles server connectivity problems

### 6. Security Features
- Payment signatures are verified on the backend
- Property owner accounts are validated before payment
- All sensitive operations are handled server-side
- Payment data is encrypted in transit

### 7. Testing
To test the payment flow:
1. Ensure backend server is running
2. Property must have valid `linkedAccountId`
3. Use Razorpay test mode for development
4. Test with small amounts first

### 8. Production Deployment
- Update `BASE_URL` in `src/services/api/paymentApi.ts` to production server
- Use Razorpay live mode
- Ensure all property owners have completed KYC
- Test with real payment amounts

## Troubleshooting

### Common Issues
1. **"Property owner has not set up payment account"**
   - Solution: Property owner needs to create Razorpay linked account
   - Update property document with `linkedAccountId`

2. **"Cannot connect to payment server"**
   - Solution: Check if backend server is running
   - Update `BASE_URL` with correct IP address

3. **Payment verification failed**
   - Solution: Check backend server logs
   - Ensure Razorpay webhook is configured correctly

### Support
For technical support, contact the development team or refer to Razorpay Route documentation.
