export function hasActiveAccess(
  subscriptionStatus?: string,
  trialEndsAt?: string,
  subscriptionCurrentPeriodEnd?: string
): boolean {
  if (subscriptionStatus === "active") {
    return !!subscriptionCurrentPeriodEnd && new Date(subscriptionCurrentPeriodEnd) > new Date()
  }
  if (subscriptionStatus === "trialing" && trialEndsAt) {
    return new Date(trialEndsAt) > new Date()
  }
  return false
}
