import styles from './Input.module.css';

/**
 * Reusable Input component for PrepMe.
 * @param {Object} props
 * @param {string} props.label - Label text
 * @param {string} [props.error] - Error message
 * @param {string} [props.id] - Unique ID
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.required=false] - Required field
 * @param {(e) => void} [props.onChange] - Change handler
 */
export const Input = ({ label, error, id, type = 'text', placeholder, required = false, onChange, ...rest }) => {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input 
        id={id}
        type={type} 
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.error : ''}`}
        onChange={onChange}
        required={required}
        {...rest}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
