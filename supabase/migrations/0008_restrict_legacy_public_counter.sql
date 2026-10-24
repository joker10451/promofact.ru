-- Public increment_uses is legacy and not referenced by current site code.
-- Keep the function for service-side maintenance; prevent anonymous inflation
-- of the public coupon-count / social proof metric.
revoke execute on function public.increment_uses(text) from public, anon, authenticated;
