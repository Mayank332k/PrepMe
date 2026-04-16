import styles from './Card.module.css';

/**
 * Modern Card component for PrepMe.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} [props.padding=true] - Whether card should have padding
 * @param {string} [props.className] - Additional class names
 */
export const Card = ({ children, padding = true, className = '', ...rest }) => {
  const classNames = [
    styles.card,
    padding ? styles.padding : '',
    className
  ].join(' ').trim();

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};
