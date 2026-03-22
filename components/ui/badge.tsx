import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors', {
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary',
      success: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
      destructive: 'bg-rose-100 text-rose-700',
      outline: 'border border-border text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
