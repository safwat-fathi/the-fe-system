import React from 'react';
import { Button as HeroButton, ButtonProps as HeroButtonProps } from '@heroui/react';
import { clsx } from 'clsx';

interface ButtonProps extends Omit<HeroButtonProps, 'color'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const getVariantProps = () => {
    switch (variant) {
      case 'primary':
        return { color: 'primary' as const };
      case 'secondary':
        return { color: 'default' as const };
      case 'success':
        return { color: 'success' as const };
      case 'danger':
        return { color: 'danger' as const };
      case 'warning':
        return { color: 'warning' as const };
      case 'ghost':
        return { variant: 'ghost' as const };
      default:
        return { color: 'primary' as const };
    }
  };

  return (
    <HeroButton
      {...getVariantProps()}
      size={size}
      isLoading={loading}
      isDisabled={disabled || loading}
      className={clsx(
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </HeroButton>
  );
};

export default Button;
