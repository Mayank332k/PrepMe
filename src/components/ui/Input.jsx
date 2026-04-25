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
export const Input = ({ label, error, id, type = 'text', placeholder, required = false, onChange, suffix, ...rest }) => {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputContainer}>
        <input 
          id={id}
          type={type} 
          placeholder={placeholder}
          className={`${styles.input} ${error ? styles.error : ''} ${suffix ? styles.hasSuffix : ''}`}
          onChange={onChange}
          required={required}
          {...rest}
        />
        {suffix && <div className={styles.suffix}>{suffix}</div>}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
