import Purchases, {
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';

const API_KEY = 'test_QoIpmFHMVFDxuzrrCalJEmHXOMK';
const ENTITLEMENT_ID = 'Falcly Pro';

let configured = false;

/**
 * Initialize RevenueCat SDK — call once at app startup
 */
export async function initializeRevenueCat(): Promise<void> {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  }
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
}

export function isRevenueCatConfigured(): boolean {
  return configured;
}

/**
 * Identify a user (call after sign-in)
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

/**
 * Log out user (call on sign-out).
 * No-op if the current user is already anonymous.
 */
export async function logoutUser(): Promise<CustomerInfo> {
  if (await Purchases.isAnonymous()) {
    return await Purchases.getCustomerInfo();
  }
  return await Purchases.logOut();
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return await Purchases.getCustomerInfo();
}

/**
 * Check if user has Pro entitlement
 */
export async function hasProAccess(): Promise<boolean> {
  const customerInfo = await getCustomerInfo();
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

/**
 * Get subscription tier based on entitlements
 */
export function getTierFromCustomerInfo(customerInfo: CustomerInfo): 'free' | 'pro' | 'pro_plus' {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return 'free';

  const productId = entitlement.productIdentifier;
  if (productId.includes('pro_plus')) return 'pro_plus';
  return 'pro';
}

/**
 * Get available offerings (products)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoListener(
  listener: (customerInfo: CustomerInfo) => void,
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    // RevenueCat handles listener cleanup internally
  };
}

/**
 * Get expiration date for active subscription
 */
export function getExpirationDate(customerInfo: CustomerInfo): Date | null {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement?.expirationDate) return null;
  return new Date(entitlement.expirationDate);
}

/**
 * Check if subscription is in grace period
 */
export function isInGracePeriod(customerInfo: CustomerInfo): boolean {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return false;
  return entitlement.periodType === 'GRACE_PERIOD';
}

export { ENTITLEMENT_ID };
