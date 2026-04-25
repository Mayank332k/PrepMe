import styles from './Button.module.css';

/**
 * Reusable Button component tailored for PrepMe guidelines.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label or icon
 * @param {'primary' | 'secondary' | 'danger'} [props.variant='primary'] - Button style variant
 * @param {boolean} [props.fullWidth=false] - Whether button should take full container width
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {() => void} [props.onClick] - Click handler
 */
export const Button = ({ children, variant = 'primary', fullWidth = false, disabled = false, loading = false, onClick, className, ...rest }) => {
  const classNames = [
    styles.btn,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    (disabled || loading) ? styles.disabled : '',
    className
  ].join(' ').trim();

  return (
    <button 
      className={classNames} 
      onClick={(!disabled && !loading) ? onClick : undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={styles.spinner}></span>}
      {children}
    </button>
  );
};
